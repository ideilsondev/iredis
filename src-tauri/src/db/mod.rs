use rusqlite::Connection;
use std::sync::Mutex;

pub mod migrations;
pub mod models;

pub struct Database {
    pub conn: Mutex<Connection>,
}

impl Database {
    pub fn new(app_dir: std::path::PathBuf) -> Result<Self, crate::error::CommandError> {
        let db_path = app_dir.join("iredis_encrypted.sqlite");

        let conn = Connection::open(&db_path)?;

        // Note: SQLCipher was removed for cross-compiling compatibility.
        // We are using standard SQLite. Sensitive fields like passwords 
        // can be encrypted individually via AES if required.

        // Optional: test the connection
        let _ = conn.query_row("SELECT count(*) FROM sqlite_master", [], |_| Ok(()));

        // Run migrations
        migrations::run_migrations(&conn)?;

        Ok(Self {
            conn: Mutex::new(conn),
        })
    }
}
