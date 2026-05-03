# Coverage Reports

## Generating coverage reports

To generate a coverage report for the test suite, run:

```bash
npm run test:coverage
```

This runs all active tests with V8 instrumentation and emits reports in multiple formats:

- **HTML** — interactive dashboard
- **LCOV** — for CI/CD integrations
- **JSON** — machine-readable metrics
- **Text** — console output

## Viewing the report

Open the HTML dashboard in your browser:

```bash
open coverage/index.html
```

Or open `coverage/index.html` from the file explorer.

## Thresholds

Coverage thresholds are configured in [vitest.config.js](vitest.config.js):

| Metric | Threshold |
|---|---|
| Lines | 70% |
| Functions | 70% |
| Branches | 65% |
| Statements | 70% |

A run fails if any active metric drops below its threshold.

## What's measured

Active test files include unit tests for hooks, utilities, and a subset of components. Excluded from coverage instrumentation (see `coverage.exclude` in `vitest.config.js`):

- `node_modules/`
- `src/test/` (test setup and helpers)
- `**/*.test.{js,jsx}` and `**/*.spec.{js,jsx}`
- `src/main.jsx`
- `src/index.css`

## Stale / temporarily skipped suites

Several suites are excluded from the run via `test.exclude` in `vitest.config.js` because their assertions target UI that has been intentionally removed or refactored:

- `src/test/HeroCard.test.jsx`
- `src/test/PostPracticeJournal.test.jsx`
- `src/test/RecentSessionCard.test.jsx`
- `src/test/TutorInsightsCard.test.jsx`
- `src/test/StartPractice.roleGate.test.jsx`
- `src/test/Dashboard.tutorVisibility.test.jsx`
- `src/test/Journal.history.test.jsx`
- `src/test/Journal.queryParams.test.jsx`
- `src/test/Library.test.jsx`

These need to be updated to match the current components before being re-enabled. Coverage numbers reflect only the active suites.

## Report files

The `coverage/` directory contains:

- `index.html` — main HTML dashboard
- `coverage-final.json` — machine-readable JSON
- `lcov.info` — LCOV format for CI tools
- `lcov-report/` — per-file HTML reports

## Available scripts

```bash
npm run test:coverage   # Run with coverage
npm test                # Run without coverage
npm run test:watch      # Watch mode for development
npm run lint            # Biome check on src/
```

## Notes

- The `coverage/` directory is generated locally and excluded from git via `.gitignore`.
- Focus on high-value code paths (business logic, hooks, critical UI flows) rather than chasing 100%.
- When you re-enable a stale suite, remove its entry from `test.exclude` in [vitest.config.js](vitest.config.js).
