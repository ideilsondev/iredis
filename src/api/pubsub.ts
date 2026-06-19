import { invoke } from '@tauri-apps/api/core';

export interface PubSubMessage {
  channel: string;
  payload: string;
  timestamp: string;
}

export async function subscribeToChannel(connectionId: string, channel: string): Promise<void> {
  await invoke('pubsub_subscribe', { connectionId, channel });
}

export async function unsubscribeFromChannel(channel: string): Promise<void> {
  await invoke('pubsub_unsubscribe', { channel });
}

export async function publishToChannel(channel: string, message: string): Promise<number> {
  return await invoke('pubsub_publish', { channel, message });
}
