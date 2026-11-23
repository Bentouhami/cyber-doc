ALTER TABLE "public"."users" ADD COLUMN "username" TEXT;

-- Existing accounts receive a stable collision-free identifier. An owner can
-- replace it with a friendly username from employee management after migration.
UPDATE "public"."users"
SET "username" = CASE
  WHEN LENGTH("id") <= 28 THEN 'u_' || LOWER("id")
  ELSE 'u_' || SUBSTRING(MD5("id") FROM 1 FOR 28)
END;

ALTER TABLE "public"."users" ALTER COLUMN "username" SET NOT NULL;

CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");
