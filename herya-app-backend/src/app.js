const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

// Import routes
const authRouter = require("./api/routes/auth.routes");
const adminRouter = require("./api/routes/admin.routes");
const posesRouter = require("./api/routes/pose.routes");
const breathingPatternsRouter = require("./api/routes/breathing-pattern.routes");
const usersRouter = require("./api/routes/user.routes");
const journalEntriesRouter = require("./api/routes/journal-entry.routes");
const sessionsRouter = require("./api/routes/session.routes");
const sequencesRouter = require("./api/routes/sequence.routes");

const NODE_ENV = process.env.NODE_ENV || "development";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const DISABLE_RATE_LIMITS = process.env.DISABLE_RATE_LIMITS !== "false";

const app = express();

// === Middleware ===
app.use(
	cors({
		origin: FRONTEND_URL,
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
	}),
);

// Logging: skip in test environment to keep output clean
if (NODE_ENV !== "test") {
	app.use(morgan(NODE_ENV === "production" ? "combined" : "dev"));
}

app.use(express.json());

// === Rate Limiting ===
const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 10,
	standardHeaders: true,
	legacyHeaders: false,
	message: {
		success: false,
		message: "Too many requests, please try again later.",
	},
	skip: () => NODE_ENV === "test" || DISABLE_RATE_LIMITS,
});

const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100,
	standardHeaders: true,
	legacyHeaders: false,
	message: {
		success: false,
		message: "Too many requests, please try again later.",
	},
	skip: () => NODE_ENV === "test" || DISABLE_RATE_LIMITS,
});

// === Swagger Documentation (skip in test to avoid JSDoc parsing overhead) ===
if (NODE_ENV !== "test") {
	if (NODE_ENV === "production" && !process.env.FRONTEND_URL) {
		console.warn("⚠️  FRONTEND_URL not defined in production. CORS may not work correctly.");
	}
	const { swaggerUiMiddleware, swaggerUiSetup } = require("./config/swagger");
	app.use("/api-docs", swaggerUiMiddleware, swaggerUiSetup);
}

// === Health Check ===
app.get("/", (_req, res) => {
	res.json({
		message: "Herya App Backend - Vinyasa Krama Practice",
		status: "Server is running",
		version: "1.0.0",
		endpoints: {
			auth: "/api/v1/auth",
			admin: "/api/v1/admin",
			poses: "/api/v1/poses",
			breathingPatterns: "/api/v1/breathing-patterns",
			users: "/api/v1/users",
			journalEntries: "/api/v1/journal-entries",
			sessions: "/api/v1/sessions",
			sequences: "/api/v1/sequences",
		},
	});
});

// === API Routes ===
app.use("/api/v1/auth", authLimiter, authRouter);
app.use("/api/v1/admin", apiLimiter, adminRouter);
app.use("/api/v1/poses", apiLimiter, posesRouter);
app.use("/api/v1/breathing-patterns", apiLimiter, breathingPatternsRouter);
app.use("/api/v1/users", apiLimiter, usersRouter);
app.use("/api/v1/journal-entries", apiLimiter, journalEntriesRouter);
app.use("/api/v1/sessions", apiLimiter, sessionsRouter);
app.use("/api/v1/sequences", apiLimiter, sequencesRouter);

// === Error Handling ===
app.use((_req, _res, next) => {
	const error = new Error("Route Not Found");
	error.status = 404;
	next(error);
});

app.use((err, _req, res, _next) => {
	// Mongoose validation errors → 400 with structured details
	const isMongooseValidation = err.name === "ValidationError" && err.errors;
	const status = isMongooseValidation ? 400 : err.status || 500;
	const message = isMongooseValidation
		? "Validation error"
		: err.message || "Internal Server Error";

	if (NODE_ENV !== "test") {
		console.error(`[${status}] ${message}`);
	}

	const response = { success: false, message };

	if (isMongooseValidation) {
		response.errors = Object.entries(err.errors).map(([field, detail]) => ({
			field,
			message: detail.message,
		}));
	}

	res.status(status).json(response);
});

module.exports = app;
