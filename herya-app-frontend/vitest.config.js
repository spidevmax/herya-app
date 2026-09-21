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
		exclude: [
			"**/node_modules/**",
			"**/dist/**",
		],
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
			 * These must live under `thresholds`. Declared directly on
			 * `coverage` they are silently ignored, which is how a documented
			 * 70% gate sat inert over a suite at 25%.
			 *
			 * Set below the current numbers so the gate ratchets: it blocks
			 * regressions today, and each batch of new tests should raise it.
			 * They are a floor, not a target.
			 *
			 * Functions and branches carry extra headroom on purpose. Readings
			 * of 28.6% / 53.2% have been observed against a steady 32.2% / 55.5%
			 * while files were being edited, and a gate that trips at random is
			 * a gate someone eventually deletes.
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
