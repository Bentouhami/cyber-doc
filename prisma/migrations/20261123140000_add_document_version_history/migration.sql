ALTER TABLE "documents"
ADD COLUMN "version_group_id" TEXT,
ADD COLUMN "version_number" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "previous_version_id_fk" TEXT,
ADD COLUMN "superseded_at" TIMESTAMP(3);

CREATE UNIQUE INDEX "documents_previous_version_id_fk_key"
ON "documents"("previous_version_id_fk");

CREATE INDEX "documents_version_group_id_version_number_idx"
ON "documents"("version_group_id", "version_number");

CREATE UNIQUE INDEX "documents_version_group_id_version_number_key"
ON "documents"("version_group_id", "version_number");

ALTER TABLE "documents"
ADD CONSTRAINT "documents_previous_version_id_fk_fkey"
FOREIGN KEY ("previous_version_id_fk") REFERENCES "documents"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
