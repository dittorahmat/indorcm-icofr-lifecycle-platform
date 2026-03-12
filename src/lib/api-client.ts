import { ApiResponse } from "../../shared/types"

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const mockRole = localStorage.getItem('mockRole') || 'Line 1';
  const token = localStorage.getItem('authToken');
  
  const headers = {
    'Content-Type': 'application/json',
    'X-Mock-Role': mockRole, // Legacy support
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...init?.headers,
  };

  const res = await fetch(path, { ...init, headers });
  const json = (await res.json()) as ApiResponse<T>;
  
  if (!res.ok || !json.success || json.data === undefined) {
    throw new Error(json.error || 'Request failed');
  }
  
  return json.data;
}
