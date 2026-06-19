use crate::error::CommandError;
use deadpool_redis::Pool;
use redis::AsyncCommands;

// We use SCAN to prevent blocking the Redis server.
pub async fn get_keys(
    pool: &Pool,
    pattern: &str,
    cursor: u64,
    count: u64,
) -> Result<(u64, Vec<String>), CommandError> {
    let mut conn = pool
        .get()
        .await
        .map_err(|e| CommandError::ConnectionFailed(e.to_string()))?;

    // redis-rs async scan returns an AsyncIter. However, to get the next cursor properly for pagination,
    // it's easier to use the low-level command if we want explicit cursor control, but `scan` is provided.
    // Actually `redis::cmd("SCAN")` allows us to extract cursor and elements.
    let (next_cursor, keys): (u64, Vec<String>) = redis::cmd("SCAN")
        .cursor_arg(cursor)
        .arg("MATCH")
        .arg(pattern)
        .arg("COUNT")
        .arg(count)
        .query_async(&mut conn)
        .await?;

    Ok((next_cursor, keys))
}

pub async fn get_type(pool: &Pool, key: &str) -> Result<String, CommandError> {
    let mut conn = pool
        .get()
        .await
        .map_err(|e| CommandError::ConnectionFailed(e.to_string()))?;
    let key_type: String = redis::cmd("TYPE").arg(key).query_async(&mut conn).await?;
    Ok(key_type)
}

pub async fn get_string(pool: &Pool, key: &str) -> Result<String, CommandError> {
    let mut conn = pool
        .get()
        .await
        .map_err(|e| CommandError::ConnectionFailed(e.to_string()))?;
    let value: String = conn.get(key).await?;
    Ok(value)
}

pub async fn delete_key(pool: &Pool, key: &str) -> Result<u32, CommandError> {
    let mut conn = pool
        .get()
        .await
        .map_err(|e| CommandError::ConnectionFailed(e.to_string()))?;
    let deleted: u32 = conn.del(key).await?;
    Ok(deleted)
}

pub async fn set_string(pool: &Pool, key: &str, value: &str) -> Result<(), CommandError> {
    let mut conn = pool
        .get()
        .await
        .map_err(|e| CommandError::ConnectionFailed(e.to_string()))?;
    let _: () = conn.set(key, value).await?;
    Ok(())
}
