pub mod commands;
pub mod db;
pub mod error;
pub mod redis_manager;

use std::sync::Arc;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_dir = app.path().app_data_dir().expect("Failed to get app dir");
            if !app_dir.exists() {
                std::fs::create_dir_all(&app_dir).expect("Failed to create app dir");
            }

            let db = db::Database::new(app_dir).expect("Failed to initialize database");
            app.manage(db);

            let redis_manager = Arc::new(redis_manager::connection::RedisPoolManager::new());
            app.manage(redis_manager);

            let pubsub_manager = Arc::new(redis_manager::pubsub::PubSubManager::new());
            app.manage(pubsub_manager);

            if let Some(main_window) = app.get_webview_window("main") {
                if let Some(icon) = app.default_window_icon() {
                    let _ = main_window.set_icon(icon.clone());
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::connections::create_connection,
            commands::connections::get_connections,
            commands::connections::set_active_connection,
            commands::connections::disconnect_connection,
            commands::connections::delete_connection,
            commands::connections::update_connection,
            commands::connections::test_connection,
            commands::keys::redis_scan_keys,
            commands::keys::redis_get_type,
            commands::keys::redis_get_string,
            commands::keys::redis_set_string,
            commands::keys::redis_delete_key,
            commands::pubsub::pubsub_subscribe,
            commands::pubsub::pubsub_unsubscribe,
            commands::pubsub::pubsub_publish,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
