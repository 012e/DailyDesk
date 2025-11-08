import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePostgres } from "drizzle-orm/node-postgres";
import getConfig from "@/lib/config";
import { isValidUri } from "@/lib/utils";
const config = getConfig();
let db: ReturnType<typeof drizzlePostgres> | ReturnType<typeof drizzlePglite>;

if (isValidUri(config.databaseUrl)) {
  db = drizzlePostgres(config.databaseUrl);
} else {
  db = drizzlePglite(config.databaseUrl);
}

export default db;

