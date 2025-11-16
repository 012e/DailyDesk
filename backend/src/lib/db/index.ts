import { drizzle } from "drizzle-orm/libsql/node";
import getConfig from "@/lib/config";

const config = getConfig();
const db = drizzle({
  connection: {
    url: config.databaseUrl,
  },
});

export default db;
