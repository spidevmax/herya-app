# Coverage Reports

## Generating Coverage Reports

To generate coverage reports for the test suite, run:

```bash
npm run test:coverage
```

This will:
1. Run all tests with coverage instrumentation
2. Generate reports in multiple formats:
   - **HTML Report** (interactive dashboard)
   - **LCOV Report** (for CI/CD integration)
   - **JSON Report** (machine-readable metrics)
   - **Text Report** (console output)

## Accessing Coverage Reports

### HTML Interactive Dashboard
Open the HTML report in your browser to see detailed, interactive coverage metrics:

```bash
open coverage/index.html
```

Or navigate to `coverage/index.html` from the file explorer.

## Coverage Summary

**Overall Coverage Metrics:**
- Statements: 11.56%
- Branches: 59.87%
- Functions: 34.74%
- Lines: 11.56%

### High Coverage Components (95%+)
- ✅ **PracticeTypeSelector** - 100% coverage
- ✅ **PostPracticeJournal** - 99.18% statements
- ✅ **HeroCard** - 98.83% statements
- ✅ **RecentSessionCard** - 98.14% statements
- ✅ **Garden Page** - 92.53% statements
- ✅ **gardenFilters Utils** - 100% coverage

### Thresholds
Coverage thresholds are configured in `vitest.config.js`:
- Lines: 70%
- Functions: 70%
- Branches: 65%
- Statements: 70%

## Report Files

The `coverage/` directory contains:

- **index.html** - Main HTML dashboard for browsing coverage
- **coverage-final.json** - Machine-readable JSON format
- **lcov.info** - LCOV format (compatible with CI/CD tools)
- **lcov-report/** - Detailed HTML reports per file

## Available Scripts

```bash
# Run tests with coverage
npm run test:coverage

# Run tests without coverage
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run linter
npm run lint
```

## Coverage Trends

After each test run, coverage reports are automatically updated. Compare reports over time to track:
- Test coverage growth
- Areas needing more tests
- Regression detection

## Notes

- Coverage reports are generated locally and stored in `coverage/`
- The `coverage/` directory is excluded from git via `.gitignore`
- Coverage data helps identify untested code paths
- Focus on high-value code (business logic, critical paths) rather than achieving 100% coverage
