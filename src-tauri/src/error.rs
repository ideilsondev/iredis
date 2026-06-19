#[derive(Debug, thiserror::Error)]
pub enum CommandError {
    #[error("Connection failed: {0}")]
    ConnectionFailed(String),
    #[error("Redis error: {0}")]
    RedisError(String),
    #[error("Database error: {0}")]
    DatabaseError(String),
    #[error("Not found: {0}")]
    NotFound(String),
    #[error("Validation error: {0}")]
    Validation(String),
    #[error("System error: {0}")]
    System(String),
}

impl serde::Serialize for CommandError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

// Helper conversions
impl From<redis::RedisError> for CommandError {
    fn from(err: redis::RedisError) -> Self {
        CommandError::RedisError(err.to_string())
    }
}

impl From<rusqlite::Error> for CommandError {
    fn from(err: rusqlite::Error) -> Self {
        CommandError::DatabaseError(err.to_string())
    }
}

impl From<keyring::Error> for CommandError {
    fn from(err: keyring::Error) -> Self {
        CommandError::DatabaseError(err.to_string())
    }
}

impl From<std::io::Error> for CommandError {
    fn from(err: std::io::Error) -> Self {
        CommandError::DatabaseError(format!("IO Error: {}", err))
    }
}
