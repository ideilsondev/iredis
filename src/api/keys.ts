import { invoke } from '@tauri-apps/api/core';

export async function scanKeys(pattern: string, cursor: number = 0, count: number = 100): Promise<{cursor: number, keys: string[]}> {
  const result = await invoke<[number, string[]]>('redis_scan_keys', {
    pattern,
    cursor,
    count
  });
  return { cursor: result[0], keys: result[1] };
}

export async function getKeyType(key: string): Promise<string> {
  return await invoke<string>('redis_get_type', { key });
}

export async function getString(key: string): Promise<string> {
  return await invoke<string>('redis_get_string', { key });
}

export async function deleteKey(key: string): Promise<number> {
  return await invoke<number>('redis_delete_key', { key });
}

export async function setString(key: string, value: string): Promise<void> {
  return await invoke<void>('redis_set_string', { key, value });
}
