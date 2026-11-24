import assert from "node:assert/strict";
import test from "node:test";

import { resolveDatabaseUrl } from "../../lib/database-url";

test("database URL resolution prefers the app URL and supports Vercel Postgres", () => {
  assert.equal(
    resolveDatabaseUrl({
      DATABASE_URL: "postgresql://example.invalid/app",
      POSTGRES_PRISMA_URL: "postgresql://example.invalid/vercel",
    }),
    "postgresql://example.invalid/app",
  );
  assert.equal(
    resolveDatabaseUrl({ POSTGRES_PRISMA_URL: "postgresql://example.invalid/vercel" }),
    "postgresql://example.invalid/vercel",
  );
});

test("database URL resolution fails closed in production", () => {
  assert.throws(
    () => resolveDatabaseUrl({ NODE_ENV: "production" }),
    /PostgreSQL connection URL is required/,
  );
});
