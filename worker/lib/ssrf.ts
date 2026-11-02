/**
 * Safe webhook URL validation against Server-Side Request Forgery (SSRF).
 * Blocks internal loopback, private RFC-1918 networks, link-local, AWS/cloud metadata,
 * and protocols other than HTTPS.
 */

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  'metadata.google.internal',
  'instance-data',
]);

/**
 * Checks whether an IPv4 address falls within private, loopback, link-local, or broadcast ranges.
 */
function isPrivateOrReservedIpv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return false;
  }

  const [b0, b1] = parts;

  // 0.0.0.0/8 (Current network)
  if (b0 === 0) return true;
  // 10.0.0.0/8 (Private network)
  if (b0 === 10) return true;
  // 127.0.0.0/8 (Loopback)
  if (b0 === 127) return true;
  // 169.254.0.0/16 (Link-local / Cloud metadata service e.g. 169.254.169.254)
  if (b0 === 169 && b1 === 254) return true;
  // 172.16.0.0/12 (Private network: 172.16.0.0 - 172.31.255.255)
  if (b0 === 172 && b1 >= 16 && b1 <= 31) return true;
  // 192.168.0.0/16 (Private network)
  if (b0 === 192 && b1 === 168) return true;
  // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved)
  if (b0 >= 224) return true;

  return false;
}

export function validateSafeWebhookUrl(urlString: string): { valid: boolean; reason?: string } {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    return { valid: false, reason: 'Invalid URL format' };
  }

  // Enforce HTTPS
  if (parsed.protocol !== 'https:') {
    return { valid: false, reason: 'Webhook URL must use HTTPS protocol' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Strip brackets from IPv6 literal if present
  const rawHost = hostname.startsWith('[') && hostname.endsWith(']') ? hostname.slice(1, -1) : hostname;

  if (BLOCKED_HOSTNAMES.has(rawHost)) {
    return { valid: false, reason: 'Webhook host is a restricted destination' };
  }

  if (rawHost.endsWith('.local') || rawHost.endsWith('.internal') || rawHost.endsWith('.localhost')) {
    return { valid: false, reason: 'Private or local domains are not permitted' };
  }

  if (isPrivateOrReservedIpv4(rawHost)) {
    return { valid: false, reason: 'Private or reserved IP ranges are not permitted' };
  }

  return { valid: true };
}
