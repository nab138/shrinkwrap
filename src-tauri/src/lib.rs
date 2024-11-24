use std::fs::read_to_string;
use std::fs::{self, write, File};
use std::io::Write;
use std::path::Path;
use std::sync::Mutex;
use tauri::Manager;

#[cfg(desktop)]
use tauri::menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder};

#[cfg(desktop)]
use tauri::Emitter;

#[cfg(desktop)]
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

lazy_static::lazy_static! {
    static ref LAST_TIMESTAMP: Mutex<u64> = Mutex::new(0);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::new().build());

    #[cfg(desktop)]
    {
        builder = builder
            .plugin(tauri_plugin_process::init())
            .plugin(tauri_plugin_updater::Builder::new().build());
    }

    builder
        .setup(|app| {
            #[cfg(desktop)]
            {
                let connect_shortcut = Shortcut::new(Some(Modifiers::CONTROL), Code::KeyK);
                let connect_sim_shortcut =
                    Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyK);
                let connect = MenuItemBuilder::with_id("connect", "Connect")
                    .accelerator("CmdOrCtrl+K")
                    .build(app)?;
                let connect_sim = MenuItemBuilder::with_id("connect_sim", "Connect (Simulator)")
                    .accelerator("CmdOrCtrl+Shift+K")
                    .build(app)?;

                let submenu = SubmenuBuilder::new(app, "File")
                    .text("open_layout", "Open Layout")
                    .text("save_layout", "Save Layout")
                    .separator()
                    .item(&connect)
                    .item(&connect_sim)
                    .build()?;
                let menu = MenuBuilder::new(app).item(&submenu).build()?;

                app.set_menu(menu)?;

                app.on_menu_event(move |app_handle, event| {
                    if event.id() == connect.id() {
                        app_handle.emit("connect", false).unwrap();
                    } else if event.id() == connect_sim.id() {
                        app_handle.emit("connect", true).unwrap();
                    }
                });

                app.handle().plugin(
                    tauri_plugin_global_shortcut::Builder::new()
                        .with_handler(move |app_handle, shortcut, event| {
                            if event.state() == ShortcutState::Released {
                                return;
                            }
                            if shortcut == &connect_shortcut {
                                app_handle.emit("connect", false).unwrap();
                            } else if shortcut == &connect_sim_shortcut {
                                app_handle.emit("connect", true).unwrap();
                            }
                        })
                        .build(),
                )?;

                if !app.global_shortcut().is_registered(connect_shortcut.clone()) {
                    if let Err(e) = app.global_shortcut().register(connect_shortcut.clone()) {
                        eprintln!("Failed to register connect shortcut: {:?}", e);
                    }
                }
                if !app.global_shortcut().is_registered(connect_sim_shortcut.clone()) {
                    if let Err(e) = app.global_shortcut().register(connect_sim_shortcut.clone()) {
                        eprintln!("Failed to register connect_sim shortcut: {:?}", e);
                    }
                }
            }
            Ok(())
        })
        .plugin(tauri_plugin_os::init())
        .invoke_handler(tauri::generate_handler![
            save_json,
            load_json,
            write_oxconfig
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn save_json(path: String, data: String, app_handle: tauri::AppHandle) -> Result<(), String> {
    let config_dir = app_handle.path().app_config_dir().unwrap();
    if !config_dir.exists() {
        fs::create_dir_all(&config_dir).map_err(|e| e.to_string())?;
    }
    let p = config_dir.join(path);
    write(p, data).map_err(|e| e.to_string())
}

#[tauri::command]
fn load_json(path: String, app_handle: tauri::AppHandle) -> Result<String, String> {
    let config_dir = app_handle.path().app_config_dir().unwrap();
    let p = config_dir.join(path);
    read_to_string(p).map_err(|e| e.to_string())
}

#[tauri::command]
fn write_oxconfig(deploy: String, data: String, timestamp: u64) -> String {
    let config_path = format!("{}/config.json", deploy);
    let path = Path::new(&config_path);

    if !path.exists() {
        return "no-exist".to_string();
    }

    let mut last_timestamp = LAST_TIMESTAMP.lock().unwrap();
    if timestamp <= *last_timestamp {
        return "time".to_string();
    }

    match File::create(&path) {
        Ok(mut file) => {
            if let Err(_) = file.write_all(data.as_bytes()) {
                return "failed".to_string();
            }
            *last_timestamp = timestamp;
            "success".to_string()
        }
        Err(_) => "failed".to_string(),
    }
}
