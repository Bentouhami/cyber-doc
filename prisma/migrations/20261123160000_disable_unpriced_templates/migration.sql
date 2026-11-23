UPDATE "document_templates"
SET "isActive" = false
WHERE "isActive" = true
  AND (
    "metadata" IS NULL
    OR ("metadata"->'basePrice') IS NULL
    OR jsonb_typeof("metadata"->'basePrice') <> 'number'
    OR ("metadata"->>'basePrice')::numeric < 0
    OR ("metadata"->>'basePrice')::numeric > 99999999.99
    OR ("metadata"->>'basePrice')::numeric * 100 <> trunc(("metadata"->>'basePrice')::numeric * 100)
  );
