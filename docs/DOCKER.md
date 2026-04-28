# Docker Guide

This guide explains how to run Herya with Docker in development, simulate a
production-like setup locally, and understand the Docker-related CI/CD flows in
this repository.

## Files Involved

- `docker-compose.yml`: development stack with hot reload
- `docker-compose.prod.yml`: local production-like stack
- `herya-app-backend/Dockerfile`: backend multi-stage image (`dev`, `prod`)
- `herya-app-frontend/Dockerfile`: frontend multi-stage image (`dev`, `prod`)
- `.env.docker.example`: root-level variables used by the production-like
  compose stack
- `herya-app-backend/.env`: backend runtime secrets and config

## Prerequisites

- Docker Engine
- Docker Compose v2
- Backend env file at `herya-app-backend/.env`

If you have not created the backend env file yet:

```bash
cp herya-app-backend/.env.example herya-app-backend/.env
```

At minimum, set:

```env
PORT=3000
DB_URL=your_mongodb_connection_string
JWT_SECRET=replace_with_a_long_secure_secret
FRONTEND_URL=http://localhost:5173
```

## Stack Overview

### Development stack

- Backend container:
  - target: `dev`
  - command: `npm run dev`
  - port: `3000`
  - source mounted as a volume for live reload
- Frontend container:
  - target: `dev`
  - command: `npm run dev -- --host 0.0.0.0 --port 5173`
  - port: `5173`
  - source mounted as a volume for live reload

### Production-like local stack

- Backend container:
  - target: `prod`
  - command: `npm start`
  - port: `3000`
- Frontend container:
  - target: `prod`
  - built with `VITE_API_URL`
  - served by Nginx on port `8080`

### Database

No MongoDB container is included in either compose file. The backend expects an
external MongoDB instance through `DB_URL`, typically MongoDB Atlas or a local
MongoDB server you manage separately.

## Development Mode

Start the development stack:

```bash
docker compose up --build
```

Open:

- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Swagger UI: http://localhost:3000/api-docs

Stop the stack:

```bash
docker compose down
```

### Development Environment Behavior

- `herya-app-backend/.env` is loaded into the backend container
- The backend compose service also forces:
  - `NODE_ENV=development`
  - `PORT=3000`
  - `FRONTEND_URL=http://localhost:5173`
- The frontend compose service sets:
  - `VITE_API_URL=http://localhost:3000/api/v1`
- Backend and frontend source directories are mounted into the containers
- `node_modules` are stored in Docker volumes to avoid host/container conflicts

## Production-Like Mode (Local)

This mode is useful for testing the final production Docker images locally.

### 1. Create the root Docker env file

```bash
cp .env.docker.example .env
```

Default values:

```env
FRONTEND_URL=http://localhost:8080
VITE_API_URL=http://localhost:3000/api/v1
```

### 2. Make sure backend runtime env is configured

The production-like compose stack still reads secrets and backend config from:

```text
herya-app-backend/.env
```

Important values include:

- `DB_URL`
- `JWT_SECRET`
- optional integrations such as Cloudinary and SMTP

### 3. Start the production-like stack

```bash
docker compose -f docker-compose.prod.yml --env-file .env up --build -d
```

Open:

- Frontend: http://localhost:8080
- Backend: http://localhost:3000
- Swagger UI: http://localhost:3000/api-docs

Stop it:

```bash
docker compose -f docker-compose.prod.yml --env-file .env down
```

## Environment Model

There are two different env sources involved in Docker usage:

### Backend runtime env

File:

```text
herya-app-backend/.env
```

Used by:

- development compose backend service
- production-like compose backend service
- direct backend container runs

Examples of values that belong here:

- `DB_URL`
- `JWT_SECRET`
- `FRONTEND_URL`
- `CLOUDINARY_*`
- `SMTP_*`

### Root Docker env

File:

```text
.env
```

Usually created from:

```bash
cp .env.docker.example .env
```

Used by:

- `docker-compose.prod.yml`

Examples of values that belong here:

- `FRONTEND_URL`
- `VITE_API_URL`

Notes:

- `FRONTEND_URL` is used by the backend for CORS and frontend-facing links
- `VITE_API_URL` is baked into the frontend production image at build time
- if you change `VITE_API_URL`, rebuild the frontend image with `--build`

## Health Checks

### Backend

- Container health check uses `GET /` on port `3000`
- The compose files also wait for backend health before starting the frontend

### Frontend

- The production compose file checks `GET /health`
- Nginx exposes `/health` and returns `200 ok`
- The frontend production image itself also has a Docker health check against
  `GET /`

## Build Targets

### Backend image

Defined in `herya-app-backend/Dockerfile`:

- `dev`: installs all dependencies and runs `npm run dev`
- `prod`: installs production dependencies and runs `npm start`

### Frontend image

Defined in `herya-app-frontend/Dockerfile`:

- `dev`: runs the Vite dev server on `0.0.0.0:5173`
- `build`: creates the production bundle with `VITE_API_URL`
- `prod`: serves the built app with Nginx on port `80`

## Manual Image Builds

Build backend production image:

```bash
docker build -t herya-backend:local --target prod herya-app-backend
```

Build frontend production image:

```bash
docker build \
  -t herya-frontend:local \
  --target prod \
  --build-arg VITE_API_URL=http://localhost:3000/api/v1 \
  herya-app-frontend
```

Run backend image manually:

```bash
docker run --rm -p 3000:3000 --env-file herya-app-backend/.env herya-backend:local
```

Run frontend image manually:

```bash
docker run --rm -p 8080:80 herya-frontend:local
```

## CI/CD With GitHub Actions

### Backend CI

Workflow:

```text
.github/workflows/backend-ci-cd.yml
```

What it does:

1. Runs backend install, lint, tests, and `npm run check`
2. Builds the backend production Docker image
3. Starts a temporary MongoDB container
4. Starts the backend container with CI env vars
5. Runs a smoke test against `http://127.0.0.1:3000/`

### Frontend CI

Workflow:

```text
.github/workflows/frontend-ci-cd.yml
```

What it does:

1. Runs frontend install, tests, and build
2. Builds the frontend production Docker image
3. Starts the frontend container
4. Smoke-tests both `/` and `/health` on port `8080`
5. On pushes to `main`, deploys the frontend to Vercel

Required GitHub secrets for the deploy job:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

### GHCR image publishing

Workflow:

```text
.github/workflows/docker-release.yml
```

What it does:

- builds and publishes backend and frontend production images to GHCR
- runs on pushes to `main`
- also runs on semantic version tags matching `v*.*.*`
- can be triggered manually with `workflow_dispatch`

Published image names:

- `ghcr.io/<owner>/herya-backend`
- `ghcr.io/<owner>/herya-frontend`

Tag behavior from the workflow:

- default branch: `latest`
- branch refs: branch-based tags
- commits: sha tags
- semantic tags like `v1.2.3`: `1.2.3` and `1.2`

Examples:

```bash
docker pull ghcr.io/<owner>/herya-backend:latest
docker pull ghcr.io/<owner>/herya-frontend:latest
```

## Deployment Notes

- The frontend GitHub Actions workflow deploys to Vercel on pushes to `main`
- The backend CI workflow does not deploy by itself
- The repository also includes `render.yaml`, which can be used as a deployment
  blueprint outside Docker Compose

## Troubleshooting

### Browser CORS errors

Check that `FRONTEND_URL` matches the actual frontend origin being used by the
browser:

- development Docker: `http://localhost:5173`
- production-like Docker: `http://localhost:8080`

### Frontend cannot reach the API

Check that `VITE_API_URL` points to the backend API base:

```text
http://localhost:3000/api/v1
```

If you changed it for the production image, rebuild:

```bash
docker compose -f docker-compose.prod.yml --env-file .env up --build -d
```

### Backend container starts but app fails quickly

Usually one of these is missing or invalid in `herya-app-backend/.env`:

- `DB_URL`
- `JWT_SECRET`
- optional third-party credentials required by the path you are testing

### Frontend production container is up but routes fail on refresh

The production image uses Nginx with SPA fallback through `try_files`, so if
this happens after custom changes, review:

```text
herya-app-frontend/nginx/default.conf
```
