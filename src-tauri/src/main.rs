// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            // When a second instance is launched (e.g. from a deep link on Windows),
            // focus the existing main window instead of opening a new one
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_focus();
            }

            // On Windows, the deep link URL arrives as a command-line argument
            // Forward it as an event so the frontend deep-link listener picks it up
            for arg in &argv {
                if arg.starts_with("questlog://") {
                    let _ = app.emit("deep-link://new-url", vec![arg.clone()]);
                }
            }
        }))
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_deep_link::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
