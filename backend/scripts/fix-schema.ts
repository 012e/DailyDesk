import { createClient } from "@libsql/client";
import getConfig from "../src/lib/config.js";

const config = getConfig();

const client = createClient({
  url: config.databaseUrl,
});

async function fixSchema() {
  console.log("🔧 Adding missing columns to cards table...\n");

  const alterStatements = [
    {
      column: "start_date",
      sql: "ALTER TABLE cards ADD COLUMN start_date INTEGER;",
    },
    {
      column: "deadline",
      sql: "ALTER TABLE cards ADD COLUMN deadline INTEGER;",
    },
    {
      column: "latitude",
      sql: "ALTER TABLE cards ADD COLUMN latitude INTEGER;",
    },
    {
      column: "longitude",
      sql: "ALTER TABLE cards ADD COLUMN longitude INTEGER;",
    },
  ];

  for (const { column, sql } of alterStatements) {
    try {
      await client.execute(sql);
      console.log(`✅ Added column: ${column}`);
    } catch (error: any) {
      if (error.message?.includes("duplicate column name")) {
        console.log(`⏭️  Column already exists: ${column}`);
      } else {
        console.error(`❌ Failed to add column ${column}:`, error.message);
      }
    }
  }

  console.log("\n🎉 Schema fix complete!");
  console.log("You can now run 'pnpm update-db' successfully.");
}

fixSchema().catch(console.error);
