use crate::db::models::ConnectionRecord;
use crate::db::Database;
use crate::error::CommandError;
use crate::redis_manager::connection::RedisPoolManager;
use chrono::Utc;
use std::sync::Arc;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub async fn create_connection(
    db: State<'_, Database>,
    manager: State<'_, Arc<RedisPoolManager>>,
    name: String,
    host: String,
    port: u16,
    password: Option<String>,
    username: Option<String>,
    db_number: u8,
    use_tls: bool,
    is_default: bool,
) -> Result<ConnectionRecord, CommandError> {
    let record = ConnectionRecord {
        id: Uuid::new_v4().to_string(),
        name,
        host,
        port,
        password,
        username,
        db_number,
        use_tls,
        is_default,
        created_at: Utc::now().to_rfc3339(),
        updated_at: Utc::now().to_rfc3339(),
    };

    {
        let conn = db.conn.lock().unwrap();

        if is_default {
            conn.execute("UPDATE connections SET is_default = 0", [])?;
        }

        conn.execute(
            "INSERT INTO connections (id, name, host, port, password, username, db_number, use_tls, is_default, created_at, updated_at) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            (
                &record.id,
                &record.name,
                &record.host,
                record.port,
                &record.password,
                &record.username,
                record.db_number,
                if record.use_tls { 1 } else { 0 },
                if record.is_default { 1 } else { 0 },
                &record.created_at,
                &record.updated_at,
            ),
        )?;
    }

    // Attempt to connect immediately (optional, or just save)
    let _ = manager.connect(&record).await;

    Ok(record)
}

#[tauri::command]
pub fn get_connections(db: State<'_, Database>) -> Result<Vec<ConnectionRecord>, CommandError> {
    let conn = db.conn.lock().unwrap();
    let mut stmt = conn.prepare("SELECT id, name, host, port, password, username, db_number, use_tls, is_default, created_at, updated_at FROM connections ORDER BY name ASC")?;

    let connections_iter = stmt.query_map([], |row| {
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
    })?;

    let mut connections = Vec::new();
    for conn in connections_iter {
        connections.push(conn?);
    }

    Ok(connections)
}

#[tauri::command]
pub async fn set_active_connection(
    db: State<'_, Database>,
    manager: State<'_, Arc<RedisPoolManager>>,
    id: String,
) -> Result<(), CommandError> {
    // First, check if it's already connected in the pool
    if manager.set_active(&id).await.is_ok() {
        return Ok(());
    }

    // If not, fetch it from the database and connect
    let record = {
        let conn = db.conn.lock().unwrap();
        conn.query_row(
            "SELECT id, name, host, port, password, username, db_number, use_tls, is_default, created_at, updated_at FROM connections WHERE id = ?1",
            [&id],
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
        ).map_err(|_| CommandError::NotFound("Connection not found in database".into()))?
    };

    manager.connect(&record).await?;
    manager.set_active(&id).await
}

#[tauri::command]
pub async fn disconnect_connection(
    manager: State<'_, Arc<RedisPoolManager>>,
    id: String,
) -> Result<(), CommandError> {
    manager.disconnect(&id).await
}

#[tauri::command]
pub async fn delete_connection(
    db: State<'_, Database>,
    manager: State<'_, Arc<RedisPoolManager>>,
    id: String,
) -> Result<(), CommandError> {
    // Disconnect if active
    let _ = manager.disconnect(&id).await;

    let conn = db.conn.lock().unwrap();
    conn.execute("DELETE FROM connections WHERE id = ?1", [&id])?;
    Ok(())
}

#[tauri::command]
pub async fn update_connection(
    db: State<'_, Database>,
    manager: State<'_, Arc<RedisPoolManager>>,
    id: String,
    name: String,
    host: String,
    port: u16,
    password: Option<String>,
    username: Option<String>,
    db_number: u8,
    use_tls: bool,
    is_default: bool,
) -> Result<ConnectionRecord, CommandError> {
    let mut record = ConnectionRecord {
        id: id.clone(),
        name,
        host,
        port,
        password,
        username,
        db_number,
        use_tls,
        is_default,
        created_at: Utc::now().to_rfc3339(), // won't update this
        updated_at: Utc::now().to_rfc3339(),
    };

    {
        let conn = db.conn.lock().unwrap();

        // Fetch created_at to keep it
        if let Ok(created_at) = conn.query_row(
            "SELECT created_at FROM connections WHERE id = ?1",
            [&id],
            |row| row.get::<_, String>(0),
        ) {
            record.created_at = created_at;
        }

        if is_default {
            conn.execute("UPDATE connections SET is_default = 0", [])?;
        }

        conn.execute(
            "UPDATE connections SET name = ?1, host = ?2, port = ?3, password = ?4, username = ?5, db_number = ?6, use_tls = ?7, is_default = ?8, updated_at = ?9 WHERE id = ?10",
            (
                &record.name,
                &record.host,
                record.port,
                &record.password,
                &record.username,
                record.db_number,
                if record.use_tls { 1 } else { 0 },
                if record.is_default { 1 } else { 0 },
                &record.updated_at,
                &record.id,
            ),
        )?;
    }

    // Attempt to reconnect if needed (disconnect first)
    let _ = manager.disconnect(&id).await;
    let _ = manager.connect(&record).await;

    Ok(record)
}

#[tauri::command]
pub async fn test_connection(
    host: String,
    port: u16,
    password: Option<String>,
    username: Option<String>,
    db_number: u8,
    use_tls: bool,
) -> Result<String, CommandError> {
    let mut url = if use_tls {
        "rediss://".to_string()
    } else {
        "redis://".to_string()
    };

    if let Some(user) = username {
        url.push_str(&user);
        if let Some(pass) = password {
            url.push_str(&format!(":{}", pass));
        }
        url.push('@');
    } else if let Some(pass) = password {
        url.push_str(&format!(":{}@", pass));
    }

    url.push_str(&format!("{}:{}/{}", host, port, db_number));

    let client =
        redis::Client::open(url).map_err(|e| CommandError::ConnectionFailed(e.to_string()))?;

    // Attempt a quick connection and ping
    let mut con = client
        .get_multiplexed_async_connection()
        .await
        .map_err(|e| CommandError::ConnectionFailed(e.to_string()))?;

    let result: String = redis::cmd("PING")
        .query_async(&mut con)
        .await
        .map_err(|e| CommandError::ConnectionFailed(e.to_string()))?;

    Ok(result) // usually "PONG"
}
