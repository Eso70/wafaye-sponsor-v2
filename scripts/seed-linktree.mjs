import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
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

const KURDISH_DESCRIPTION = "بۆ پەیوەندی کردن, کلیک لەم لینکانەی خوارەوە بکە";

const OFFICIAL_PAGE = {
  name: "Wafaye Sponsor",
  description: KURDISH_DESCRIPTION,
  profile_image: "/images/Logo.jpg",
  slug: "wafaye-sponsor",
  is_official: true,
  show_footer: true,
  sponsor_name: "Wafaye Sponsor",
  sponsor_phone: "9647506553031",
  links: [
    { platform_id: "whatsapp", value: "9647506553031", default_message: null, sort_order: 0 },
    { platform_id: "telegram", value: "waf_aye", default_message: null, sort_order: 1 },
    { platform_id: "viber", value: "9647506553031", default_message: null, sort_order: 2 },
    { platform_id: "phone", value: "9647506553031", sort_order: 3 },
  ],
};

async function run() {
  const databaseUrl = requireEnv("DATABASE_URL");
  const schemaPath = resolve(__dirname, "../src/database/schema.sql");
  const schemaSql = await readFile(schemaPath, "utf8");

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await client.query("BEGIN");
    await client.query(schemaSql);
    console.log("Schema applied.");

    const NEVER_EXPIRE = "2099-12-31";
    const pageRes = await client.query(
      `INSERT INTO linktree_pages (name, description, profile_image, slug, is_official, expires_at, show_footer, sponsor_name, sponsor_phone)
       VALUES ($1, $2, $3, $4, true, $5, $6, $7, $8)
       RETURNING id`,
      [
        OFFICIAL_PAGE.name,
        OFFICIAL_PAGE.description,
        OFFICIAL_PAGE.profile_image,
        OFFICIAL_PAGE.slug,
        NEVER_EXPIRE,
        OFFICIAL_PAGE.show_footer,
        OFFICIAL_PAGE.sponsor_name,
        OFFICIAL_PAGE.sponsor_phone,
      ]
    );
    const pageId = pageRes.rows[0].id;

    for (const link of OFFICIAL_PAGE.links) {
      await client.query(
        `INSERT INTO linktree_links (page_id, platform_id, value, default_message, sort_order)
         VALUES ($1, $2, $3, $4, $5)`,
        [pageId, link.platform_id, link.value, link.default_message || null, link.sort_order]
      );
    }

    await client.query("COMMIT");
    console.log("Seeded official Wafaye linktree.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
