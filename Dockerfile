# ── Stage 1: builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /build

RUN apk add --no-cache openssl

# Install ALL deps so prisma CLI and generate are available
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install

# Generate Prisma client (needed at runtime too)
RUN node_modules/.bin/prisma generate

# ── Stage 2: final ────────────────────────────────────────────────────────────
FROM node:20-alpine AS final

LABEL maintainer="safeclass-team" \
      service="safeclass-backend" \
      version="1.0.0"

WORKDIR /app

# Non-root user
RUN apk add --no-cache openssl && \
    addgroup -S safeclass && adduser -S safeclass -G safeclass

# Copy all node_modules from builder (includes prisma CLI for migrate deploy)
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/prisma      ./prisma

# Application source
COPY src        ./src
COPY package.json ./

RUN chown -R safeclass:safeclass /app

USER safeclass

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget -qO- http://localhost:3000/health || exit 1

# Run migrations then start the server
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node src/index.js"]
