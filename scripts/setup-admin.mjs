import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes, scryptSync } from "node:crypto";
import pg from "pg";

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function createHash(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}

function resolvePasswordHash() {
  const fromHash = process.env.ADMIN_PASSWORD_HASH;
  if (fromHash) {
    return fromHash;
  }

  const plain = process.env.ADMIN_PASSWORD;
  if (!plain) {
    throw new Error("Set ADMIN_PASSWORD or ADMIN_PASSWORD_HASH");
  }

  return createHash(plain);
}

async function run() {
  const databaseUrl = requireEnv("DATABASE_URL");
  const username = requireEnv("ADMIN_USERNAME").trim().toLowerCase();
  const passwordHash = resolvePasswordHash();

  const schemaPath = resolve(__dirname, "../src/database/schema-admin.sql");
  const schemaSql = await readFile(schemaPath, "utf8");

  let client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();
  } catch (error) {
    if (error?.code !== "3D000") {
      throw error;
    }

    const parsed = new URL(databaseUrl);
    const dbName = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
    const adminUrl = new URL(databaseUrl);
    adminUrl.pathname = "/postgres";

    const adminClient = new Client({ connectionString: adminUrl.toString() });
    await adminClient.connect();
    try {
      const safeDbName = `"${dbName.replace(/"/g, "\"\"")}"`;
      await adminClient.query(`CREATE DATABASE ${safeDbName}`);
    } catch (createError) {
      if (createError?.code !== "42P04") {
        throw createError;
      }
    } finally {
      await adminClient.end();
    }

    client = new Client({ connectionString: databaseUrl });
    await client.connect();
  }

  try {
    await client.query("BEGIN");
    await client.query(schemaSql);
    await client.query(
      `
      INSERT INTO admin_credentials (id, username, password_hash, updated_at)
      VALUES (1, $1, $2, NOW())
      ON CONFLICT (id) DO UPDATE
      SET username = EXCLUDED.username,
          password_hash = EXCLUDED.password_hash,
          updated_at = NOW()
      `,
      [username, passwordHash],
    );
    await client.query("COMMIT");
    console.log("Admin credentials table is ready with exactly one admin row.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
