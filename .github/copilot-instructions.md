# GitHub Copilot Instructions

## Test Commands

### Unit Tests

To run unit tests, use the following npm scripts from the root directory:

```bash
# Run all unit tests for both projects
npm run test:unit:all

# Alternative way to run all unit tests (same result as above)
npm run test:all

# Run unit tests for Guiders only
npm run test:jest:guiders

# Run unit tests for Backoffice only
npm run test:jest:backoffice

# Run unit tests with coverage for Guiders
cd guiders && npm run test:jest:coverage

# Run unit tests with coverage for Backoffice
cd backoffice && npm run test:jest:coverage

# Run unit tests using the shell script (same result as test:unit:all)
npm run test:run-unit
```

### End-to-End (E2E) Tests with Cypress

To run E2E tests, use these npm scripts from the root directory:

```bash
# Run all E2E tests for both projects in headless mode
npm run test:e2e:all

# Run E2E tests for Guiders in headless mode
npm run test:cypress:headless:guiders

# Run E2E tests for Backoffice in headless mode
npm run test:cypress:headless:backoffice

# Open Cypress GUI for Guiders for interactive testing
npm run test:cypress:open:guiders

# Open Cypress GUI for Backoffice for interactive testing
npm run test:cypress:open:backoffice

# Run E2E tests using the shell script (alternative to test:e2e:all)
npm run test:run-e2e
```

### Combined Tests

```bash
# Run all tests (unit tests and E2E tests) with comprehensive reporting
npm run test:full
```

All test commands are configured in the respective package.json files.
