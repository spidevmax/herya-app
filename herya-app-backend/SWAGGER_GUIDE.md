# Swagger API Documentation Guide

## 📚 Overview

This backend is documented with **Swagger/OpenAPI 3.0** for interactive API exploration and testing.

## 🚀 Accessing Swagger Documentation

Once the server is running, **Swagger documentation is available at:**

```
http://localhost:3000/api-docs
```

## 📖 What You Can Do in Swagger UI

1. **Browse all endpoints** - See all available API routes organized by tags
2. **Try endpoints** - Use "Try it out" button to test requests directly
3. **View request/response schemas** - See data structure and validation rules
4. **Authorize with JWT** - Click the "Authorize" button to add your authentication token
5. **Copy curl commands** - Generate curl commands for manual testing
6. **Download OpenAPI spec** - Get the raw OpenAPI JSON specification

## 🔐 Authentication

### Adding JWT Token

1. Click the **"Authorize"** button in the top-right of Swagger UI
2. Enter your token in exactly this format:

```
Bearer your_jwt_token_here
```

3. Click **"Authorize"** to add the token to all subsequent requests
4. Click **"Logout"** to remove the token

### Getting a Token

1. **Register** a new user with `POST /api/v1/auth/register`
2. **Login** with `POST /api/v1/auth/login`
3. Copy the returned `token` value
4. Use it for authenticated endpoints

## 📦 API Sections

The API is organized into these main sections:

### Authentication
- `POST /api/v1/auth/register` - Create new user account
- `POST /api/v1/auth/login` - Authenticate user

### Users
- `GET /api/v1/users/me` - Get my profile (requires auth)
- `PUT /api/v1/users/me` - Update my profile (requires auth)
- `PUT /api/v1/users/change-password` - Change password (requires auth)
- `DELETE /api/v1/users/me` - Delete account (requires auth)
- `GET /api/v1/users/me/stats` - Get practice statistics (requires auth)

### Poses
- `GET /api/v1/poses` - Get all poses (public)
- `GET /api/v1/poses/search` - Search poses (public)
- `GET /api/v1/poses/category/{category}` - Get poses by category (public)
- `GET /api/v1/poses/family/{family}` - Get poses by VK family (public)
- `GET /api/v1/poses/{id}` - Get pose details (public)
- `GET /api/v1/poses/{id}/related` - Get related poses (public)

### Journal Entries
- `GET /api/v1/journal-entries` - Get all entries (requires auth)
- `POST /api/v1/journal-entries` - Create entry (requires auth)
- `GET /api/v1/journal-entries/{id}` - Get entry details (requires auth)
- `PUT /api/v1/journal-entries/{id}` - Update entry (requires auth)
- `DELETE /api/v1/journal-entries/{id}` - Delete entry (requires auth)
- `GET /api/v1/journal-entries/digital-garden` - Get mood visualization (requires auth)

### Breathing Patterns
- `GET /api/v1/breathing-patterns` - Get all patterns (public)
- `GET /api/v1/breathing-patterns/search` - Search patterns (public)
- `GET /api/v1/breathing-patterns/recommended` - Get recommended pattern by goal/level (public)
- `GET /api/v1/breathing-patterns/progression` - Get learning progression path (public)
- `GET /api/v1/breathing-patterns/technique/{technique}` - Get patterns by technique (public)
- `GET /api/v1/breathing-patterns/{id}` - Get pattern details (public)

### Sessions
- `GET /api/v1/sessions/stats` - Get aggregate practice statistics (requires auth)
- `GET /api/v1/sessions` - Get all sessions (requires auth)
- `POST /api/v1/sessions` - Create session (requires auth)
- `GET /api/v1/sessions/{id}` - Get session details (requires auth)
- `PUT /api/v1/sessions/{id}` - Update session (requires auth)
- `DELETE /api/v1/sessions/{id}` - Delete session (requires auth)

### Sequences
- `GET /api/v1/sequences` - Get all sequences (public)
- `GET /api/v1/sequences/search` - Search sequences (public)
- `GET /api/v1/sequences/stats/recommended` - Get recommended sequence for user (requires auth)
- `GET /api/v1/sequences/family/{family}` - Get sequences by VK family (public, marks isAccessible with auth)
- `GET /api/v1/sequences/{id}` - Get sequence details (public)

### Admin

**User Management**
- `GET /api/v1/admin/users` - List all users with pagination/search (admin only)
- `PUT /api/v1/admin/users/{id}/role` - Change user role (admin only)
- `DELETE /api/v1/admin/users/{id}` - Delete user + cascade data (admin only)

**VK Sequence Management**
- `POST /api/v1/admin/sequences` - Create system sequence (admin only)
- `PUT /api/v1/admin/sequences/{id}` - Update sequence (admin only)
- `DELETE /api/v1/admin/sequences/{id}` - Delete sequence (admin only)

**Pose Management**
- `POST /api/v1/admin/poses` - Create system pose with media (admin only)
- `PUT /api/v1/admin/poses/{id}` - Update pose and/or media (admin only)
- `DELETE /api/v1/admin/poses/{id}` - Delete pose + Cloudinary media (admin only)

**Breathing Pattern Management**
- `POST /api/v1/admin/breathing-patterns` - Create system pattern (admin only)
- `PUT /api/v1/admin/breathing-patterns/{id}` - Update pattern (admin only)
- `DELETE /api/v1/admin/breathing-patterns/{id}` - Delete pattern (admin only)

**Analytics**
- `GET /api/v1/admin/analytics/dashboard` - Global platform statistics (admin only)
- `GET /api/v1/admin/analytics/users/{userId}` - Detailed analytics per user (admin only)

## 🛠️ Swagger Configuration

The Swagger configuration is in [src/config/swagger.js](src/config/swagger.js):

```javascript
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Herya App API",
      version: "1.0.0",
      description: "Yoga app API for Vinyasa Krama practice...",
    },
    servers: [
      { url: "http://localhost:3000", description: "Development" },
      { url: "https://api.herya-app.com", description: "Production" },
    ],
  },
  apis: ["./src/api/routes/*.js"],
};
```

## 📝 Adding Documentation to New Endpoints

Every endpoint should have Swagger documentation. Use this template:

```javascript
/**
 * @swagger
 * /api/v1/your-endpoint:
 *   get:
 *     summary: Brief description
 *     description: Detailed description of what this endpoint does
 *     tags:
 *       - Your Feature Name
 *     security:
 *       - bearerAuth: []  // Remove this if endpoint is public
 *     parameters:
 *       - in: query
 *         name: paramName
 *         schema:
 *           type: string
 *         description: What this param does
 *     responses:
 *       200:
 *         description: Success response description
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/your-endpoint", yourController);
```

## 🚨 Common Issues

### Swagger not loading
- Make sure server is running on port 3000
- Check that `/api-docs` returns HTML (not JSON)
- Browser may need hard refresh (Cmd+Shift+R or Ctrl+Shift+F5)

### Authorization not working
- Token format must include "Bearer " prefix
- JWT_SECRET in .env must match token generation
- Token expires after **1 day** (hardcoded in `src/utils/token.js`)

### Endpoints not showing up
- Documentation must be in JSDoc comments (`/** @swagger ... */`)
- Must be in `/src/api/routes/*.js` files
- Restart server after adding new documentation

## 📚 OpenAPI Resources

- [OpenAPI 3.0 Spec](https://spec.openapis.org/oas/v3.0.0)
- [Swagger-JSDoc Documentation](https://github.com/Surnet/swagger-jsdoc)
- [Swagger UI Demo](https://petstore.swagger.io/)

## 🔗 Health Check

Check if API is running:

```bash
curl http://localhost:3000/
```

Should return:

```json
{
  "message": "Herya App Backend - Vinyasa Krama Practice",
  "status": "Server is running",
  "version": "1.0.0",
  "endpoints": {
    "auth": "/api/v1/auth",
    "admin": "/api/v1/admin",
    "poses": "/api/v1/poses",
    "breathingPatterns": "/api/v1/breathing-patterns",
    "users": "/api/v1/users",
    "journalEntries": "/api/v1/journal-entries",
    "sessions": "/api/v1/sessions",
    "sequences": "/api/v1/sequences"
  }
}
```

---

**Swagger automatically updates as you restart the server!** 🎉
