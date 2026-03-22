import { config as loadEnv } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Keep Prisma CLI/Studio aligned with Next.js dev runtime:
// Next loads `.env.local` first, while dotenv defaults to `.env`.
loadEnv({ path: ".env.local", override: true });
loadEnv();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
