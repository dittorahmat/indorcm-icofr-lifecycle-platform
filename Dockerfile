# STAGE 1: Build & Bundle Backend
FROM oven/bun:latest as builder

WORKDIR /app

# Copy source
COPY . .

# Install all deps (including dev for building)
RUN bun install

# 1. Build & Minify Frontend (Vite)
RUN bun run build

# 2. Bundle & Minify Backend into a single executable JS file
# This combines all worker code, shared types, and libs into one file
RUN bun build ./worker/serve-local.ts \
    --minify \
    --target node \
    --outfile ./dist-backend/server.js

# STAGE 2: Obfuscate (The "Magic" Step)
FROM node:20-slim as obfuscator

WORKDIR /app
COPY --from=builder /app/dist-backend/server.js ./server.js
RUN npx javascript-obfuscator ./server.js \
    --output ./server.obfuscated.js \
    --compact true \
    --control-flow-flattening true \
    --dead-code-injection true \
    --string-array true \
    --string-array-encoding 'base64'

# STAGE 3: Production
FROM oven/bun:latest

WORKDIR /app

# Copy Frontend result
COPY --from=builder /app/dist ./dist

# Copy Obfuscated Backend
COPY --from=obfuscator /app/server.obfuscated.js ./server.js

# Copy essential files
COPY --from=builder /app/package.json .

# Install ONLY production dependencies needed for runtime
# Note: Since we bundled, we mostly just need @hono/node-server and drizzle drivers
RUN bun install --production

EXPOSE 3001

# Run the obfuscated server
CMD ["bun", "run", "server.js"]
