# Herya

Herya is a full-stack yoga practice platform for personalized Vinyasa Krama sessions, guided breathwork, meditation, reflective journaling, and role-based workflows for practitioners, tutors, and admins.

---

## Repository Structure

```
.
├── docs/
│   ├── DOCKER.md
│   ├── PLANNING.md
│   ├── herya-insomnia.json
│   └── start-practice-architecture.md
├── herya-app-backend/
│   ├── src/
│   ├── Dockerfile
│   ├── README.md
│   └── package.json
├── herya-app-frontend/
│   ├── src/
│   ├── Dockerfile
│   ├── README.md
│   └── package.json
├── docker-compose.yml
├── docker-compose.prod.yml
└── README.md
```

---

## Tech Stack

**Backend:** Node.js 22, Express 5, MongoDB + Mongoose 9, JWT, Cloudinary, Nodemailer, Swagger, Jest, Biome

**Frontend:** React 19, Vite 7, React Router 7, Tailwind CSS 4, Framer Motion, Axios, Vitest

---

## Requirements

- Node.js 22.x
- npm compatible with Node 22
- MongoDB (local or Atlas)
- Optional: Cloudinary for uploads
- Optional: SMTP for password reset emails
- Optional: Docker Engine + Docker Compose v2

---

## Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/spidevmax/herya-app.git
   cd herya-app
   ```

2. **Install dependencies:**
   ```bash
   cd herya-app-backend && npm ci
   cd ../herya-app-frontend && npm ci
   cd ..
   ```

3. **Create environment files:**
   ```bash
   cp herya-app-backend/.env.example herya-app-backend/.env
   cp herya-app-frontend/.env.example herya-app-frontend/.env
   ```

4. **(Optional) Seed the database:**
   ```bash
   cd herya-app-backend
   npm run seed
   ```

5. **Start both servers:**
   - Backend:
     ```bash
     cd herya-app-backend && npm run dev
     ```
   - Frontend:
     ```bash
     cd herya-app-frontend && npm run dev
     ```

Default local URLs:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Swagger: http://localhost:3000/api-docs

---

## Docker

- **Development:**
  ```bash
  docker compose up --build
  ```
- **Production-like local:**
  ```bash
  cp .env.docker.example .env
  docker compose -f docker-compose.prod.yml --env-file .env up --build -d
  ```

---

## Available Scripts

### Backend (`herya-app-backend`)
- `npm run dev` — Start backend with file watching
- `npm start` — Start backend in production mode
- `npm run seed` — Import seed data
- `npm test` — Run Jest tests
- `npm run lint` — Run Biome lint
- `npm run format` — Format files with Biome
- `npm run check` — Run Biome checks
- `npm run check:fix` — Apply Biome fixes

### Frontend (`herya-app-frontend`)
- `npm run dev` — Start Vite dev server
- `npm run build` — Build production bundle
- `npm run preview` — Preview production build
- `npm run lint` — Run Biome lint
- `npm test` — Run Vitest
- `npm run test:coverage` — Run tests with coverage
- `npm run test:watch` — Vitest watch mode

---

## Troubleshooting

- **CORS errors:** `FRONTEND_URL` in `herya-app-backend/.env` must match the actual frontend origin.
- **Frontend cannot reach the API:** `VITE_API_URL` must point to the backend API root, usually `http://localhost:3000/api/v1`.
- **MongoDB connection failures:** Check `DB_URL` and any Atlas network/IP allowlist settings.
- **Upload failures:** Configure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`.
- **Password reset email does not send:** Configure `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, and related SMTP values.
- **Biome errors:** Run `npm run check:fix` to auto-fix formatting and lint issues.

---

## Documentation & API

- Swagger/OpenAPI: http://localhost:3000/api-docs
- Additional docs in `/docs/`

---

## License

Copyright (c) 2026 Max Primavera

All rights reserved.

This repository and its contents are proprietary. No permission is granted to use, copy, modify, or distribute the software.
