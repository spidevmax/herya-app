# Docker Guide

This guide explains how to run Herya with Docker in development and production.

## Prerequisites

- Docker Engine + Docker Compose v2
- Existing backend env file at herya-app-backend/.env

## Stack Overview

- Backend service: Node.js (Express) on port 3000
- Frontend service (development): Vite on port 5173
- Frontend service (production): Nginx serving built static assets on port 8080
- Database: Mongo Atlas (external, no local Mongo container by default)

## Development Mode

Use hot reload for backend and frontend.

```bash
docker compose up --build
```

Open:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Swagger: http://localhost:3000/api-docs

Stop:

```bash
docker compose down
```

## Production Mode (Local Simulation)

1) Create root .env from template:

```bash
cp .env.docker.example .env
```

2) Start production profile:

```bash
docker compose -f docker-compose.prod.yml --env-file .env up --build -d
```

Open:
- Frontend (Nginx): http://localhost:8080
- Backend API: http://localhost:3000

Stop:

```bash
docker compose -f docker-compose.prod.yml --env-file .env down
```

## Environment Notes

- Backend secrets remain in herya-app-backend/.env and are injected through compose.
- Frontend production API URL is baked at build time with VITE_API_URL.
- FRONTEND_URL should match the frontend URL used by users (for CORS).

## Health Checks

- Backend checks GET / on port 3000.
- Frontend checks GET /health on Nginx.

## CI/CD Image Release (GHCR)

Workflow: .github/workflows/docker-release.yml

What it does:
- Builds and pushes production images for backend and frontend to GHCR.
- Publishes tags for default branch and semantic version tags.
- Reuses GitHub Actions layer cache (Buildx + GHA cache).

Image names:
- ghcr.io/<owner>/herya-backend
- ghcr.io/<owner>/herya-frontend

Tag strategy:
- main branch: latest, main, sha-<commit>
- tag push vX.Y.Z: X.Y.Z, X.Y, sha-<commit>

Examples:

```bash
docker pull ghcr.io/<owner>/herya-backend:latest
docker pull ghcr.io/<owner>/herya-frontend:latest
```

Run pulled images locally:

```bash
docker run -d --name herya-backend -p 3000:3000 ghcr.io/<owner>/herya-backend:latest
docker run -d --name herya-frontend -p 8080:80 ghcr.io/<owner>/herya-frontend:latest
```

## Troubleshooting

- CORS error in browser:
  - Ensure FRONTEND_URL value matches the frontend origin.
- Frontend cannot call API:
  - Ensure VITE_API_URL points to the backend API root (for example http://localhost:3000/api/v1).
- Build-time env not applied:
  - Rebuild frontend image (`--build`) after changing VITE_API_URL.
