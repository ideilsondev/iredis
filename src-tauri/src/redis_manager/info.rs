use crate::error::CommandError;
use deadpool_redis::Pool;

pub async fn ping(pool: &Pool) -> Result<String, CommandError> {
    let mut conn = pool
        .get()
        .await
        .map_err(|e| CommandError::ConnectionFailed(e.to_string()))?;
    let reply: String = redis::cmd("PING").query_async(&mut conn).await?;
    Ok(reply)
}
