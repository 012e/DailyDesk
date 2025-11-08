import * as fs from "fs";
import * as path from "path";
import { isValidUri } from "@/lib/utils";

export type Config = {
  databaseUrl: string;
  isProduction: boolean;
};

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

export default function getConfig(): Config {
  const config: Config = {
    databaseUrl: process.env.DATABASE_URL || "./tmp/pglite-data",
    isProduction: process.env.NODE_ENV === "production",
  };

  if (!isValidUri(config.databaseUrl)) {
    ensureFolderExistsSync(config.databaseUrl); // Ensure the database storage folder exists in development
  }

  return config;
}
