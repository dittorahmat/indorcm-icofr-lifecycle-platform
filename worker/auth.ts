import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { getDb } from "./db";
import * as schema from "./db/schema";

export const getAuth = (env: { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL?: string }) => {
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
