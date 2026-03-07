/**
 * Swagger/OpenAPI Configuration
 * =============================
 * Initializes and configures Swagger UI for interactive API documentation.
 *
 * Purpose:
 * - Configure OpenAPI 3.0 specification with API metadata
 * - Define security schemes (JWT Bearer authentication)
 * - Define common error schemas for responses
 * - Scan route files for @swagger JSDoc comments and generate OpenAPI spec
 * - Serve Swagger UI at /api-docs endpoint
 *
 * Environment Variables:
 * - PORT: Server port (used in server URL configuration)
 * - NODE_ENV: Deployment environment (development/production)
 *
 * Usage:
 * const { swaggerUiMiddleware, swaggerUiSetup } = require("./src/config/swagger");
 * app.use("/api-docs", swaggerUiMiddleware, swaggerUiSetup);
 *
 * Integration:
 * - Automatically discovers @swagger JSDoc comments in ./src/api/routes/*.js
 * - Updates documentation on server restart
 * - No additional configuration needed per endpoint
 *
 * @see https://swagger.io/specification/
 * @see https://github.com/Surnet/swagger-jsdoc
 * @see https://github.com/scottie1984/swagger-ui-express
 */

const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const PORT = process.env.PORT || 3000;

/**
 * Swagger/OpenAPI 3.0 Configuration
 * Defines API metadata, security schemes, and schemas
 */
const swaggerOptions = {
	definition: {
		openapi: "3.0.0",
		info: {
			title: "Herya App API",
			version: "1.0.0",
			description:
				"Yoga app API for Vinyasa Krama practice - Poses, breathing patterns, sequences, and user management",
			contact: {
				name: "Herya App Support",
				url: "https://herya-app.com",
			},
		},
		servers: [
			{
				url: `http://localhost:${PORT}`,
				description: "Development server",
			},
			{
				url: "https://api.herya-app.com",
				description: "Production server",
			},
		],
		components: {
			securitySchemes: {
				bearerAuth: {
					type: "http",
					scheme: "bearer",
					bearerFormat: "JWT",
					description: 'JWT Bearer token. Format: "Bearer <token>"',
				},
			},
			schemas: {
				Error: {
					type: "object",
					properties: {
						error: {
							type: "object",
							properties: {
								message: {
									type: "string",
								},
								status: {
									type: "integer",
								},
							},
						},
					},
				},
			},
		},
	},
	// Automatically scan route files for @swagger JSDoc comments
	apis: ["./src/api/routes/*.js"],
};

/**
 * Generate OpenAPI specification from JSDoc comments and config
 * This happens at server startup and includes all @swagger blocks from route files
 */
const swaggerSpec = swaggerJsdoc(swaggerOptions);

/**
 * Express middleware that serves Swagger UI
 * Mount at app.use("/api-docs", swaggerUiMiddleware)
 * @type {express.RequestHandler[]}
 */
const swaggerUiMiddleware = swaggerUi.serve;

/**
 * Swagger UI setup handler
 * Should be called after swaggerUi.serve in route chain
 * @type {function}
 */
const swaggerUiSetup = swaggerUi.setup(swaggerSpec);

module.exports = {
	swaggerSpec,
	swaggerUiMiddleware,
	swaggerUiSetup,
};
