import { invoke } from '@tauri-apps/api/core';

export interface ConnectionRecord {
  id: string;
  name: string;
  host: string;
  port: number;
  password?: string;
  username?: string;
  dbNumber: number;
  useTls: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function createConnection(conn: Omit<ConnectionRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<ConnectionRecord> {
  return await invoke<ConnectionRecord>('create_connection', conn);
}

export async function updateConnection(conn: Omit<ConnectionRecord, 'createdAt' | 'updatedAt'>): Promise<ConnectionRecord> {
  return await invoke<ConnectionRecord>('update_connection', conn);
}

export async function getConnections(): Promise<ConnectionRecord[]> {
  return await invoke<ConnectionRecord[]>('get_connections');
}

export async function setActiveConnection(id: string): Promise<void> {
  await invoke('set_active_connection', { id });
}

export async function disconnectConnection(id: string): Promise<void> {
  await invoke('disconnect_connection', { id });
}

export async function deleteConnection(id: string): Promise<void> {
  await invoke('delete_connection', { id });
}

export async function testConnection(conn: Omit<ConnectionRecord, 'id' | 'name' | 'createdAt' | 'updatedAt' | 'isDefault'>): Promise<string> {
  return await invoke<string>('test_connection', conn);
}
