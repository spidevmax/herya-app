/** @type {import('jest').Config} */
module.exports = {
	testEnvironment: "node",
	setupFilesAfterEnv: ["<rootDir>/src/tests/setup.js"],
	testMatch: ["<rootDir>/src/tests/**/*.test.js"],
	testTimeout: 15000,
	verbose: true,
	forceExit: true,
	collectCoverageFrom: [
		"src/api/controllers/**/*.js",
		"src/api/routes/**/*.js",
		"src/middlewares/**/*.js",
		"src/utils/**/*.js",
		"!src/tests/**",
	],
	coverageDirectory: "coverage",
	coverageReporters: ["text", "lcov"],
	/*
	 * A floor, not a target: set just below the current numbers so the gate
	 * ratchets — it blocks regressions today and should be raised with each
	 * batch of new tests. Enforced in CI via `npm run test:coverage`.
	 */
	coverageThreshold: {
		global: {
			statements: 57,
			branches: 35,
			functions: 40,
			lines: 59,
		},
	},
};
