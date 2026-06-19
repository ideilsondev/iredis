use crate::error::CommandError;
use crate::redis_manager::connection::RedisPoolManager;
use crate::redis_manager::keys;
use std::sync::Arc;
use tauri::State;

#[tauri::command]
pub async fn redis_scan_keys(
    pattern: String,
    cursor: u64,
    count: u64,
    pool_manager: State<'_, Arc<RedisPoolManager>>,
) -> Result<(u64, Vec<String>), CommandError> {
    let pool = pool_manager.get_active_pool().await?;
    keys::get_keys(&pool, &pattern, cursor, count).await
}

#[tauri::command]
pub async fn redis_get_type(
    key: String,
    pool_manager: State<'_, Arc<RedisPoolManager>>,
) -> Result<String, CommandError> {
    let pool = pool_manager.get_active_pool().await?;
    keys::get_type(&pool, &key).await
}

#[tauri::command]
pub async fn redis_get_string(
    key: String,
    pool_manager: State<'_, Arc<RedisPoolManager>>,
) -> Result<String, CommandError> {
    let pool = pool_manager.get_active_pool().await?;
    keys::get_string(&pool, &key).await
}

#[tauri::command]
pub async fn redis_delete_key(
    key: String,
    pool_manager: State<'_, Arc<RedisPoolManager>>,
) -> Result<u32, CommandError> {
    let pool = pool_manager.get_active_pool().await?;
    keys::delete_key(&pool, &key).await
}

#[tauri::command]
pub async fn redis_set_string(
    key: String,
    value: String,
    pool_manager: State<'_, Arc<RedisPoolManager>>,
) -> Result<(), CommandError> {
    let pool = pool_manager.get_active_pool().await?;
    keys::set_string(&pool, &key, &value).await
}
