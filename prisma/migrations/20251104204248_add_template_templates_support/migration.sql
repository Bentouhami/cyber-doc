/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `document_templates` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `document_templates` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "document_field_values" ADD COLUMN     "value_json" JSONB;

-- AlterTable
ALTER TABLE "document_templates" ADD COLUMN     "asset_id_fk" TEXT,
ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'ar-MA',
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "content" DROP NOT NULL;

UPDATE "document_templates"
SET "slug" = COALESCE(
  NULLIF(lower(regexp_replace("title", '\\s+', '-', 'g')), ''),
  concat('legacy-', "id")
)
WHERE "slug" IS NULL;

ALTER TABLE "document_templates"
ALTER COLUMN "slug" SET NOT NULL;

-- AlterTable
ALTER TABLE "template_fields" ADD COLUMN     "allow_multiple" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "data_source" TEXT,
ADD COLUMN     "group_field_id_fk" INTEGER,
ADD COLUMN     "help_text" TEXT,
ADD COLUMN     "help_text_ar" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "options" JSONB,
ADD COLUMN     "participant_role_key" TEXT,
ADD COLUMN     "placeholder" TEXT,
ADD COLUMN     "placeholder_ar" TEXT,
ADD COLUMN     "section" TEXT,
ADD COLUMN     "section_ar" TEXT,
ADD COLUMN     "ui_schema" JSONB;

-- CreateTable
CREATE TABLE "template_assets" (
    "id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_type" TEXT NOT NULL DEFAULT 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    "file_size" INTEGER,
    "storage_driver" TEXT,
    "checksum" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploaded_by_id_fk" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_field_groups" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_ar" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_field_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_field_group_assignments" (
    "id" SERIAL NOT NULL,
    "template_id_fk" TEXT NOT NULL,
    "group_id_fk" INTEGER NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_field_group_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_field_group_fields" (
    "id" SERIAL NOT NULL,
    "group_id_fk" INTEGER NOT NULL,
    "field_name" TEXT NOT NULL,
    "field_label" TEXT NOT NULL,
    "field_label_ar" TEXT,
    "field_type_id_fk" INTEGER NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "default_value" TEXT,
    "validation_rules" JSONB,
    "placeholder" TEXT,
    "placeholder_ar" TEXT,
    "help_text" TEXT,
    "help_text_ar" TEXT,
    "data_source" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_field_group_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_participant_roles" (
    "id" SERIAL NOT NULL,
    "template_id_fk" TEXT NOT NULL,
    "role_key" TEXT NOT NULL,
    "role_label" TEXT NOT NULL,
    "role_label_ar" TEXT,
    "description" TEXT,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "min_participants" INTEGER NOT NULL DEFAULT 1,
    "max_participants" INTEGER,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_participant_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personas" (
    "id" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "full_name" TEXT,
    "full_name_ar" TEXT,
    "gender" TEXT,
    "birth_date" TIMESTAMP(3),
    "birth_place" TEXT,
    "national_id" TEXT,
    "passport_number" TEXT,
    "residence_permit_number" TEXT,
    "marital_status" TEXT,
    "occupation" TEXT,
    "employer" TEXT,
    "address_line1" TEXT,
    "address_line2" TEXT,
    "city" TEXT,
    "province" TEXT,
    "postal_code" TEXT,
    "country_code" TEXT DEFAULT 'MA',
    "phone" TEXT,
    "email" TEXT,
    "locale" TEXT,
    "metadata" JSONB,
    "notes" TEXT,
    "created_by_id_fk" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "personas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_participants" (
    "id" TEXT NOT NULL,
    "document_id_fk" TEXT NOT NULL,
    "persona_id_fk" TEXT NOT NULL,
    "role_key" TEXT NOT NULL,
    "role_label" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "template_assets_file_path_version_key" ON "template_assets"("file_path", "version");

-- CreateIndex
CREATE UNIQUE INDEX "template_field_groups_code_key" ON "template_field_groups"("code");

-- CreateIndex
CREATE UNIQUE INDEX "template_field_group_assignments_template_id_fk_group_id_fk_key" ON "template_field_group_assignments"("template_id_fk", "group_id_fk");

-- CreateIndex
CREATE UNIQUE INDEX "template_field_group_fields_group_id_fk_field_name_key" ON "template_field_group_fields"("group_id_fk", "field_name");

-- CreateIndex
CREATE UNIQUE INDEX "template_participant_roles_template_id_fk_role_key_key" ON "template_participant_roles"("template_id_fk", "role_key");

-- CreateIndex
CREATE UNIQUE INDEX "personas_national_id_key" ON "personas"("national_id");

-- CreateIndex
CREATE UNIQUE INDEX "personas_passport_number_key" ON "personas"("passport_number");

-- CreateIndex
CREATE INDEX "personas_last_name_first_name_idx" ON "personas"("last_name", "first_name");

-- CreateIndex
CREATE INDEX "personas_city_idx" ON "personas"("city");

-- CreateIndex
CREATE INDEX "personas_phone_idx" ON "personas"("phone");

-- CreateIndex
CREATE INDEX "personas_created_by_id_fk_idx" ON "personas"("created_by_id_fk");

-- CreateIndex
CREATE UNIQUE INDEX "document_participants_document_id_fk_persona_id_fk_role_key_key" ON "document_participants"("document_id_fk", "persona_id_fk", "role_key");

-- CreateIndex
CREATE UNIQUE INDEX "document_templates_slug_key" ON "document_templates"("slug");

-- CreateIndex
CREATE INDEX "documents_templateId_created_at_idx" ON "documents"("templateId", "created_at");

-- CreateIndex
CREATE INDEX "documents_user_id_fk_idx" ON "documents"("user_id_fk");

-- CreateIndex
CREATE INDEX "template_fields_templateId_displayOrder_idx" ON "template_fields"("templateId", "displayOrder");

-- CreateIndex
CREATE INDEX "template_fields_participant_role_key_idx" ON "template_fields"("participant_role_key");

-- CreateIndex
CREATE INDEX "template_fields_group_field_id_fk_idx" ON "template_fields"("group_field_id_fk");

-- AddForeignKey
ALTER TABLE "document_templates" ADD CONSTRAINT "document_templates_asset_id_fk_fkey" FOREIGN KEY ("asset_id_fk") REFERENCES "template_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_assets" ADD CONSTRAINT "template_assets_uploaded_by_id_fk_fkey" FOREIGN KEY ("uploaded_by_id_fk") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_field_group_assignments" ADD CONSTRAINT "template_field_group_assignments_template_id_fk_fkey" FOREIGN KEY ("template_id_fk") REFERENCES "document_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_field_group_assignments" ADD CONSTRAINT "template_field_group_assignments_group_id_fk_fkey" FOREIGN KEY ("group_id_fk") REFERENCES "template_field_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_field_group_fields" ADD CONSTRAINT "template_field_group_fields_group_id_fk_fkey" FOREIGN KEY ("group_id_fk") REFERENCES "template_field_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_field_group_fields" ADD CONSTRAINT "template_field_group_fields_field_type_id_fk_fkey" FOREIGN KEY ("field_type_id_fk") REFERENCES "field_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_participant_roles" ADD CONSTRAINT "template_participant_roles_template_id_fk_fkey" FOREIGN KEY ("template_id_fk") REFERENCES "document_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_fields" ADD CONSTRAINT "template_fields_group_field_id_fk_fkey" FOREIGN KEY ("group_field_id_fk") REFERENCES "template_field_group_fields"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personas" ADD CONSTRAINT "personas_created_by_id_fk_fkey" FOREIGN KEY ("created_by_id_fk") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_participants" ADD CONSTRAINT "document_participants_document_id_fk_fkey" FOREIGN KEY ("document_id_fk") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_participants" ADD CONSTRAINT "document_participants_persona_id_fk_fkey" FOREIGN KEY ("persona_id_fk") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
