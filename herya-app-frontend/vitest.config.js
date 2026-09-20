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
			// Asserts the tutor-preset picker, which was removed from the product
			// in da540b7 along with this very file — it came back without the
			// feature. Two of its three cases now pass vacuously. Delete the
			// suite, or restore the feature and re-enable it; do not leave it
			// excluded as a way of keeping the run green.
			"src/test/StartPractice.roleGate.test.jsx",
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
			lines: 70,
			functions: 70,
			branches: 65,
			statements: 70,
		},
	},
});
