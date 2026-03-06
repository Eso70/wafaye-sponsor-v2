import "server-only";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const databaseUrl = requireEnv("DATABASE_URL");

try {
  const parsed = new URL(databaseUrl);
  if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
    throw new Error("Invalid protocol");
  }
} catch {
  throw new Error("DATABASE_URL must be a valid PostgreSQL URL");
}

export const env = Object.freeze({
  NODE_ENV: process.env.NODE_ENV ?? "development",
  DATABASE_URL: databaseUrl,
});
