import { defineConfig, Config } from "drizzle-kit";
import getConfig from "@/lib/config";

const config = getConfig();
const drizzleConfig: Config = {
  out: "./drizzle",
  schema: "./src/lib/db/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: config.databaseUrl,
  },
};

export default defineConfig(drizzleConfig);
