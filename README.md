# Herya

Herya is a full-stack web application for personalized yoga practice with a
Vinyasa Krama focus. It combines guided session building, reflective journaling, role-based workflows and an admin content system.

## Overview

Herya includes:

- JWT-based authentication and role-aware access
- Practice flows for three roles: user, tutor and admin
- Asana, breathing pattern and Vinyasa Krama sequence exploration
- Guided session creation and practice tracking
- Post-practice journaling and insights
- Admin tools for user and content management (poses, sequences, breathing)

## Repository Structure

```text
.
├── docs/
│   ├── herya-app-memoria.docx
│   ├── herya-insomnia.json
│   ├── PLANNING.md
│   └── start-practice-architecture.md
├── herya-app-backend/
│   ├── src/
│   ├── index.js
│   └── package.json
└── herya-app-frontend/
    ├── src/
    ├── public/
    └── package.json
```

## Tech Stack

### Backend

- Node.js
- Express 5
- MongoDB + Mongoose
- JWT + bcrypt
- Cloudinary + Multer
- Swagger
- Jest + Supertest
- Biome

### Frontend

- React 19
- Vite 7
- React Router
- Tailwind CSS 4
- Framer Motion
- Axios
- Vitest + Testing Library

## Requirements

- Node.js 22 recommended (matches CI)
- npm 9 or higher
- MongoDB (local or Atlas)
- Cloudinary account for uploads

## Getting Started

### 1) Clone the repository

```bash
git clone https://github.com/spidevmax/herya-app.git
cd herya-app
```

### 2) Install dependencies

```bash
cd herya-app-backend && npm ci
cd ../herya-app-frontend && npm ci
cd ..
```

### 3) Configure environment variables

Create:

- herya-app-backend/.env
- herya-app-frontend/.env

Minimal values:

Backend:

```env
NODE_ENV=development
PORT=3000
DB_URL=mongodb+srv://user:password@cluster.mongodb.net/herya
FRONTEND_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

JWT_SECRET=replace_with_a_long_secure_secret
```

Frontend:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

### 4) Optional: seed the database

```bash
cd herya-app-backend
npm run seed
```

### 5) Run backend and frontend

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

Default URLs:

- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Swagger: http://localhost:3000/api-docs

## API Documentation

The backend API contract is documented with Swagger/OpenAPI and served at:

- http://localhost:3000/api-docs

Authentication in Swagger:

- Use the Authorize button and paste JWT as `Bearer your_jwt_token`.
- You can obtain a token from `POST /api/v1/auth/register` or `POST /api/v1/auth/login`.

Main API groups:

- Auth
- Users
- Sessions
- Journal Entries
- Poses
- Breathing Patterns
- Sequences
- Admin

Detailed backend API guide:

- herya-app-backend/SWAGGER_GUIDE.md

## Docker Quick Start

Development stack (hot reload for frontend and backend):

```bash
docker compose up --build
```

Production-like local stack (frontend served by Nginx):

```bash
cp .env.docker.example .env
docker compose -f docker-compose.prod.yml --env-file .env up --build -d
```

Stop containers:

```bash
docker compose down
docker compose -f docker-compose.prod.yml --env-file .env down
```

Detailed Docker documentation: docs/DOCKER.md

## Deployment

Production deployment uses a split setup:

- Backend: Railway (native GitHub autodeploy from `main`, waiting for CI)
- Frontend: Vercel (deployed from GitHub Actions after CI + smoke checks)

Container image publishing to GHCR is also available via:

- .github/workflows/docker-release.yml

## Available Scripts

### Backend (herya-app-backend)

- npm run dev: start server with nodemon
- npm start: start server
- npm run seed: run full seed pipeline
- npm run seed:recalc-stats: recalculate user stats from sessions
- npm test: run Jest tests
- npm run lint: run Biome lint
- npm run format: run Biome formatter
- npm run check: run Biome checks
- npm run check:fix: auto-fix Biome issues

### Frontend (herya-app-frontend)

- npm run dev: start Vite dev server
- npm run build: build production bundle
- npm run preview: preview production build
- npm run lint: run ESLint
- npm test: run Vitest once
- npm run test:coverage: run tests with coverage
- npm run test:watch: run Vitest in watch mode

## Testing and CI/CD

Local quality checks:

Backend:

```bash
cd herya-app-backend
npm test
npm run check
```

Frontend:

```bash
cd herya-app-frontend
npm run lint
npm test
npm run build
```

GitHub Actions workflows:

- Backend CI: .github/workflows/backend-ci-cd.yml
- Frontend CI: .github/workflows/frontend-ci-cd.yml
- Docker image release: .github/workflows/docker-release.yml

Backend workflow includes:

- Lint + tests + checks
- Docker smoke test
- No direct Railway CLI deploy from Actions (Railway autodeploy handles production)

Frontend workflow includes:

- Tests + build
- Docker smoke test
- Production deploy to Vercel on push to `main`

## Documentation and Resources

- docs/herya-app-memoria.docx
- docs/herya-insomnia.json
- docs/PLANNING.md
- docs/start-practice-architecture.md
- herya-app-backend/SWAGGER_GUIDE.md
- herya-app-backend/README.md

## Common Issues

- CORS errors:
  Ensure FRONTEND_URL in backend .env matches your frontend URL.

- Unauthorized requests (401):
  Verify JWT is present and JWT_SECRET is stable.

- MongoDB connection failures:
  Check DB_URL and Atlas network/IP rules.

- Upload failures:
  Validate CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.
