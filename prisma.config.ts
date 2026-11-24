import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

import { resolveDatabaseUrl } from "./lib/database-url";

// Keep Prisma CLI/Studio aligned with Next.js dev runtime:
// Next loads `.env.local` first, while dotenv defaults to `.env`.
loadEnv({ path: ".env.local", override: true });
loadEnv();

// CI may run `prisma generate` without a real DB URL.
// Use a local placeholder to keep schema-based generation working.
const databaseUrl =
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.POSTGRES_URL_NON_POOLING ??
  resolveDatabaseUrl(process.env);

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});
