use frclib_core::value::FrcValue;
use frclib_datalog::DataLogReader;
use serde_json::Value;
use std::collections::HashMap;
use std::fs::read_to_string;
use std::fs::{self, write, File};
use std::io::Write;
use std::path::{Path, PathBuf};
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
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
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
                let connect = MenuItemBuilder::with_id("connect_sim", "Connect (Simulator)")
                    .accelerator("CmdOrCtrl+Shift+K")
                    .build(app)?;
                let connect_sim = MenuItemBuilder::with_id("connect", "Connect (Saved IP)")
                    .accelerator("CmdOrCtrl+K")
                    .build(app)?;

                let submenu = SubmenuBuilder::new(app, "File")
                    .item(&connect)
                    .item(&connect_sim)
                    .separator()
                    .text("open_log", "Open Log File...")
                    .separator()
                    .text("import_config", "Import Config...")
                    .text("export_config", "Export Config...")
                    .build()?;
                let menu = MenuBuilder::new(app).item(&submenu).build()?;

                app.set_menu(menu)?;

                app.on_menu_event(move |app_handle, event| {
                    if event.id() == connect.id() {
                        app_handle.emit("connect", false).unwrap();
                    } else if event.id() == connect_sim.id() {
                        app_handle.emit("connect", true).unwrap();
                    } else if event.id() == "import_config" {
                        app_handle.emit("import_config", false).unwrap();
                    } else if event.id() == "export_config" {
                        app_handle.emit("export_config", false).unwrap();
                    } else if event.id() == "open_log" {
                        app_handle.emit("open_log", false).unwrap();
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

                if !app
                    .global_shortcut()
                    .is_registered(connect_shortcut.clone())
                {
                    if let Err(e) = app.global_shortcut().register(connect_shortcut.clone()) {
                        eprintln!("Failed to register connect shortcut: {:?}", e);
                    }
                }
                if !app
                    .global_shortcut()
                    .is_registered(connect_sim_shortcut.clone())
                {
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
            write_oxconfig,
            open_log
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

#[tauri::command]
fn open_log(log_path: String) -> HashMap<String, HashMap<u64, Value>> {
    let mut all_data: HashMap<String, HashMap<u64, Value>> = HashMap::new();
    let path = PathBuf::from(&log_path);
    let reader = DataLogReader::try_new(File::open(path).unwrap(), Default::default())
        .expect("Failed to create reader");

    reader.get_all_entry_keys().iter().for_each(|key| {
        let mut entry_data: HashMap<u64, Value> = HashMap::new();
        reader.read_entry(key).into_iter().for_each(|value| {
            entry_data.insert(
                value.timestamp,
                serde_json::to_value(frc_value_to_json(&value.value)).unwrap(),
            );
        });
        // If the key starts with NT:, remove it. If not, add /AdvantageKit/ to it.
        let modified_key = if key.starts_with("NT:") {
            key[3..].to_string()
        } else {
            format!("/AdvantageKit{}", key)
        };
        all_data.insert(modified_key, entry_data);
    });

    all_data
}

fn frc_value_to_json(value: &FrcValue) -> Value {
    match value {
        FrcValue::Void => Value::Null,
        FrcValue::Raw(data) => serde_json::json!(data),
        FrcValue::Boolean(b) => serde_json::json!(b),
        FrcValue::Int(i) => serde_json::json!(i),
        FrcValue::Double(d) => serde_json::json!(d),
        FrcValue::Float(f) => serde_json::json!(f),
        FrcValue::String(s) => serde_json::json!(s),
        FrcValue::BooleanArray(arr) => serde_json::json!(arr),
        FrcValue::IntArray(arr) => serde_json::json!(arr),
        FrcValue::FloatArray(arr) => serde_json::json!(arr),
        FrcValue::DoubleArray(arr) => serde_json::json!(arr),
        FrcValue::StringArray(arr) => serde_json::json!(arr),
        FrcValue::Struct(..) => Value::Null,
        FrcValue::StructArray(..) => Value::Null,
    }
}
