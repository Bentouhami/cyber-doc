INSERT INTO "public"."roles" ("name", "description", "created_at", "updated_at")
VALUES
  ('owner', 'Propriétaire CyberDoc', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('responsible', 'Responsable délégué', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO UPDATE
SET "description" = EXCLUDED."description", "updated_at" = CURRENT_TIMESTAMP;

WITH ranked_admins AS (
  SELECT
    user_roles."user_id_fk",
    ROW_NUMBER() OVER (
      ORDER BY
        (
          users."deletedAt" IS NULL
          AND users."deactivatedAt" IS NULL
          AND users."activatedAt" IS NOT NULL
        ) DESC,
        users."created_at",
        users."id"
    ) AS position
  FROM "public"."user_roles" AS user_roles
  INNER JOIN "public"."roles" AS roles
    ON roles."id" = user_roles."role_id_fk"
  INNER JOIN "public"."users" AS users
    ON users."id" = user_roles."user_id_fk"
  WHERE roles."name" = 'admin'
), replacement_roles AS (
  SELECT "id", "name"
  FROM "public"."roles"
  WHERE "name" IN ('owner', 'responsible')
)
INSERT INTO "public"."user_roles" ("user_id_fk", "role_id_fk")
SELECT
  ranked_admins."user_id_fk",
  replacement_roles."id"
FROM ranked_admins
INNER JOIN replacement_roles
  ON replacement_roles."name" = CASE
    WHEN ranked_admins.position = 1 THEN 'owner'
    ELSE 'responsible'
  END
ON CONFLICT ("user_id_fk", "role_id_fk") DO NOTHING;

DELETE FROM "public"."user_roles"
USING "public"."roles"
WHERE "public"."user_roles"."role_id_fk" = "public"."roles"."id"
  AND "public"."roles"."name" = 'admin';
