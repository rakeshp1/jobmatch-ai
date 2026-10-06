FROM node:22-bookworm-slim AS frontend
WORKDIR /src
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:22-bookworm-slim AS backend
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev
COPY backend/ ./
COPY --from=frontend /src/dist /app/frontend/dist
RUN mkdir -p /app/data /app/uploads && chown -R node:node /app/data /app/uploads
ENV NODE_ENV=production \
    PORT=8080 \
    FRONTEND_DIST=/app/frontend/dist \
    DATA_DIR=/app/data \
    UPLOAD_DIR=/app/uploads
USER node
EXPOSE 8080
CMD ["node", "server.js"]
