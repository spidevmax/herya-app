# Herya

Herya is a full-stack yoga practice platform centered on personalized Vinyasa
Krama sessions, guided breathwork, meditation, reflective journaling, and
role-based workflows for regular practitioners, tutors, and admins.

## What This Repository Includes

- Guided practice flows for `vk_sequence`, `pranayama`, `meditation`, and
  `complete_practice`
- A multi-phase Start Practice experience with a session builder, guided timer,
  pause/resume flow, recovery, and post-practice journal
- Tutor-specific tools such as child profiles, support signals, visual
  schedules, and tutor analytics
- Admin content management for users, poses, breathing patterns, and Vinyasa
  Krama sequences
- JWT authentication, password reset by email, language
  preferences, and theme preferences
- Swagger/OpenAPI docs, seed scripts, Docker setup, CI pipelines, and GHCR
  image publishing

## Role Overview

- `user`: builds and completes personal practice sessions, views history, and
  journals reflections
- `tutor`: gets tutor-oriented practice presets, child profile management, and
  extra analytics/support flows
- `admin`: manages platform content and user roles from the admin area

## Repository Structure

```text
.
├── docs/
│   ├── DOCKER.md
│   ├── PLANNING.md
│   ├── herya-app-memoria.docx
│   ├── herya-insomnia.json
│   └── start-practice-architecture.md
├── herya-app-backend/
│   ├── src/
│   ├── Dockerfile
│   ├── README.md
│   ├── SWAGGER_GUIDE.md
│   └── package.json
├── herya-app-frontend/
│   ├── public/
│   ├── src/
│   ├── Dockerfile
│   ├── README.md
│   └── package.json
├── docker-compose.yml
├── docker-compose.prod.yml
├── render.yaml
└── README.md
```

## Tech Stack

### Backend

- Node.js 22
- Express 5
- MongoDB + Mongoose 9
- JWT + bcrypt
- Cloudinary + Multer
- Nodemailer
- Swagger
- Jest + Supertest
- Biome

### Frontend

- React 19
- Vite 7
- React Router 7
- Tailwind CSS 4
- Framer Motion
- Axios
- Vitest + Testing Library

## Requirements

- Node.js 22.x
- npm compatible with Node 22
- MongoDB local or Atlas
- Optional: Cloudinary for uploads
- Optional: SMTP for password reset emails
- Optional: Docker Engine + Docker Compose v2

## Local Development

### 1. Clone the repository

```bash
git clone https://github.com/spidevmax/herya-app.git
cd herya-app
```

### 2. Install dependencies

```bash
cd herya-app-backend
npm ci

cd ../herya-app-frontend
npm ci

cd ..
```

### 3. Create environment files

Copy the included examples:

```bash
cp herya-app-backend/.env.example herya-app-backend/.env
cp herya-app-frontend/.env.example herya-app-frontend/.env
```

Backend values you should set at minimum:

```env
NODE_ENV=development
PORT=3000
DB_URL=mongodb+srv://user:password@cluster.mongodb.net/herya
FRONTEND_URL=http://localhost:5173
JWT_SECRET=replace_with_a_long_secure_secret
```

Optional backend integrations:

```env

# Cloudinary uploads
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# SMTP password reset emails
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=Herya <no-reply@herya.app>
```

Frontend values:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

### 4. Optional: seed the database

```bash
cd herya-app-backend
npm run seed
```

This imports sample CSV data and creates a default admin account:

- email: `admin@herya.local`
- password: `AdminPassword123`

### 5. Start the apps

Terminal 1:

```bash
cd herya-app-backend
npm run dev
```

Terminal 2:

```bash
cd herya-app-frontend
npm run dev
```

Default local URLs:

- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Swagger UI: http://localhost:3000/api-docs

## Docker Quick Start

### Development stack

Runs backend and frontend with hot reload:

```bash
docker compose up --build
```

### Production-like local stack

Create the root Docker env file first:

```bash
cp .env.docker.example .env
docker compose -f docker-compose.prod.yml --env-file .env up --build -d
```

Notes:

- Backend secrets still come from `herya-app-backend/.env`
- Root `.env` is used for Docker production-style frontend/backend URL wiring
- Frontend production build is served by Nginx on port `8080`

Docker URLs:

- Development frontend: http://localhost:5173
- Production-like frontend: http://localhost:8080
- Backend API: http://localhost:3000

Stop containers:

```bash
docker compose down
docker compose -f docker-compose.prod.yml --env-file .env down
```

More details: [docs/DOCKER.md](docs/DOCKER.md)

## API Surface

All backend routes are served under `/api/v1`.

Main route groups:

- `auth`
- `users`
- `sessions`
- `journal-entries`
- `poses`
- `breathing-patterns`
- `sequences`
- `child-profiles`
- `session-templates`
- `admin`

Swagger/OpenAPI docs are available at:

- http://localhost:3000/api-docs

For authenticated Swagger requests, use the `Authorize` button and provide the
token as `Bearer <jwt>`.

## Available Scripts

### Backend (`herya-app-backend`)

- `npm run dev`: start the backend with file watching
- `npm start`: start the backend in production mode
- `npm run seed`: import CSV seed data
- `npm run seed:recalc-stats`: recompute user stats from sessions
- `npm test`: run Jest tests
- `npm run lint`: run Biome lint checks
- `npm run format`: format files with Biome
- `npm run check`: run Biome checks
- `npm run check:fix`: apply Biome fixes

### Frontend (`herya-app-frontend`)

- `npm run dev`: start the Vite dev server
- `npm run build`: build the production bundle
- `npm run preview`: preview the production build
- `npm run lint`: run ESLint
- `npm test`: run Vitest once
- `npm run test:coverage`: run tests with coverage
- `npm run test:watch`: run Vitest in watch mode

## Testing and Automation

Local checks:

```bash
cd herya-app-backend && npm test && npm run check
cd herya-app-frontend && npm test && npm run build
```

GitHub Actions workflows:

- `.github/workflows/backend-ci-cd.yml`: backend lint, tests, checks, and
  backend Docker smoke test
- `.github/workflows/frontend-ci-cd.yml`: frontend tests, build, frontend Docker
  smoke test, and Vercel deployment on pushes to `main`
- `.github/workflows/docker-release.yml`: publish backend and frontend images to
  GHCR

## Deployment Notes

This repo includes more than one deployment artifact:

- `render.yaml` contains a Render blueprint for the backend Docker service
- the frontend workflow deploys to Vercel from GitHub Actions
- the Docker release workflow publishes production images to GHCR

If you deploy with Render, update the placeholder repository URL in
`render.yaml` before using it.

## Additional Documentation

- [docs/DOCKER.md](docs/DOCKER.md)
- [docs/start-practice-architecture.md](docs/start-practice-architecture.md)
- [docs/PLANNING.md](docs/PLANNING.md)
- [docs/herya-insomnia.json](docs/herya-insomnia.json)
- [herya-app-backend/README.md](herya-app-backend/README.md)
- [herya-app-backend/SWAGGER_GUIDE.md](herya-app-backend/SWAGGER_GUIDE.md)
- [herya-app-frontend/README.md](herya-app-frontend/README.md)

## Common Issues

- CORS errors:
  `FRONTEND_URL` in `herya-app-backend/.env` must match the actual frontend
  origin.

- Frontend cannot reach the API:
  `VITE_API_URL` must point to the backend API root, usually
  `http://localhost:3000/api/v1`.

- MongoDB connection failures:
  check `DB_URL` and any Atlas network/IP allowlist settings.

- Upload failures:
  configure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and
  `CLOUDINARY_API_SECRET`.

- Password reset email does not send:
  configure `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, and related SMTP values.

Copyright (c) 2026 Max Primavera

All rights reserved.

This repository and its contents are proprietary.
No permission is granted to use, copy, modify, or distribute the software.
