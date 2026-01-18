FROM oven/bun:1.3.6-alpine@sha256:819f91180e721ba09e0e5d3eb7fb985832fd23f516e18ddad7e55aaba8100be7

WORKDIR /app

ENV PORT=3000 \
    CACHE_DIR=/app/cache \
    TOKENS_DB_PATH=/app/data/nx-cache-server-tokens.sqlite \
    STORAGE_STRATEGY=filesystem

COPY tsconfig.json ./
COPY src ./src

RUN mkdir -p "$CACHE_DIR" "$(dirname "$TOKENS_DB_PATH")"

EXPOSE 3000
CMD ["bun", "/app/src/main.ts"]
