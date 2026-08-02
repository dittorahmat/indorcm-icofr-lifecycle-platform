import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { getDb } from "./db";
import * as schema from "./db/schema";
import crypto from "node:crypto";

let authInstance: any = null;
let lastDbUrl: string | null = null;

export const getAuth = (env: { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL?: string; SKIP_LICENSE?: string }) => {
    const isCloudflare = typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers';

    if (!isCloudflare && authInstance && lastDbUrl === env.DATABASE_URL) {
        return authInstance;
    }

    const db = getDb(env.DATABASE_URL);

    const auth = betterAuth({
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
                    const iterations = 600000;
                    const hash = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('hex');
                    return `pbkdf2$${iterations}$${salt}$${hash}`;
                },
                verify: async ({ hash: storedHash, password }) => {
                    if (!storedHash) return false;

                    if (storedHash.startsWith('pbkdf2$')) {
                        const parts = storedHash.split('$');
                        if (parts.length !== 4) return false;
                        const [, iterationsStr, salt, hash] = parts;
                        const iterations = parseInt(iterationsStr, 10);
                        if (isNaN(iterations) || iterations < 1) return false;

                        const verifyHashBuf = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256');
                        const hashBuf = Buffer.from(hash, 'hex');

                        if (verifyHashBuf.length !== hashBuf.length) return false;
                        return crypto.timingSafeEqual(verifyHashBuf, hashBuf);
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
                role: { type: "string", input: false },
                level: { type: "string", input: false },
                departmentId: { type: "string", input: false },
                language: { type: "string", input: false },
            }
        },
        advanced: {
            ipAddress: {
                ipAddressHeaders: ["cf-connecting-ip", "x-real-ip", "x-forwarded-for"],
            },
            trustedProxyHeaders: true,
        }
    });

    if (!isCloudflare) {
        authInstance = auth;
        lastDbUrl = env.DATABASE_URL;
    }

    return auth;
};
