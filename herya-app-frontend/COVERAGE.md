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

Configured under `coverage.thresholds` in [vitest.config.js](vitest.config.js).
A run exits non-zero if any metric falls below its floor.

| Metric | Floor | Current |
|---|---|---|
| Lines | 25% | 25.6% |
| Functions | 27% | 32.2% |
| Branches | 52% | 55.5% |
| Statements | 25% | 25.6% |

Functions and branches carry extra headroom deliberately: readings of 28.6% and
53.2% have shown up against an otherwise steady 32.2% / 55.5% while files were
being edited. Lines and statements have been rock-steady at 25.65%.

**These are a floor, not a target.** They sit just under the current numbers so
the gate ratchets: it blocks regressions now, and each batch of new tests should
raise it.

They previously read `lines: 70` and so on, declared directly on `coverage`
rather than inside `thresholds`. Vitest ignores them there, so a documented 70%
gate sat inert over a suite at 25% — the numbers were aspirational and nothing
enforced them. The keys moved; the values were set to what the suite actually
meets, because a gate that fails on every run gets disabled rather than fixed.

Note that v8 coverage varies by a few hundredths between runs, which is why the
floors leave roughly a point of headroom.

## What's measured

Active test files include unit tests for hooks, utilities, and a subset of components. Excluded from coverage instrumentation (see `coverage.exclude` in `vitest.config.js`):

- `node_modules/`
- `src/test/` (test setup and helpers)
- `**/*.test.{js,jsx}` and `**/*.spec.{js,jsx}`
- `src/main.jsx`
- `src/index.css`

## Skipped suites

None. Every suite in `src/test/` runs — `test.exclude` holds only `node_modules`
and `dist`.

Nine suites used to be excluded here as "stale". They were repaired rather than
deleted: most failures were test-harness problems (a missing language provider, a
motion mock that only defined `motion.div`, selects inside a collapsed panel, a
page rendered without a router) rather than broken components. Two asserted
features that had genuinely been removed and were rewritten against current
behaviour.

If a suite ever needs excluding again, say why in a comment next to the entry —
an unexplained exclusion reads as coverage that does not exist.

## Report files

The `coverage/` directory contains:

- `index.html` — main HTML dashboard
- `coverage-final.json` — machine-readable JSON
- `lcov.info` — LCOV format for CI tools
- `lcov-report/` — per-file HTML reports

## In CI

`.github/workflows/ci.yml` runs `npm run lint`, then `npm run test:coverage`,
then `npm run build`. The coverage step is what enforces the floors above, so a
drop fails the build rather than going unnoticed.

The backend job mirrors this with its own gate in `jest.config.js`
(`coverageThreshold`), enforced by its `test:coverage` script.

The frontend job used to be gated on a condition that never matched on push, so
it only ever ran on pull requests; and `@biomejs/biome` was not a dependency
here, so `npm run lint` resolved to whatever Biome happened to be installed
globally. Both are fixed — keep Biome in `devDependencies` or CI has no linter.

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
- Page components are largely uncovered (most `src/pages/*.jsx` sit at 0%). The
  covered ground is hooks, utilities and the dashboard/session components. That
  is where the 25% comes from, and where raising it would start.
