use crate::error::CommandError;
use deadpool_redis::Pool;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RedisInfoPayload {
    pub version: String,
    pub os: String,
    pub uptime_in_days: String,
    pub connected_clients: String,
    pub used_memory_human: String,
    pub used_memory_peak_human: String,
    pub used_memory_bytes: u64,
    pub used_memory_peak_bytes: u64,
    pub used_cpu_sys: String,
    pub used_cpu_user: String,
    pub total_keys: u64,
}

pub async fn get_server_info(pool: &Pool) -> Result<RedisInfoPayload, CommandError> {
    let mut conn = pool
        .get()
        .await
        .map_err(|e| CommandError::ConnectionFailed(e.to_string()))?;

    let info_str: String = redis::cmd("INFO").query_async(&mut conn).await?;
    let db_size: u64 = redis::cmd("DBSIZE").query_async(&mut conn).await?;

    // Parse the INFO string
    let mut payload = RedisInfoPayload {
        version: "Unknown".to_string(),
        os: "Unknown".to_string(),
        uptime_in_days: "0".to_string(),
        connected_clients: "0".to_string(),
        used_memory_human: "0B".to_string(),
        used_memory_peak_human: "0B".to_string(),
        used_memory_bytes: 0,
        used_memory_peak_bytes: 0,
        used_cpu_sys: "0.0".to_string(),
        used_cpu_user: "0.0".to_string(),
        total_keys: db_size,
    };

    for line in info_str.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }

        if let Some((key, value)) = line.split_once(':') {
            match key {
                "redis_version" => payload.version = value.to_string(),
                "os" => payload.os = value.to_string(),
                "uptime_in_days" => payload.uptime_in_days = value.to_string(),
                "connected_clients" => payload.connected_clients = value.to_string(),
                "used_memory_human" => payload.used_memory_human = value.to_string(),
                "used_memory_peak_human" => payload.used_memory_peak_human = value.to_string(),
                "used_memory" => payload.used_memory_bytes = value.parse().unwrap_or(0),
                "used_memory_peak" => payload.used_memory_peak_bytes = value.parse().unwrap_or(0),
                "used_cpu_sys" => payload.used_cpu_sys = value.to_string(),
                "used_cpu_user" => payload.used_cpu_user = value.to_string(),
                _ => {}
            }
        }
    }

    Ok(payload)
}

pub async fn ping(pool: &Pool) -> Result<String, CommandError> {
    let mut conn = pool
        .get()
        .await
        .map_err(|e| CommandError::ConnectionFailed(e.to_string()))?;
    let reply: String = redis::cmd("PING").query_async(&mut conn).await?;
    Ok(reply)
}
