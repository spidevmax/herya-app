# Herya App — Backend

REST API for the Herya yoga application. Built with Node.js, Express and MongoDB, it manages yoga poses, breathing patterns, Vinyasa Krama sequences, user profiles, practice sessions and journal entries.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API Reference](#api-reference)
  - [Health Check](#health-check)
  - [Auth](#auth)
  - [Users](#users)
  - [Poses](#poses)
  - [Breathing Patterns](#breathing-patterns)
  - [Sessions](#sessions)
  - [Journal Entries](#journal-entries)
  - [Sequences](#sequences)
  - [Admin](#admin)
- [Authentication](#authentication)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Database Seeding](#database-seeding)
- [Testing](#testing)
- [Linting & Formatting](#linting--formatting)
- [API Documentation (Swagger)](#api-documentation-swagger)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (CommonJS) |
| Framework | Express 5 |
| Database | MongoDB + Mongoose 9 |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Image Storage | Cloudinary + Multer |
| Validation | express-validator |
| Documentation | Swagger (swagger-jsdoc + swagger-ui-express) |
| Linter/Formatter | Biome 2 |
| Testing | Jest 30 + Supertest + mongodb-memory-server |

---

## Project Structure

```
├── index.js                  # Entry point: connects DB and starts server
├── src/
│   ├── app.js                # Express app (middleware, routes, error handlers)
│   ├── api/
│   │   ├── controllers/      # Business logic per resource
│   │   ├── models/           # Mongoose schemas
│   │   ├── routes/           # Express routers with Swagger annotations
│   │   └── validations/      # express-validator rule sets
│   ├── config/
│   │   ├── db.js             # MongoDB connection
│   │   └── cloudinary.js     # Cloudinary configuration
│   ├── middlewares/
│   │   ├── authorization.middleware.js  # JWT auth + RBAC
│   │   ├── validation.middleware.js     # Validation error handler
│   │   └── upload/           # Multer/Cloudinary upload configs
│   ├── seeds/                # DB seed scripts (CSV → MongoDB)
│   ├── tests/                # Jest test suites
│   └── utils/                # Shared helpers (createError, sendResponse, token…)
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- A MongoDB instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- A [Cloudinary](https://cloudinary.com) account (for image uploads)

### Installation

```bash
# Clone the repo
git clone https://github.com/your-org/herya-app-backend.git
cd herya-app-backend

# Install dependencies
npm install

# Copy and fill in environment variables
cp .env.example .env
```

### Run in Development

```bash
npm run dev
```

The server starts at `http://localhost:3000` by default.

### Seed the Database

```bash
npm run seed
```

Loads poses, breathing patterns, sequences and default users from the CSV files in `src/seeds/data/`.

---

## Environment Variables

Copy `.env.example` to `.env` and set the following:

| Variable | Description | Example |
|---|---|---|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `3000` |
| `DB_URL` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/herya` |
| `FRONTEND_URL` | Frontend origin (CORS) | `http://localhost:5173` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `mycloud` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `123456789` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `abc123...` |
| `JWT_SECRET` | JWT signing secret | `openssl rand -base64 64` |

---

## Available Scripts

| Script | Description |
|---|---|
| `npm start` | Start server (production) |
| `npm run dev` | Start server with nodemon (development) |
| `npm run seed` | Seed the database |
| `npm test` | Run Jest test suite |
| `npm run check` | Run Biome linter + formatter check |
| `npm run check:fix` | Auto-fix lint and format issues |
| `npm run lint` | Lint only |
| `npm run format` | Format only |

Coverage report:

```bash
npm test -- --coverage
```

---

## API Reference

All endpoints are prefixed with `/api/v1`. Authenticated routes require a `Bearer` token in the `Authorization` header.

### Health Check

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | — | Server status and endpoint list |

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register` | — | Register a new user |
| POST | `/api/v1/auth/login` | — | Login and receive JWT |

**Register body** (`multipart/form-data` or JSON):
```json
{
  "name": "Marina López",
  "email": "marina@example.com",
  "password": "SecurePass123",
  "experienceLevel": "beginner",
  "goals": ["reduce_stress", "improve_balance"],
  "preferredDuration": 30
}
```

**Login body:**
```json
{
  "email": "marina@example.com",
  "password": "SecurePass123"
}
```

**Response includes:**
```json
{
  "data": {
    "token": "<jwt>",
    "user": { ... }
  }
}
```

---

### Users

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/users/me` | ✅ user | Get authenticated user profile |
| PUT | `/api/v1/users/me` | ✅ user | Update profile (name, preferences, goals…) |
| PUT | `/api/v1/users/me/change-password` | ✅ user | Change password |
| GET | `/api/v1/users/me/stats` | ✅ user | Get practice statistics (sessions, minutes, streak) |
| DELETE | `/api/v1/users/me` | ✅ user | Delete account |

---

### Poses

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/poses` | — | List all poses (supports `?limit`, `?page`, `?difficulty`) |
| GET | `/api/v1/poses/search?q=` | — | Full-text search across names and tags |
| GET | `/api/v1/poses/category/:category` | — | Filter by VK category |
| GET | `/api/v1/poses/family/:family` | — | Filter by VK family |
| GET | `/api/v1/poses/:id` | — | Get pose by ID |
| GET | `/api/v1/poses/:id/related` | — | Get related poses (preparatory, follow-up, counterposes) |

---

### Breathing Patterns

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/breathing-patterns` | — | List all patterns |
| GET | `/api/v1/breathing-patterns/search?q=` | — | Search patterns by name |
| GET | `/api/v1/breathing-patterns/recommended` | — | Get recommended pattern by `?goal` and `?level` |
| GET | `/api/v1/breathing-patterns/progression` | — | Full beginner → advanced progression list |
| GET | `/api/v1/breathing-patterns/:id` | — | Get pattern by ID |

**Recommended query params:** `?goal=calm&level=beginner`

Valid `goal` values: `calm`, `energize`, `balance`, `focus`, `restore`

---

### Sessions

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/sessions` | ✅ user | List user's sessions |
| POST | `/api/v1/sessions` | ✅ user | Create a new session |
| GET | `/api/v1/sessions/stats` | ✅ user | Aggregated practice stats |
| GET | `/api/v1/sessions/:id` | ✅ user | Get session by ID |
| PUT | `/api/v1/sessions/:id` | ✅ user | Update session |
| DELETE | `/api/v1/sessions/:id` | ✅ user | Delete session |

**Create session body:**
```json
{
  "sessionType": "meditation",
  "duration": 30,
  "sequence": "<sequenceId>",
  "notes": "Felt grounded today"
}
```

Valid `sessionType` values: `meditation`, `pranayama`, `asana`, `vinyasa`, `restorative`, `yin`, `mixed`

---

### Journal Entries

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/journal-entries` | ✅ user | List user's journal entries |
| POST | `/api/v1/journal-entries` | ✅ user | Create a journal entry |
| GET | `/api/v1/journal-entries/digital-garden` | ✅ user | Get digital garden view |
| GET | `/api/v1/journal-entries/:id` | ✅ user | Get entry by ID |
| PUT | `/api/v1/journal-entries/:id` | ✅ user | Update entry |
| DELETE | `/api/v1/journal-entries/:id` | ✅ user | Delete entry |

**Create entry body:**
```json
{
  "session": "<sessionId>",
  "moodBefore": ["stressed", "anxious"],
  "moodAfter": ["calm", "peaceful"],
  "energyLevel": { "before": 4, "after": 8 },
  "stressLevel": { "before": 7, "after": 3 },
  "notes": "Great morning practice"
}
```

---

### Sequences

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/sequences` | ✅ user | List all Vinyasa Krama sequences |
| GET | `/api/v1/sequences/:id` | ✅ user | Get sequence by ID |

---

### Admin

All admin routes require `role: "admin"`.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/admin/poses` | ✅ admin | Create a pose |
| PUT | `/api/v1/admin/poses/:id` | ✅ admin | Update a pose |
| DELETE | `/api/v1/admin/poses/:id` | ✅ admin | Delete a pose |
| GET | `/api/v1/admin/users` | ✅ admin | List all users |
| DELETE | `/api/v1/admin/users/:id` | ✅ admin | Delete a user |

---

## Authentication

The API uses **JWT Bearer tokens** with a 1-day expiry.

```
Authorization: Bearer <token>
```

Tokens are issued on register and login. Include the header in every protected request. The middleware validates the token, looks up the user in the database, and attaches the full user document to `req.user`.

**Roles:**
- `user` — default role, access to own resources
- `admin` — full access including admin routes

---

## Response Format

All responses follow a consistent envelope:

```json
{
  "success": true,
  "message": "Human-readable description",
  "data": { ... }
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ]
}
```

---

## Error Handling

| Status | Meaning |
|---|---|
| 400 | Bad request / validation error |
| 401 | Unauthenticated (missing or invalid token) |
| 403 | Forbidden (insufficient role) |
| 404 | Resource not found |
| 500 | Internal server error |

All unhandled async errors are caught by `asyncErrorWrapper` and forwarded to the global error handler.

---

## Database Seeding

```bash
npm run seed
```

Seeds the following collections from CSV files in `src/seeds/data/`:

| File | Collection |
|---|---|
| `poses.csv` | Pose |
| `breathingPatterns.csv` | BreathingPattern |
| `sequences.csv` | VKSequence |
| `users.csv` | User |

Default seeded users:

| Name | Email | Password | Role |
|---|---|---|---|
| Maria | maria@example.com | `SecurePass123` | user |
| Juan | juan@example.com | `SecurePass456` | user |
| Ana | ana@example.com | `SecurePass789` | admin |

> ⚠️ Running seed drops and recreates all seeded collections.

---

## Testing

The test suite uses **Jest** + **Supertest** with an in-memory MongoDB instance (no real database required).

```bash
# Run all tests
npm test

# Run with coverage report
npm test -- --coverage
```

**Test suites (45 tests total):**

| Suite | Tests |
|---|---|
| `auth.test.js` | Register, login, error cases |
| `users.test.js` | Profile CRUD, password change, stats |
| `poses.test.js` | List, search, category filter, get by ID |
| `breathingPatterns.test.js` | List, search, recommended, progression, get by ID |
| `sessions.test.js` | CRUD, stats, auth guards |
| `journalEntries.test.js` | CRUD, digital garden, auth guards |

Each test suite runs in full isolation: collections are cleared between tests via `afterEach`.

---

## Linting & Formatting

[Biome](https://biomejs.dev) is used for both linting and formatting.

```bash
# Check for issues
npm run check

# Auto-fix all issues
npm run check:fix
```

Configuration: [biome.json](biome.json)

---

## API Documentation (Swagger)

Interactive Swagger UI is available in development at:

```
http://localhost:3000/api-docs
```

All routes are annotated with JSDoc Swagger comments. Swagger is disabled in the `test` environment.
