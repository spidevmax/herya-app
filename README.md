# Herya

Web application for yoga practice with a Vinyasa Krama focus. The project is organized as a monorepo with:

- Frontend in React + Vite
- Backend REST API in Node.js + Express + MongoDB

## Table of contents

- [Overview](#overview)
- [Repository structure](#repository-structure)
- [Technologies](#technologies)
- [Requirements](#requirements)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Available scripts](#available-scripts)
- [Documentation and resources](#documentation-and-resources)
- [Architecture diagrams](#architecture-diagrams)
- [Testing and quality](#testing-and-quality)
- [Common issues](#common-issues)

## Overview

Herya allows:

- User registration and authentication with JWT
- Practice profile management
- Asana and breathing pattern exploration
- Vinyasa Krama sequence management
- Session logging and journal entries
- Admin panel for content and user management

## Repository structure

```text
.
├── docs/
│   ├── herya-app-memoria.docx
│   ├── herya-insomnia.json
│   ├── PLANNING.md
│   └── ...
├── herya-app-backend/
│   ├── src/
│   ├── tests/
│   ├── index.js
│   └── package.json
└── herya-app-frontend/
    ├── src/
    ├── public/
    └── package.json
```

## Technologies

### Backend

- Node.js + Express 5
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
- Axios
- Tailwind CSS 4
- Framer Motion

## Requirements

- Node.js 18 or higher
- npm 9 or higher
- Local MongoDB or MongoDB Atlas
- Cloudinary account (for uploads)

## Getting started

### 1) Clone and install dependencies

```bash
git clone https://github.com/spidevmax/herya-app.git
cd herya-app

cd herya-app-backend && npm install
cd ../herya-app-frontend && npm install
cd ..
```

### 2) Configure environment variables

Create these files manually:

- `herya-app-backend/.env`
- `herya-app-frontend/.env`

Use the minimum recommended values in the [Environment variables](#environment-variables) section.

### 3) (Optional) Seed the database

```bash
cd herya-app-backend
npm run seed
```

### 4) Start backend and frontend

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

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Swagger: `http://localhost:3000/api-docs`

## Environment variables

### Backend (`herya-app-backend/.env`)

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

### Frontend (`herya-app-frontend/.env`)

```env
VITE_API_URL=http://localhost:3000/api/v1
```

## Available scripts

### Backend (`herya-app-backend`)

- `npm run dev`: start server with nodemon
- `npm start`: start server in normal mode
- `npm run seed`: run seed scripts
- `npm test`: run tests
- `npm run lint`: run Biome linter
- `npm run format`: format code with Biome
- `npm run check`: lint + format checks
- `npm run check:fix`: auto-fix lint and formatting issues

### Frontend (`herya-app-frontend`)

- `npm run dev`: start Vite in development mode
- `npm run build`: production build
- `npm run preview`: preview production build
- `npm run lint`: run ESLint

## Documentation and resources

- Academic memory document: `docs/herya-app-memoria.docx`
- Insomnia collection: `docs/herya-insomnia.json`
- Product planning notes: `docs/PLANNING.md`
- Backend Swagger guide: `herya-app-backend/SWAGGER_GUIDE.md`
- Detailed backend docs: `herya-app-backend/README.md`

## Architecture diagrams

Recommended diagrams for technical documentation and memory:

- Database ER diagram (Mongo models and relationships)
- Navigation flow diagram (frontend routes and user flows)

Suggested export format:

- PNG for the final document
- Mermaid source (`.mmd`) to keep diagrams editable

## Testing and quality

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
```

## Common issues

- CORS error:
  verify that `FRONTEND_URL` in backend matches the actual frontend URL.

- `401 Unauthorized` in frontend:
  verify the token exists in localStorage and `JWT_SECRET` has not changed.

- MongoDB connection error:
  validate `DB_URL` and network access in MongoDB Atlas.

- Upload failures:
  verify `CLOUDINARY_*` credentials.
