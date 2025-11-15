import { z } from "zod";
import "dotenv/config";
import path from "path";
import * as fs from "fs";

export const configSchema = z.object({
  databaseUrl: z.url().default("file:./tmp/database"),
  isProduction: z.boolean().default(false),
  authIssuerUrl: z.url().nonempty(), // Required, non-empty URL
  authAudience: z.string().nonempty(),
});

/**
 * Ensures that a folder exists synchronously. If the folder does not exist, it is created,
 * including any necessary parent directories.
 *
 * @param relativeFolderPath The path to the folder, relative to the current working directory.
 */
function ensureFolderExistsSync(relativeFolderPath: string): void {
  // Resolve the relative path to an absolute path.
  const absolutePath = path.resolve(relativeFolderPath);

  try {
    // The recursive option ensures that parent directories are created if they don't exist.
    // It also doesn't throw an error if the directory already exists.
    fs.mkdirSync(absolutePath, { recursive: true });
  } catch (error) {
    // Primarily catches permission issues or other non-existence/already-exists related errors.
    throw new Error(
      `Failed to create folder synchronously at path: ${absolutePath}. Error: ${error}`,
    );
  }
}

export type Config = z.infer<typeof configSchema>;

export default function getConfig(): Config {
  ensureFolderExistsSync("tmp");
  const rawConfig: Config = {
    databaseUrl: process.env.DATABASE_URL!,
    isProduction: process.env.NODE_ENV === "production",
    authIssuerUrl: "https://" + process.env.AUTH0_DOMAIN! + "/",
    authAudience: process.env.AUTH0_API_AUDIENCE!,
  };

  return configSchema.parse(rawConfig);
}
