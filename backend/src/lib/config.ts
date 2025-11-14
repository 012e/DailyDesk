import { z } from "zod";
import "dotenv/config";

export const configSchema = z.object({
  databaseUrl: z.url().default("file:./tmp/database"),
  isProduction: z.boolean().default(false),
  authIssuerUrl: z.url().nonempty(), // Required, non-empty URL
  authAudience: z.string().nonempty(),
});

export type Config = z.infer<typeof configSchema>;

export default function getConfig(): Config {
  const rawConfig: Config = {
    databaseUrl: process.env.DATABASE_URL!,
    isProduction: process.env.NODE_ENV === "production",
    authIssuerUrl: "https://" + process.env.AUTH0_DOMAIN! + "/",
    authAudience: process.env.AUTH0_API_AUDIENCE!,
  };

  return configSchema.parse(rawConfig);
}
