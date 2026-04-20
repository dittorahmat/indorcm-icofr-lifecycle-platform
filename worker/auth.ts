import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { getDb } from "./db";
import * as schema from "./db/schema";
import crypto from "node:crypto";

export const getAuth = (env: { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL?: string; SKIP_LICENSE?: string }) => {
    const db = getDb(env.DATABASE_URL);

    return betterAuth({
        database: drizzleAdapter(db, {
            provider: "pg",
            schema: {
                user: schema.user,
                session: schema.session,
                account: schema.account,
                verification: schema.verification,
                organization: schema.organization,
                member: schema.member,
            }
        }),
        secret: env.BETTER_AUTH_SECRET,
        baseURL: env.BETTER_AUTH_URL || "http://localhost:3000",
        trustedOrigins: [
            env.BETTER_AUTH_URL || "http://localhost:3000",
            "https://icofr.tech1solusi.workers.dev"
        ],
        emailAndPassword: {
            enabled: true,
            // Force lowercase emails to prevent case-sensitivity issues
            requireEmailVerification: false,
            password: {
                // ... (rest of password logic remains same)

                // Optimization: Always support verifying PBKDF2 (for demo/seed users)
                // but only use it for HASHING if SKIP_LICENSE is true.
                hash: async (password: string) => {
                    if (env.SKIP_LICENSE === 'true') {
                        const salt = crypto.randomBytes(16).toString('hex');
                        const hash = crypto.pbkdf2Sync(password, salt, 100, 32, 'sha256').toString('hex');
                        return `pbkdf2$100$${salt}$${hash}`;
                    }
                    // Default to better-auth internal scrypt (will be handled by better-auth if we return undefined)
                    return undefined; 
                },
                verify: async ({ hash: storedHash, password }) => {
                    // Protection: If no hash found, don't crash
                    if (!storedHash) return false;

                    // If it's a demo user hash (PBKDF2), verify it manually
                    if (storedHash.startsWith('pbkdf2$')) {
                        const [, iterations, salt, hash] = storedHash.split('$');
                        const verifyHash = crypto.pbkdf2Sync(password, salt, parseInt(iterations), 32, 'sha256').toString('hex');
                        return verifyHash === hash;
                    }
                    // Otherwise, let better-auth handle scrypt verification
                    return undefined;
                }
            }
        },
        plugins: [
            organization() // Aktifkan fitur multi-company secara native
        ],
        user: {
            additionalFields: {
                role: { type: "string" },
                level: { type: "string" },
                departmentId: { type: "string" },
                language: { type: "string" },
            }
        }
    });
};
