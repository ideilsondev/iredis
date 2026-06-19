use crate::error::CommandError;
use crate::redis_manager;
use crate::redis_manager::info::RedisInfoPayload;
use crate::redis_manager::connection::RedisPoolManager;
use std::sync::Arc;

#[tauri::command]
pub async fn get_server_info(
    _connection_id: String,
    manager: tauri::State<'_, Arc<RedisPoolManager>>,
) -> Result<RedisInfoPayload, CommandError> {
    let pool = manager.get_active_pool().await?;
    redis_manager::info::get_server_info(&pool).await
}
