# Herya

Herya is a full-stack yoga practice platform for personalized Vinyasa Krama sessions, guided breathwork, meditation, reflective journaling, and role-based workflows for practitioners, tutors, and admins.

---

## Repository Structure

```
.
├── docs/
│   └── herya-insomnia.json
├── herya-app-backend/
│   ├── src/
│   ├── README.md
│   └── package.json
├── herya-app-frontend/
│   ├── src/
│   ├── README.md
│   └── package.json
├── biome.json
├── docker-compose.yml
└── README.md
```

---

## Tech Stack

**Backend:** Node.js 22, Express 5, MongoDB + Mongoose 9, JWT, bcrypt, Multer, Cloudinary, Nodemailer, express-rate-limit, express-validator, Swagger, Jest, Biome

**Frontend:** React 19, Vite 7 (SWC), React Router 7, Tailwind CSS 4, Framer Motion, Lucide React, Axios, Vitest

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
   Populates the database with ~110 documents across 8 collections. See [Seed Data](#seed-data).

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

---

## Seed Data

`npm run seed` drops the database and repopulates it from the CSV files in
`herya-app-backend/src/seeds/data/`. Each collection has its own seed script in
`herya-app-backend/src/seeds/`, which reads its CSV with Node's `fs` module and
inserts the rows through the matching Mongoose model.

| Collection | Documents | Source CSV |
| --- | --- | --- |
| `poses` | 26 | `poses.csv` |
| `vksequences` | 21 | `sequences.csv` |
| `breathingpatterns` | 16 | `breathingPatterns.csv` |
| `sessiontemplates` | 14 | `sessionTemplates.csv` |
| `childprofiles` | 10 | `childProfiles.csv` |
| `sessions` | 8 | `sessions.csv` |
| `journalentries` | 8 | `journalEntries.csv` |
| `users` | 7 | `users.csv` (+ generated admin) |
| **Total** | **110** | |

### Seed order

Scripts run in dependency order in `src/seeds/index.js`, because later
collections reference earlier ones:

```
poses → breathingPatterns → sequences → users → sessions
      → journalEntries → childProfiles → sessionTemplates
```

### Relationships

- `VKSequence` → `Pose`
- `Session` → `User`, `VKSequence`, `BreathingPattern`, `ChildProfile`
- `JournalEntry` → `User`, `Session`
- `ChildProfile` → `User` (tutor)
- `SessionTemplate` → `User`, `ChildProfile`, `VKSequence`, `BreathingPattern`

References are resolved by **natural key**, not by raw ObjectId: seeds look up
the user's email, the child's name, the sequence's `family:level` pair, or the
breathing pattern's `romanizationName`, then store the resulting `_id`. This
keeps the CSV files readable and diff-friendly.

### CSV conventions

- Multi-value cells are comma-separated inside quotes, e.g. `"loud noises,bright lights"`.
- `sessionTemplates.csv` is normalised **one row per block**, grouped by
  `templateKey`; a template with three blocks spans three rows. That is why it
  has 25 rows but produces 14 documents.
- Every seed is idempotent: it checks `countDocuments()` first and skips if the
  collection is already populated.

---

## Available Scripts

### Backend (`herya-app-backend`)
- `npm run dev` — Start backend with file watching
- `npm start` — Start backend in production mode
- `npm run seed` — Reset and import all seed data from CSV (see [Seed Data](#seed-data))
- `npm run seed:recalc-stats` — Recalculate user stats from existing data
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
- Insomnia request collection: `docs/herya-insomnia.json`

---

## License

Copyright (c) 2026 Max Primavera

All rights reserved.

This repository and its contents are proprietary. No permission is granted to use, copy, modify, or distribute the software.
