import { ApiResponse } from "../../shared/types"
import { authClient } from "./auth-client";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const session = await authClient.getSession();
  
  const headers: Record<string, string> = {
    ...init?.headers as Record<string, string>,
  };

  if (!(init?.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Note: authClient handles session headers automatically if using its own fetch, 
  // but for our custom api function, we might need to rely on cookies or manual header injection.
  // Better Auth client usually handles cookies.

  const res = await fetch(path, { ...init, headers });
  const json = (await res.json()) as ApiResponse<T>;
  
  if (!res.ok || !json.success || json.data === undefined) {
    throw new Error(json.error || 'Request failed');
  }
  
  return json.data;
}
