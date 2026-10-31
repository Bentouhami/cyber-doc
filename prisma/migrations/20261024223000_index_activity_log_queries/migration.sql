-- Index the stable activity-log ordering and each exact-match filter exposed by
-- GET /api/activity-logs. The trailing id preserves deterministic pagination
-- when multiple rows share the same millisecond timestamp.
CREATE INDEX "activity_logs_created_id_idx"
ON "public"."activity_logs"("created_at" DESC, "id" DESC);

CREATE INDEX "activity_logs_user_created_id_idx"
ON "public"."activity_logs"("user_id_fk", "created_at" DESC, "id" DESC);

CREATE INDEX "activity_logs_type_created_id_idx"
ON "public"."activity_logs"("activity_type_id_fk", "created_at" DESC, "id" DESC);

CREATE INDEX "activity_logs_resource_created_id_idx"
ON "public"."activity_logs"("resourceType", "created_at" DESC, "id" DESC);
