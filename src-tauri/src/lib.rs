use std::fs::read_to_string;
use std::fs::{self, write};

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![save_json, load_json])
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
