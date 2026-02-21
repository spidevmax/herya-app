require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { connectDB } = require("./src/config/db");

const posesRouter = require("./src/api/routes/pose.routes");
const breathingPatternsRouter = require("./src/api/routes/breathing-pattern.routes");
const authRouter = require("./src/api/routes/auth.routes");
const usersRouter = require("./src/api/routes/user.routes");
const journalEntriesRouter = require("./src/api/routes/journal-entry.routes");
const sessionsRouter = require("./src/api/routes/session.routes");
const sequencesRouter = require("./src/api/routes/sequence.routes");

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());

// Para desarrollo
app.use(morgan("dev"));

/* Producción - solo frontend
  app.use(cors({
    origin: process.env.FRONTEND_URL, // ej: https://yoga-app.vercel.app
    credentials: true
  })); */

app.use(express.json());

connectDB();

// Health check route
app.get("/", (req, res) => {
	res.json({
		message: "🧘 Herya App Backend - Vinyasa Krama Practice",
		status: "Server is running",
		version: "1.0.0",
		endpoints: {
			auth: "/api/v1/auth",
			poses: "/api/v1/poses",
			breathingPatterns: "/api/v1/breathing-patterns",
			users: "/api/v1/users",
			journalEntries: "/api/v1/journal-entries",
			sessions: "/api/v1/sessions",
			sequences: "/api/v1/sequences",
		},
	});
});

// Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/poses", posesRouter);
app.use("/api/v1/breathing-patterns", breathingPatternsRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/journal-entries", journalEntriesRouter);
app.use("/api/v1/sessions", sessionsRouter);
app.use("/api/v1/sequences", sequencesRouter);

// Middleware 404 Not Found
app.use((req, res, next) => {
	const error = new Error("Route Not Found");
	error.status = 404;
	next(error);
});

app.use((err, req, res, next) => {
	res.status(err.status || 500).json({
		error: {
			message: err.message,
			status: err.status || 500,
		},
	});
});

app.listen(PORT, () => {
	console.log(`Server running in: http://localhost:${PORT}`);
});
