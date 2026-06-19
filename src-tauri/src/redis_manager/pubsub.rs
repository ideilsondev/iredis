use crate::error::CommandError;
use futures_util::StreamExt;
use serde::Serialize;
use std::collections::HashMap;
use tauri::{AppHandle, Emitter};
use tokio::sync::RwLock;
use tokio::task::JoinHandle;

#[derive(Serialize, Clone)]
pub struct PubSubMessage {
    pub channel: String,
    pub payload: String,
    pub timestamp: String,
}

pub struct PubSubManager {
    // Map of channel_name -> JoinHandle
    tasks: RwLock<HashMap<String, JoinHandle<()>>>,
}

impl PubSubManager {
    pub fn new() -> Self {
        Self {
            tasks: RwLock::new(HashMap::new()),
        }
    }

    pub async fn subscribe(
        &self,
        app_handle: AppHandle,
        url: &str,
        channel: &str,
    ) -> Result<(), CommandError> {
        let mut tasks = self.tasks.write().await;
        if tasks.contains_key(channel) {
            return Ok(()); // Already subscribed
        }

        let client =
            redis::Client::open(url).map_err(|e| CommandError::ConnectionFailed(e.to_string()))?;
        let conn = client
            .get_async_pubsub()
            .await
            .map_err(|e| CommandError::ConnectionFailed(e.to_string()))?;

        let channel_name = channel.to_string();
        let handle = tokio::spawn(async move {
            let mut pubsub = conn;
            if let Err(_) = pubsub.subscribe(&channel_name).await {
                return;
            }

            let mut stream = pubsub.on_message();
            while let Some(msg) = stream.next().await {
                if let Ok(payload) = msg.get_payload::<String>() {
                    let ts = chrono::Utc::now().to_rfc3339();
                    let pubsub_msg = PubSubMessage {
                        channel: msg.get_channel_name().to_string(),
                        payload,
                        timestamp: ts,
                    };
                    let _ = app_handle.emit("pubsub-message", pubsub_msg);
                }
            }
        });

        tasks.insert(channel.to_string(), handle);
        Ok(())
    }

    pub async fn unsubscribe(&self, channel: &str) -> Result<(), CommandError> {
        let mut tasks = self.tasks.write().await;
        if let Some(handle) = tasks.remove(channel) {
            handle.abort();
        }
        Ok(())
    }
}
