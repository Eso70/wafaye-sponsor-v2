import "server-only";

import { Pool } from "pg";

declare global {
  var __dbPool: Pool | undefined;
}

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is missing");
  }
  return url;
}

export const db =
  global.__dbPool ??
  new Pool({
    connectionString: getDatabaseUrl(),
    max: 10,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  });

if (process.env.NODE_ENV !== "production") {
  global.__dbPool = db;
}
