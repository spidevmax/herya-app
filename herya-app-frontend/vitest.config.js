import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: ["./src/test/setup.js"],
		exclude: ["**/node_modules/**", "**/dist/**"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html", "lcov"],
			exclude: [
				"node_modules/",
				"src/test/",
				"**/*.test.{js,jsx}",
				"**/*.spec.{js,jsx}",
				"src/main.jsx",
				"src/index.css",
			],
			/*
			 * Minimum coverage. If a run drops below any of these numbers the
			 * command fails, so tests can't silently stop covering things.
			 *
			 * These options have to be inside `thresholds`. They used to be
			 * written one level up, directly on `coverage`, where Vitest simply
			 * ignores them. That is why the project claimed a 70% minimum for a
			 * long time while the real coverage was around 25% and nothing ever
			 * failed.
			 *
			 * The numbers are set a bit BELOW what we currently reach, on
			 * purpose. They are a floor to stop things getting worse, not a
			 * goal. Raise them each time you add a batch of tests.
			 *
			 * Functions and branches have more slack than the others because
			 * their measured value moves around a little between runs (we saw
			 * 28.6% and 53.2% against a usual 32.2% and 55.5%). If the numbers
			 * were tight, a run could fail without anyone changing the code,
			 * and a check that fails for no reason is a check people turn off.
			 */
			thresholds: {
				lines: 25,
				functions: 27,
				branches: 52,
				statements: 25,
			},
		},
	},
});
