import { beforeAll, afterAll, beforeEach, vi } from "vitest";
import { drizzle } from "drizzle-orm/libsql/node";
import { migrate } from "drizzle-orm/libsql/migrator";

let testDbInstance: ReturnType<typeof drizzle>;

// Use vi.hoisted to ensure mocks are set up before module initialization
const { currentTestDb, TEST_DB_DIR, schema, path, fs } = await vi.hoisted(async () => {
  const path = await import("path");
  const fs = await import("fs");
  
  // Generate a unique test database path for each test run
  const TEST_DB_DIR = path.resolve(__dirname, "../tmp/test-dbs");
  const currentTestDb = path.join(TEST_DB_DIR, "test.db");

  // Ensure test database directory exists before mocking
  if (!fs.existsSync(TEST_DB_DIR)) {
    fs.mkdirSync(TEST_DB_DIR, { recursive: true });
  }

  // Create an initial empty database file
  if (!fs.existsSync(currentTestDb)) {
    fs.writeFileSync(currentTestDb, "");
  }

  // Mock the getConfig function before any imports
  vi.doMock("@/lib/config", () => {
    return {
      default: () => ({
        databaseUrl: `file:${currentTestDb}`,
        isProduction: false,
        authIssuerUrl: "https://test-domain.auth0.com/",
        authAudience: "test-audience",
      }),
    };
  });

  // Mock the auth module to bypass JWT verification
  vi.doMock("@/lib/auth", async () => {
    const { createMockAuthMiddleware } = await import("./helpers/auth");
    return {
      authMiddleware: vi.fn(() => createMockAuthMiddleware()),
      setupBearerAuth: vi.fn((app: any) => {
        // Mock implementation that doesn't actually set up bearer auth
        return app;
      }),
    };
  });

  // Import schema after mocks are set up
  const schema = await import("@/lib/db/schema");

  return { currentTestDb, TEST_DB_DIR, schema, path, fs };
});

beforeAll(async () => {
  // Initialize database connection and run migrations
  testDbInstance = drizzle({
    connection: {
      url: `file:${currentTestDb}`,
    },
    schema,
  });

  // Run migrations on the test database
  await migrate(testDbInstance, {
    migrationsFolder: path.resolve(__dirname, "../drizzle"),
  });
});

beforeEach(async () => {
  // Clear all tables before each test to ensure isolation
  await testDbInstance.delete(schema.cardsTable);
  await testDbInstance.delete(schema.checklistItemsTable);
  await testDbInstance.delete(schema.listsTable);
  await testDbInstance.delete(schema.boardsTable);
});

afterAll(async () => {
  // Cleanup: remove test database
  try {
    if (fs.existsSync(currentTestDb)) {
      fs.unlinkSync(currentTestDb);
    }
    // Remove any additional test database files
    if (fs.existsSync(TEST_DB_DIR)) {
      const files = fs.readdirSync(TEST_DB_DIR);
      for (const file of files) {
        if (file.startsWith("test") && file.endsWith(".db")) {
          fs.unlinkSync(path.join(TEST_DB_DIR, file));
        }
      }
    }
  } catch (e) {
    // Ignore errors during cleanup
  }
});

export { testDbInstance };
