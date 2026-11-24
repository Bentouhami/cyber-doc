-- Better Auth 1.7 requires its standard id primary key while keeping key unique.
ALTER TABLE "rate_limits" ADD COLUMN "id" TEXT;

UPDATE "rate_limits"
SET "id" = 'legacy_' || md5("key")
WHERE "id" IS NULL;

ALTER TABLE "rate_limits" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "rate_limits" DROP CONSTRAINT "rate_limits_pkey";
ALTER TABLE "rate_limits" ADD CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("id");
CREATE UNIQUE INDEX "rate_limits_key_key" ON "rate_limits"("key");
