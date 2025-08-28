# Build stage
FROM oven/bun:1 as builder

WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN bun run build

# Create standalone binary
RUN bun run build:standalone

# Production stage
FROM ubuntu:22.04

# Install runtime dependencies
RUN apt-get update && \
    apt-get install -y ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/nameswipe-server ./
COPY --from=builder /app/dist/public ./dist/public

# Create non-root user
RUN useradd -r -s /bin/false nameswipe && \
    chown -R nameswipe:nameswipe /app

USER nameswipe

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Run the standalone binary
CMD ["./nameswipe-server"]