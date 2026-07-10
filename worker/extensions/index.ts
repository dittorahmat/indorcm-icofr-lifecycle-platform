import { Hono } from 'hono';

/**
 * Fungsi untuk mendaftarkan sub-app API kustom dari Mitra Whitelabel.
 * Dipanggil secara otomatis oleh server utama Hono GRC.
 */
export function registerBackendExtensions(app: Hono<any, any, any>) {
  // Mitra dapat mendaftarkan endpoint kustom mereka di sini, misal:
  // const partnerApp = new Hono();
  // partnerApp.get('/hello', (c) => c.text('Hello Partner'));
  // app.route('/api/ext/partner', partnerApp);
}
