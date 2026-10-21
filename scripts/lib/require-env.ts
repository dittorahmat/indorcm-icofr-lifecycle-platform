/**
 * Read a required environment variable or stop the script with an actionable
 * message. Scripts call this after `.env` is loaded, so the failure names the
 * missing variable instead of surfacing as a downstream connection error.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`❌ ${name} is not set. Add it to .env or export it for this command.`);
    process.exit(1);
  }
  return value;
}
