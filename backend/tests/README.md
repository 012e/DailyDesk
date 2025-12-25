# Integration Tests

This directory contains integration tests for the backend API using Vitest.

## Setup

The test infrastructure is configured to:

1. **Mock the `getConfig` function** - Uses temporary database paths for isolated test environments
2. **Run migrations before each test** - Ensures a clean database state for every test
3. **Mock authentication** - Bypasses JWT verification for easier testing
4. **Clean up after tests** - Removes temporary test databases

## Structure

```
tests/
├── setup.ts              # Global test setup, mocking, and migration runner
├── helpers/
│   └── auth.ts           # Authentication mocking utilities
└── boards.test.ts        # Example integration tests for boards API
```

## Running Tests

```bash
# Run tests in watch mode (interactive)
pnpm test

# Run tests once (CI mode)
pnpm test:run

# Run tests with UI
pnpm test:ui
```

## Writing Tests

### Basic Structure

```typescript
import { describe, test, expect, beforeEach, beforeAll } from "vitest";
import { OpenAPIHono } from "@hono/zod-openapi";
import setupRoutes from "@/routes";
import { mockAuthModule, createAuthHeaders } from "./helpers/auth";

// Mock authentication before running tests
beforeAll(() => {
  mockAuthModule();
});

describe("Your API Tests", () => {
  let app: OpenAPIHono;

  beforeEach(() => {
    app = new OpenAPIHono();
    setupRoutes(app);
  });

  test("should do something", async () => {
    const res = await app.request("/api/endpoint", {
      method: "GET",
      headers: createAuthHeaders(),
    });

    expect(res.status).toBe(200);
  });
});
```

### Making Authenticated Requests

```typescript
// Using the helper
const res = await app.request("/api/boards", {
  method: "GET",
  headers: createAuthHeaders(),
});

// Or manually
const res = await app.request("/api/boards", {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer mock-jwt-token-for-testing",
  },
});
```

### Testing Unauthenticated Requests

```typescript
test("should reject unauthenticated requests", async () => {
  const res = await app.request("/api/boards", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  expect(res.status).toBe(401);
});
```

### Testing with Request Body

```typescript
test("should create a resource", async () => {
  const data = {
    id: crypto.randomUUID(),
    name: "Test Resource",
  };

  const res = await app.request("/api/resources", {
    method: "POST",
    headers: createAuthHeaders(),
    body: JSON.stringify(data),
  });

  expect(res.status).toBe(200);
  const result = await res.json() as any;
  expect(result).toHaveProperty("id", data.id);
});
```

### Testing CRUD Operations

```typescript
describe("CRUD Operations", () => {
  test("should create, read, update, and delete", async () => {
    const id = crypto.randomUUID();
    
    // Create
    const createRes = await app.request("/api/boards", {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify({ id, name: "Test" }),
    });
    expect(createRes.status).toBe(200);

    // Read
    const readRes = await app.request(`/api/boards/${id}`, {
      method: "GET",
      headers: createAuthHeaders(),
    });
    expect(readRes.status).toBe(200);

    // Update
    const updateRes = await app.request(`/api/boards/${id}`, {
      method: "PATCH",
      headers: createAuthHeaders(),
      body: JSON.stringify({ name: "Updated" }),
    });
    expect(updateRes.status).toBe(200);

    // Delete
    const deleteRes = await app.request(`/api/boards/${id}`, {
      method: "DELETE",
      headers: createAuthHeaders(),
    });
    expect(deleteRes.status).toBe(200);
  });
});
```

## Database Isolation

Each test runs with its own isolated database:

- A new temporary database file is created before each test
- Migrations are automatically applied
- The database is cleaned up after all tests complete

This ensures:
- Tests don't interfere with each other
- Test data is isolated
- No manual cleanup is required

## Mock User

The default mock user (from `helpers/auth.ts`):

```typescript
{
  sub: "test-user-id-123",
  email: "test@example.com",
  name: "Test User",
}
```

This user is automatically set in the context for all authenticated requests.

## Best Practices

1. **Use descriptive test names** - Clearly describe what is being tested
2. **Test one thing per test** - Keep tests focused and simple
3. **Use beforeEach for setup** - Reset app state between tests
4. **Clean up resources** - Tests automatically clean up the database
5. **Test error cases** - Don't just test the happy path
6. **Use proper HTTP status codes** - Verify the correct status is returned
7. **Validate response structure** - Check that responses have expected properties

## CI/CD Integration

For CI environments, use:

```bash
pnpm test:run
```

This runs tests once without watching for changes.

## Troubleshooting

### Tests failing due to database locks

Make sure you're not running multiple test suites in parallel that might conflict.

### Authentication not working

Ensure `mockAuthModule()` is called in `beforeAll()` at the top of your test file.

### Migrations not running

Check that the `drizzle/` directory contains migration files and that the path in `setup.ts` is correct.

### TypeScript errors

Make sure your `tsconfig.json` includes the test files and that all dependencies are installed.
