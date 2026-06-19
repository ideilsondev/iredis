use crate::db::models::ConnectionRecord;
use crate::error::CommandError;
use deadpool_redis::{Config, Pool, Runtime};
use std::collections::HashMap;
use tokio::sync::RwLock;

pub struct RedisPoolManager {
    pools: RwLock<HashMap<String, Pool>>,
    active_id: RwLock<Option<String>>,
}

impl RedisPoolManager {
    pub fn new() -> Self {
        Self {
            pools: RwLock::new(HashMap::new()),
            active_id: RwLock::new(None),
        }
    }

    pub async fn connect(&self, conn_record: &ConnectionRecord) -> Result<(), CommandError> {
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

        let cfg = Config::from_url(&url);
        let pool = cfg
            .create_pool(Some(Runtime::Tokio1))
            .map_err(|e| CommandError::ConnectionFailed(e.to_string()))?;

        // Test connection
        let mut conn = pool
            .get()
            .await
            .map_err(|e| CommandError::ConnectionFailed(e.to_string()))?;
        let _: String = redis::cmd("PING")
            .query_async(&mut conn)
            .await
            .map_err(|e| CommandError::ConnectionFailed(e.to_string()))?;

        let mut pools = self.pools.write().await;
        pools.insert(conn_record.id.clone(), pool);

        Ok(())
    }

    pub async fn disconnect(&self, id: &str) -> Result<(), CommandError> {
        let mut pools = self.pools.write().await;
        pools.remove(id);

        let mut active = self.active_id.write().await;
        if active.as_deref() == Some(id) {
            *active = None;
        }

        Ok(())
    }

    pub async fn set_active(&self, id: &str) -> Result<(), CommandError> {
        let pools = self.pools.read().await;
        if !pools.contains_key(id) {
            return Err(CommandError::NotFound("Connection not established".into()));
        }
        let mut active = self.active_id.write().await;
        *active = Some(id.to_string());
        Ok(())
    }

    pub async fn get_active_pool(&self) -> Result<Pool, CommandError> {
        let active = self.active_id.read().await;
        let id = active
            .as_ref()
            .ok_or_else(|| CommandError::Validation("No active connection".into()))?;
        let pools = self.pools.read().await;
        let pool = pools
            .get(id)
            .ok_or_else(|| CommandError::NotFound("Active connection pool not found".into()))?;
        Ok(pool.clone())
    }
}
