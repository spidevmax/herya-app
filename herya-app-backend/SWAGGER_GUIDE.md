# Swagger API Documentation Guide

## Overview

This backend uses Swagger/OpenAPI 3.0 generated from JSDoc annotations in route files.
Swagger UI is the reference for request and response contracts during development.

## Access

When backend is running locally:

http://localhost:3000/api-docs

If you run with Docker and expose port 3000, the same URL applies.

## Main Uses

1. Browse all available endpoints by feature tags.
2. Inspect schemas and validation constraints.
3. Execute requests directly with Try it out.
4. Test protected routes using JWT Bearer authorization.
5. Export curl commands for manual testing.

## Authentication in Swagger

Use Authorize and paste token in this format:

Bearer your_jwt_token

Typical flow:

1. Call POST /api/v1/auth/register or POST /api/v1/auth/login.
2. Copy token from response data.
3. Paste into Authorize.

## API Route Map

Base prefix: /api/v1

### Auth

- POST /auth/register
- POST /auth/login
- POST /auth/forgot-password
- POST /auth/reset-password
- GET /auth/google
- GET /auth/google/callback
- GET /auth/me
- POST /auth/logout

### Users

- GET /users/me
- PUT /users/me
- PUT /users/change-password
- DELETE /users/me
- GET /users/me/stats
- PUT /users/me/image
- DELETE /users/me/image

### Sessions

- GET /sessions/stats
- GET /sessions/active/current
- GET /sessions/analytics/practice
- GET /sessions
- POST /sessions
- GET /sessions/:id
- PUT /sessions/:id
- DELETE /sessions/:id
- POST /sessions/:id/start
- POST /sessions/:id/pause
- POST /sessions/:id/advance-block
- POST /sessions/:id/complete
- POST /sessions/:id/abandon

### Journal Entries

- GET /journal-entries
- POST /journal-entries
- GET /journal-entries/digital-garden
- GET /journal-entries/:id
- PUT /journal-entries/:id
- DELETE /journal-entries/:id

### Poses

- GET /poses
- GET /poses/search
- GET /poses/category/:category
- GET /poses/family/:family
- GET /poses/:id
- GET /poses/:id/related

### Breathing Patterns

- GET /breathing-patterns
- GET /breathing-patterns/search
- GET /breathing-patterns/recommended
- GET /breathing-patterns/progression
- GET /breathing-patterns/technique/:technique
- GET /breathing-patterns/:id

### Sequences

- GET /sequences
- GET /sequences/search
- GET /sequences/family/:family
- GET /sequences/stats/recommended
- GET /sequences/:id

### Admin

- GET /admin/users
- PUT /admin/users/:id/role
- DELETE /admin/users/:id
- POST /admin/sequences
- PUT /admin/sequences/:id
- DELETE /admin/sequences/:id
- POST /admin/poses
- PUT /admin/poses/:id
- DELETE /admin/poses/:id
- POST /admin/breathing-patterns
- PUT /admin/breathing-patterns/:id
- DELETE /admin/breathing-patterns/:id
- GET /admin/analytics/dashboard
- GET /admin/analytics/users/:userId

## Configuration Source

Swagger setup lives in:

- src/config/swagger.js

JSDoc annotations are scanned from:

- src/api/routes/*.js

## Documenting a New Endpoint

Add a JSDoc block above the route handler.

```javascript
/**
 * @swagger
 * /api/v1/your-endpoint:
 *   get:
 *     summary: Short summary
 *     tags:
 *       - Your Tag
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/your-endpoint", controllerFn);
```

Restart backend and refresh /api-docs.

## Common Issues

### Swagger not available

1. Verify backend is running.
2. Verify NODE_ENV is not test (Swagger is disabled in test).
3. Refresh browser cache.

### 401 in protected routes

1. Verify Bearer token format.
2. Verify JWT_SECRET in running environment.
3. Generate a new token if expired.

### New endpoint missing in Swagger

1. Confirm annotation is in src/api/routes/*.js.
2. Confirm annotation starts with @swagger.
3. Restart server after edits.

## Health Check

```bash
curl http://localhost:3000/
```

Expected response includes backend status and API route groups.
