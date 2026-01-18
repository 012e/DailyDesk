import { vi, beforeAll, beforeEach, afterAll } from "vitest";
import { drizzle } from "drizzle-orm/libsql/node";
import { migrate } from "drizzle-orm/libsql/migrator";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let testDbInstance: ReturnType<typeof drizzle>;

// Generate a unique test database path for each test run
const TEST_DB_DIR = path.resolve(__dirname, "../tmp/test-dbs");
// Use a random ID for each test run to ensure isolation
const testRunId = crypto.randomBytes(8).toString("hex");
const currentTestDb = path.join(TEST_DB_DIR, `test-${testRunId}.db`);

// Ensure test database directory exists before mocking
if (!fs.existsSync(TEST_DB_DIR)) {
  fs.mkdirSync(TEST_DB_DIR, { recursive: true });
}

// Create an initial empty database file
if (!fs.existsSync(currentTestDb)) {
  fs.writeFileSync(currentTestDb, "");
}

// Generate a proper DB URL (handle Windows paths)
const dbUrl = process.platform === "win32" 
  ? `file:///${currentTestDb.replace(/\\/g, "/")}`
  : `file:${currentTestDb}`;

// Mock the getConfig function before any imports
vi.mock("@/lib/config", () => {
  return {
    default: () => ({
      databaseUrl: dbUrl,
      isProduction: false,
      authIssuerUrl: "https://test-domain.auth0.com/",
      authAudience: "test-audience",
      auth0Token: "mock-auth0-management-token",
      auth0Domain: "test-domain.auth0.com",
    }),
  };
});

// Mock the auth module to bypass JWT verification
vi.mock("@/lib/auth", async () => {
  const { createMockAuthMiddleware } = await import("./helpers/auth.js");
  return {
    authMiddleware: vi.fn(() => createMockAuthMiddleware()),
    setupBearerAuth: vi.fn((app: any) => {
      // Mock implementation that doesn't actually set up bearer auth
      return app;
    }),
  };
});

// Import schema after mocks are set up
let schema: any;

beforeAll(async () => {
  // Import schema dynamically
  schema = await import("@/lib/db/schema");
  
  // Initialize database connection and run migrations
  testDbInstance = drizzle({
    connection: {
      url: process.platform === "win32" 
        ? `file:///${currentTestDb.replace(/\\/g, "/")}`
        : `file:${currentTestDb}`,
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
  // Delete in order to respect foreign key constraints
  await testDbInstance.delete(schema.activitiesTable);
  await testDbInstance.delete(schema.commentsTable);
  await testDbInstance.delete(schema.attachmentsTable);
  await testDbInstance.delete(schema.cardLabelsTable);
  await testDbInstance.delete(schema.cardMembersTable);
  await testDbInstance.delete(schema.checklistItemMembersTable);
  await testDbInstance.delete(schema.checklistItemsTable);
  await testDbInstance.delete(schema.cardsTable);
  await testDbInstance.delete(schema.listsTable);
  await testDbInstance.delete(schema.labelsTable);
  await testDbInstance.delete(schema.boardMembersTable);
  await testDbInstance.delete(schema.boardsTable);
});

afterAll(async () => {
  // Cleanup: remove this test run's database
  try {
    if (fs.existsSync(currentTestDb)) {
      fs.unlinkSync(currentTestDb);
    }
    // Optionally clean up old test databases (older than 1 hour)
    if (fs.existsSync(TEST_DB_DIR)) {
      const files = fs.readdirSync(TEST_DB_DIR);
      const oneHourAgo = Date.now() - 3600000;
      for (const file of files) {
        if (file.startsWith("test-") && file.endsWith(".db")) {
          const filePath = path.join(TEST_DB_DIR, file);
          const stats = fs.statSync(filePath);
          if (stats.mtimeMs < oneHourAgo) {
            fs.unlinkSync(filePath);
          }
        }
      }
    }
  } catch (e) {
    // Ignore errors during cleanup
  }
});

export { testDbInstance };
