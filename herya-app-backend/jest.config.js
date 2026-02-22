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
};
