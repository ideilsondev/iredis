use crate::error::CommandError;
use rusqlite::Connection;

pub fn run_migrations(conn: &Connection) -> Result<(), CommandError> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS connections (
            id          TEXT PRIMARY KEY,
            name        TEXT NOT NULL,
            host        TEXT NOT NULL DEFAULT 'localhost',
            port        INTEGER NOT NULL DEFAULT 6379,
            password    TEXT,
            username    TEXT,
            db_number   INTEGER NOT NULL DEFAULT 0,
            use_tls     INTEGER NOT NULL DEFAULT 0,
            is_default  INTEGER NOT NULL DEFAULT 0,
            created_at  TEXT NOT NULL,
            updated_at  TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS settings (
            key   TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
        ",
    )?;
    Ok(())
}
