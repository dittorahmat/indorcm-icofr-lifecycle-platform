import { ApiResponse } from "../../shared/types"
import { authClient } from "./auth-client";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  await authClient.getSession();
  
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
  const contentType = res.headers.get('content-type') || '';

  // Robust check for non-JSON response (e.g. Cloudflare HTML 524 Timeout, 502, 401, or 413)
  if (!contentType.includes('application/json')) {
    if (res.status === 401) {
      throw new Error('Sesi telah berakhir atau tidak sah (401 Unauthorized). Silakan muat ulang halaman atau login kembali.');
    }
    if (res.status === 403) {
      throw new Error('Akses ditolak (403 Forbidden).');
    }
    if (res.status === 404) {
      throw new Error(`Data tidak ditemukan pada server (404 Not Found: ${path}).`);
    }
    if (res.status === 413) {
      throw new Error('Ukuran data terlalu besar (413 Payload Too Large). Kurangi kompleksitas atau lampiran gambar.');
    }
    if (res.status === 524 || res.status === 504) {
      throw new Error('Waktu pemrosesan server habis (524/504 Gateway Timeout). Silakan coba simpan kembali beberapa saat lagi.');
    }
    if (res.status >= 500) {
      throw new Error(`Server mengalami kendala internal (${res.status} ${res.statusText || 'Internal Server Error'}).`);
    }
    throw new Error(`Respons server tidak valid (${res.status} ${res.statusText}): Konten bukan JSON.`);
  }

  const json = (await res.json()) as ApiResponse<T>;
  
  if (!res.ok || !json.success || json.data === undefined) {
    throw new Error(json.error || 'Request failed');
  }
  
  return json.data;
}
