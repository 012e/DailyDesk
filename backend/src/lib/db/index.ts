import { drizzle } from "drizzle-orm/libsql/node";
import getConfig from "@/lib/config";
import * as schema from "./schema";

const config = getConfig();
const db = drizzle({
  connection: {
    url: config.databaseUrl,
  },
  schema,
});

export default db;
