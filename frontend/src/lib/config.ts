export type Config = {
  backendUrl: string;
};

export default function getConfig(): Config {
  return {
    backendUrl: import.meta.env.VITE_BACKEND_URL ?? "http://localhost:3000",
  } satisfies Config;
}
