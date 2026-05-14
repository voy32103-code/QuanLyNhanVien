# Testing

QuanLyNV uses the built-in Node.js test runner so the test suite can run without downloading extra packages.

## Unit Tests

```bash
npm test
```

This runs syntax checks and unit tests for:

- backend payload validators
- password hashing and token hashing helpers
- in-memory rate limiter behavior

## API Smoke Tests

Start the backend first:

```bash
npm run backend:start
```

Then run:

```bash
npm run test:api
```

The API smoke suite checks:

- health endpoint
- read endpoints reject missing auth token
- unauthorized write protection
- unauthorized audit log protection
- invalid login behavior and login rate-limit headers

Set these variables to enable authenticated read and write-flow tests:

```bash
TEST_ADMIN_EMAIL=admin@example.com
TEST_ADMIN_PASSWORD=your-strong-password
```

The authenticated flow creates temporary department, service category, employee, and service request records, advances a request, soft-deletes the created records, and checks audit logs.

## E2E Alias

```bash
npm run test:e2e
```

For now this aliases the API smoke tests. A browser-level Playwright suite can be added later when dependency installation is available.
