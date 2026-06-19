use crate::db::models::ConnectionRecord;
use crate::db::Database;
use crate::error::CommandError;
use crate::redis_manager::connection::RedisPoolManager;
use crate::redis_manager::pubsub::PubSubManager;
use std::sync::Arc;
use tauri::{AppHandle, State};

fn build_url(conn_record: &ConnectionRecord) -> String {
    let scheme = if conn_record.use_tls {
        "rediss"
    } else {
        "redis"
    };
    let mut url = format!("{}://", scheme);

    if let Some(username) = &conn_record.username {
        url.push_str(username);
        if let Some(password) = &conn_record.password {
            url.push_str(&format!(":{}", password));
        }
        url.push('@');
    } else if let Some(password) = &conn_record.password {
        url.push_str(&format!(":{}@", password));
    }

    url.push_str(&format!(
        "{}:{}/{}",
        conn_record.host, conn_record.port, conn_record.db_number
    ));
    url
}

#[tauri::command]
pub async fn pubsub_subscribe(
    app: AppHandle,
    db: State<'_, Database>,
    manager: State<'_, Arc<PubSubManager>>,
    connection_id: String,
    channel: String,
) -> Result<(), CommandError> {
    // Fetch connection
    let record = {
        let conn = db.conn.lock().unwrap();
        conn.query_row(
            "SELECT id, name, host, port, password, username, db_number, use_tls, is_default, created_at, updated_at FROM connections WHERE id = ?1",
            [&connection_id],
            |row| {
                Ok(ConnectionRecord {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    host: row.get(2)?,
                    port: row.get(3)?,
                    password: row.get(4)?,
                    username: row.get(5)?,
                    db_number: row.get(6)?,
                    use_tls: row.get::<_, i32>(7)? == 1,
                    is_default: row.get::<_, i32>(8)? == 1,
                    created_at: row.get(9)?,
                    updated_at: row.get(10)?,
                })
            },
        ).map_err(|_| CommandError::NotFound("Connection not found".into()))?
    };

    let url = build_url(&record);
    manager.subscribe(app, &url, &channel).await
}

#[tauri::command]
pub async fn pubsub_unsubscribe(
    manager: State<'_, Arc<PubSubManager>>,
    channel: String,
) -> Result<(), CommandError> {
    manager.unsubscribe(&channel).await
}

#[tauri::command]
pub async fn pubsub_publish(
    manager: State<'_, Arc<RedisPoolManager>>,
    channel: String,
    message: String,
) -> Result<u64, CommandError> {
    let pool = manager.get_active_pool().await?;
    let mut conn = pool
        .get()
        .await
        .map_err(|e| CommandError::ConnectionFailed(e.to_string()))?;

    let result: u64 = redis::cmd("PUBLISH")
        .arg(&channel)
        .arg(&message)
        .query_async(&mut conn)
        .await
        .map_err(|e| CommandError::RedisError(e.to_string()))?;

    Ok(result)
}
