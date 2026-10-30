-- Better Auth 1.7 resolves credential accounts by the owning user ID.
-- Remove an obsolete email-keyed duplicate if a canonical record already exists.
DELETE FROM "accounts" AS obsolete
USING "accounts" AS canonical
WHERE obsolete."provider_id" = 'credential'
  AND canonical."provider_id" = 'credential'
  AND obsolete."user_id_fk" = canonical."user_id_fk"
  AND canonical."account_id" = canonical."user_id_fk"
  AND obsolete."id" <> canonical."id";

UPDATE "accounts"
SET "account_id" = "user_id_fk"
WHERE "provider_id" = 'credential'
  AND "account_id" <> "user_id_fk";
