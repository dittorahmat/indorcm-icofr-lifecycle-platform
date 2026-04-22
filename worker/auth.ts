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
        basePath: "/api/auth",
        trustedOrigins: [
            env.BETTER_AUTH_URL || "http://localhost:3000",
            "https://icofr.tech1solusi.workers.dev"
        ],
        emailAndPassword: {
            enabled: true,
            password: {
                // Logic Hashing PBKDF2 (Compatible with Cloudflare)
                hash: async (password: string) => {
                    const salt = crypto.randomBytes(16).toString('hex');
                    const hash = crypto.pbkdf2Sync(password, salt, 100, 32, 'sha256').toString('hex');
                    return `pbkdf2$100$${salt}$${hash}`;
                },
                verify: async ({ hash: storedHash, password }) => {
                    if (!storedHash) return false;

                    if (storedHash.startsWith('pbkdf2$')) {
                        const [, iterations, salt, hash] = storedHash.split('$');
                        const verifyHash = crypto.pbkdf2Sync(password, salt, parseInt(iterations), 32, 'sha256').toString('hex');
                        return verifyHash === hash;
                    }
                    return false;
                }
            }
        },
        plugins: [
            organization()
        ],
        user: {
            additionalFields: {
                role: { type: "string" },
                level: { type: "string" },
                departmentId: { type: "string" },
                language: { type: "string" },
            }
        },
        advanced: {
            ipAddress: {
                ipAddressHeaders: ["cf-connecting-ip", "x-real-ip", "x-forwarded-for"],
            },
            trustedProxyHeaders: true,
        }
    });
};
