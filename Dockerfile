# BUILD STAGE
FROM oven/bun:latest as builder

WORKDIR /app

# Copy all files
COPY . .

# Install dependencies and build
RUN bun install
RUN bun run build

# RUN STAGE
FROM oven/bun:latest

WORKDIR /app

# Copy build result and necessary files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json .
COPY --from=builder /app/worker ./worker
COPY --from=builder /app/shared ./shared

# Better Auth & Drizzle dependencies
RUN bun install @hono/node-server @neondatabase/serverless drizzle-orm better-auth

EXPOSE 3001

# Command to run the agnostic server
CMD ["bun", "run", "worker/serve-local.ts"]
