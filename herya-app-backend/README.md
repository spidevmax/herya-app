# Herya App — Backend

REST API for the Herya yoga application. Built with Node.js, Express and MongoDB, it manages yoga poses, breathing patterns, Vinyasa Krama sequences, user profiles, practice sessions and journal entries. Includes JWT authentication with role-based access control and an admin panel for content and user management.

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
- [Rate Limiting](#rate-limiting)
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
| Email | Nodemailer (SMTP) |
| Image Storage | Cloudinary + Multer + multer-storage-cloudinary |
| Validation | express-validator |
| Rate Limiting | express-rate-limit |
| CORS | cors |
| Logging | Morgan |
| Environment | dotenv |
| CSV Parsing | PapaParse (seeds) |
| Documentation | Swagger (swagger-jsdoc + swagger-ui-express) |
| Linter/Formatter | Biome 2 |
| Testing | Jest 30 + Supertest + mongodb-memory-server |
| Dev Server | Nodemon |

---

## Project Structure

```
├── index.js                  # Entry point: connects DB, starts server, graceful shutdown
├── jest.config.js            # Jest configuration
├── biome.json                # Biome linter/formatter configuration
├── SWAGGER_GUIDE.md          # Swagger annotation guide for contributors
├── src/
│   ├── app.js                # Express app (middleware, routes, error handlers)
│   ├── api/
│   │   ├── controllers/      # Business logic per resource
│   │   ├── models/           # Mongoose schemas
│   │   ├── routes/           # Express routers with Swagger annotations
│   │   └── validations/      # express-validator rule sets
│   ├── config/
│   │   ├── db.js             # MongoDB connection
│   │   ├── cloudinary.js     # Cloudinary configuration
│   │   └── swagger.js        # Swagger/OpenAPI configuration
│   ├── middlewares/
│   │   ├── authorization.middleware.js  # JWT auth + RBAC
│   │   ├── validation.middleware.js     # Validation error handler
│   │   └── upload/           # Multer/Cloudinary upload configs
│   ├── seeds/                # DB seed scripts (CSV → MongoDB)
│   │   └── data/             # CSV source files
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
git clone https://github.com/spidevmax/herya-app.git
cd herya-app/herya-app-backend

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

Loads poses, breathing patterns, sequences, users, sessions and journal entries from the CSV files in `src/seeds/data/`.

---

## Environment Variables

Copy `.env.example` to `.env` and set the following:

| Variable | Description | Example |
|---|---|---|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `3000` |
| `DB_URL` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/herya` |
| `FRONTEND_URL` | Frontend origin (CORS) | `http://localhost:5173` |
| `BACKEND_URL` | Public backend URL (used for OAuth callback defaults) | `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `xxxxxxxxxxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | `GOCSPX-...` |
| `GOOGLE_REDIRECT_URI` | Google OAuth callback URL | `http://localhost:3000/api/v1/auth/google/callback` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `mycloud` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `123456789` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `abc123...` |
| `JWT_SECRET` | JWT signing secret | `openssl rand -base64 64` |
| `SMTP_HOST` | SMTP server host for password reset emails | `smtp.sendgrid.net` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_SECURE` | Use SMTPS (true for 465) | `false` |
| `SMTP_USER` | SMTP username | `apikey` |
| `SMTP_PASS` | SMTP password / API key | `SG.xxxxx` |
| `SMTP_FROM` | Sender for reset emails | `Herya <no-reply@herya.app>` |

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
| POST | `/api/v1/auth/forgot-password` | — | Request password reset email |
| POST | `/api/v1/auth/reset-password` | — | Reset password with token |
| GET | `/api/v1/auth/google` | — | Start Google OAuth flow |
| GET | `/api/v1/auth/google/callback` | — | Google OAuth callback and redirect to frontend |
| GET | `/api/v1/auth/me` | ✅ user | Get authenticated user profile from JWT |
| POST | `/api/v1/auth/logout` | ✅ user | Logout (client-side token invalidation helper) |

**Register body** (`multipart/form-data` or JSON):
```json
{
  "name": "John Doe",
  "email": "johndoe@example.com",
  "password": "SecurePass123",
  "experienceLevel": "beginner",
  "goals": ["reduce_stress", "improve_balance"],
  "preferredDuration": 30
}
```

**Login body:**
```json
{
  "email": "johndoe@example.com",
  "password": "SecurePass123"
}
```

**Forgot password body:**
```json
{
  "email": "johndoe@example.com",
  "locale": "es"
}
```

`locale` is optional and supports `es` or `en` to localize the reset email content.

**Response includes:**
```json
{
  "success": true,
  "message": "User registered successfully",
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
| PUT | `/api/v1/users/change-password` | ✅ user | Change password |
| PUT | `/api/v1/users/me/image` | ✅ user | Upload or replace profile image |
| DELETE | `/api/v1/users/me/image` | ✅ user | Delete profile image |
| GET | `/api/v1/users/me/stats` | ✅ user | Get practice statistics (sessions, minutes, streak) |
| DELETE | `/api/v1/users/me` | ✅ user | Delete account |

---

### Poses

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/poses` | — | List all poses (supports `?limit`, `?page`, `?difficulty`, `?category`, `?vkFamily`, `?sidedness`, `?drishti`, `?search`) |
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
| GET | `/api/v1/breathing-patterns/technique/:technique` | — | Filter patterns by technique type |
| GET | `/api/v1/breathing-patterns/:id` | — | Get pattern by ID |

**Recommended query params:** `?goal=calm&userLevel=beginner&timeOfDay=morning&duration=15`

Valid `goal` values: `calm`, `energize`, `balance`, `focus`, `cool`, `heat`

Valid `userLevel` values: `beginner`, `intermediate`, `advanced`

---

### Sessions

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/sessions` | ✅ user | List user's sessions |
| POST | `/api/v1/sessions` | ✅ user | Create a new session |
| GET | `/api/v1/sessions/stats` | ✅ user | Aggregated practice stats |
| GET | `/api/v1/sessions/active/current` | ✅ user | Get current active guided session (if any) |
| GET | `/api/v1/sessions/analytics/practice` | ✅ user | Get practice analytics summary |
| GET | `/api/v1/sessions/:id` | ✅ user | Get session by ID |
| PUT | `/api/v1/sessions/:id` | ✅ user | Update session |
| DELETE | `/api/v1/sessions/:id` | ✅ user | Delete session |
| POST | `/api/v1/sessions/:id/start` | ✅ user | Start or resume guided session |
| POST | `/api/v1/sessions/:id/pause` | ✅ user | Pause guided session |
| POST | `/api/v1/sessions/:id/advance-block` | ✅ user | Move to next/previous block in guided flow |
| POST | `/api/v1/sessions/:id/complete` | ✅ user | Complete guided session |
| POST | `/api/v1/sessions/:id/abandon` | ✅ user | Abandon guided session |

**Create session body:**
```json
{
  "sessionType": "vk_sequence",
  "vkSequence": "<sequenceId>",
  "duration": 45,
  "notes": "Felt grounded today"
}
```

Valid `sessionType` values: `vk_sequence`, `pranayama`, `meditation`, `complete_practice`

> If `sessionType` is `vk_sequence`, the `vkSequence` field (sequence ObjectId) is required. If `sessionType` is `complete_practice`, a `completePractice` object is required instead.

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
| GET | `/api/v1/sequences` | — | List all Vinyasa Krama sequences |
| GET | `/api/v1/sequences/search?q=` | — | Search sequences by name and description |
| GET | `/api/v1/sequences/stats/recommended` | ✅ user | Get recommended sequence for authenticated user |
| GET | `/api/v1/sequences/family/:family` | — | Filter sequences by VK family |
| GET | `/api/v1/sequences/:id` | — | Get sequence by ID |

---

### Admin

All admin routes require `role: "admin"`.

**User Management**

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/admin/users` | ✅ admin | List all users (supports `?role`, `?search`, `?page`, `?limit`) |
| PUT | `/api/v1/admin/users/:id/role` | ✅ admin | Update user role (`user`, `tutor`, or `admin`) |
| DELETE | `/api/v1/admin/users/:id` | ✅ admin | Delete user and all associated data |

**Pose Management**

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/admin/poses` | ✅ admin | Create a pose |
| PUT | `/api/v1/admin/poses/:id` | ✅ admin | Update a pose |
| DELETE | `/api/v1/admin/poses/:id` | ✅ admin | Delete a pose |

**Breathing Pattern Management**

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/admin/breathing-patterns` | ✅ admin | Create a breathing pattern |
| PUT | `/api/v1/admin/breathing-patterns/:id` | ✅ admin | Update a breathing pattern |
| DELETE | `/api/v1/admin/breathing-patterns/:id` | ✅ admin | Delete a breathing pattern |

**VK Sequence Management**

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/admin/sequences` | ✅ admin | Create a VK sequence |
| PUT | `/api/v1/admin/sequences/:id` | ✅ admin | Update a VK sequence |
| DELETE | `/api/v1/admin/sequences/:id` | ✅ admin | Delete a VK sequence |

**Analytics**

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/admin/analytics/dashboard` | ✅ admin | Global dashboard stats |
| GET | `/api/v1/admin/analytics/users/:userId` | ✅ admin | Analytics for a specific user |

---

## Authentication

The API uses **JWT Bearer tokens** with a 1-day expiry.

```
Authorization: Bearer <token>
```

Tokens are issued on register and login. Include the header in every protected request. The middleware validates the token, looks up the user in the database, and attaches the full user document to `req.user`.

**Roles:**
- `user` — default role, access to own resources
- `tutor` — elevated learning/support role (non-admin)
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

Error responses (validation errors — 400):

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    { "field": "email", "message": "Please provide a valid email address" }
  ]
}
```

Other error responses (404, 401, 403, 500):

```json
{
  "success": false,
  "message": "Error description"
}
```

---

## Rate Limiting

All routes are protected by `express-rate-limit`. Limits are applied per IP address and reset every 15 minutes.

| Route group | Max requests | Window |
|---|---|---|
| `/api/v1/auth` | 10 | 15 min |
| All other `/api/v1/*` routes | 100 | 15 min |

When the limit is exceeded the API responds with HTTP `429 Too Many Requests`:

```json
{
  "success": false,
  "message": "Too many requests, please try again later."
}
```

Rate limiting is disabled in the `test` environment.

---

## Error Handling

| Status | Meaning |
|---|---|
| 400 | Bad request / validation error |
| 401 | Unauthenticated (missing or invalid token) |
| 403 | Forbidden (insufficient role) |
| 404 | Resource not found |
| 500 | Internal server error |

All async errors are caught via try-catch in each controller and forwarded to the global error handler via `next(error)`. Express 5 also propagates unhandled promise rejections automatically.

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
| `sessions.csv` | Session |
| `journalEntries.csv` | JournalEntry |

> Seeds run in dependency order: poses → breathing patterns → sequences → users → sessions → journal entries.

Default seeded users:

| Name | Email | Password | Role |
|---|---|---|---|
| Sarah Mitchell | sarah@example.com | `SecurePass123` | user |
| James Carter | james@example.com | `SecurePass456` | user |
| Emma Thompson | emma@example.com | `SecurePass789` | user |
| Daniel Harris | daniel@example.com | `SecurePass101` | user |
| Laura Bennett | laura@example.com | `SecurePass202` | admin |
| Admin User | admin@herya-app.com | `AdminPass123` | admin |

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

**Current test status:**

- 8 suites passing
- 102 tests passing

| Suite | Tests |
|---|---|
| `auth.test.js` | Register, login, error cases |
| `admin.test.js` | Admin auth, user management, content CRUD, analytics |
| `guidedPractice.test.js` | Guided practice lifecycle and analytics |
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
