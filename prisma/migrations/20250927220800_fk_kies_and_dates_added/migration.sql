/*
  Warnings:

  - You are about to drop the column `activityTypeId` on the `activity_logs` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `activity_logs` table. All the data in the column will be lost.
  - You are about to drop the column `documentTypeId` on the `document_categories` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `document_clients` table. All the data in the column will be lost.
  - You are about to drop the column `documentId` on the `document_field_values` table. All the data in the column will be lost.
  - You are about to drop the column `fieldId` on the `document_field_values` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `document_statuses` table. All the data in the column will be lost.
  - You are about to drop the column `categoryId` on the `document_templates` table. All the data in the column will be lost.
  - You are about to drop the column `documentTypeId` on the `document_templates` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `fileFormatId` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `statusId` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `field_types` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `file_formats` table. All the data in the column will be lost.
  - You are about to drop the column `documentId` on the `print_history` table. All the data in the column will be lost.
  - You are about to drop the column `printedById` on the `print_history` table. All the data in the column will be lost.
  - You are about to drop the column `printerId` on the `print_history` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `template_fields` table. All the data in the column will be lost.
  - You are about to drop the column `fieldTypeId` on the `template_fields` table. All the data in the column will be lost.
  - You are about to drop the column `roleId` on the `user_roles` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `user_roles` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name,document_type_id_fk]` on the table `document_categories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[documentId,user_id_fk]` on the table `document_clients` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[document_id_fk,template_field_id_fk]` on the table `document_field_values` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id_fk,role_id_fk]` on the table `user_roles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `activity_type_id_fk` to the `activity_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id_fk` to the `activity_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `document_type_id_fk` to the `document_categories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id_fk` to the `document_clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `document_id_fk` to the `document_field_values` table without a default value. This is not possible if the table is not empty.
  - Added the required column `template_field_id_fk` to the `document_field_values` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `document_statuses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category_id_fk` to the `document_templates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `document_type_id_fk` to the `document_templates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `file_format_id_fk` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status_id_fk` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id_fk` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `field_types` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `file_formats` table without a default value. This is not possible if the table is not empty.
  - Added the required column `document_id_fk` to the `print_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `printer_id_fk` to the `print_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id_fk` to the `print_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `field_type_id_fk` to the `template_fields` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `template_fields` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role_id_fk` to the `user_roles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id_fk` to the `user_roles` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."activity_logs" DROP CONSTRAINT "activity_logs_activityTypeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."activity_logs" DROP CONSTRAINT "activity_logs_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."document_categories" DROP CONSTRAINT "document_categories_documentTypeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."document_clients" DROP CONSTRAINT "document_clients_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."document_field_values" DROP CONSTRAINT "document_field_values_documentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."document_field_values" DROP CONSTRAINT "document_field_values_fieldId_fkey";

-- DropForeignKey
ALTER TABLE "public"."document_templates" DROP CONSTRAINT "document_templates_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."document_templates" DROP CONSTRAINT "document_templates_documentTypeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."documents" DROP CONSTRAINT "documents_createdById_fkey";

-- DropForeignKey
ALTER TABLE "public"."documents" DROP CONSTRAINT "documents_fileFormatId_fkey";

-- DropForeignKey
ALTER TABLE "public"."documents" DROP CONSTRAINT "documents_statusId_fkey";

-- DropForeignKey
ALTER TABLE "public"."print_history" DROP CONSTRAINT "print_history_documentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."print_history" DROP CONSTRAINT "print_history_printedById_fkey";

-- DropForeignKey
ALTER TABLE "public"."print_history" DROP CONSTRAINT "print_history_printerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."template_fields" DROP CONSTRAINT "template_fields_fieldTypeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_roles" DROP CONSTRAINT "user_roles_roleId_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_roles" DROP CONSTRAINT "user_roles_userId_fkey";

-- DropIndex
DROP INDEX "public"."document_categories_name_documentTypeId_key";

-- DropIndex
DROP INDEX "public"."document_clients_documentId_userId_key";

-- DropIndex
DROP INDEX "public"."document_field_values_documentId_fieldId_key";

-- DropIndex
DROP INDEX "public"."user_roles_userId_roleId_key";

-- AlterTable
ALTER TABLE "public"."activity_logs" DROP COLUMN "activityTypeId",
DROP COLUMN "userId",
ADD COLUMN     "activity_type_id_fk" INTEGER NOT NULL,
ADD COLUMN     "user_id_fk" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."document_categories" DROP COLUMN "documentTypeId",
ADD COLUMN     "document_type_id_fk" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."document_clients" DROP COLUMN "userId",
ADD COLUMN     "user_id_fk" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."document_field_values" DROP COLUMN "documentId",
DROP COLUMN "fieldId",
ADD COLUMN     "document_id_fk" TEXT NOT NULL,
ADD COLUMN     "template_field_id_fk" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."document_statuses" DROP COLUMN "createdAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."document_templates" DROP COLUMN "categoryId",
DROP COLUMN "documentTypeId",
ADD COLUMN     "category_id_fk" INTEGER NOT NULL,
ADD COLUMN     "document_type_id_fk" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."documents" DROP COLUMN "createdById",
DROP COLUMN "fileFormatId",
DROP COLUMN "statusId",
ADD COLUMN     "file_format_id_fk" INTEGER NOT NULL,
ADD COLUMN     "status_id_fk" INTEGER NOT NULL,
ADD COLUMN     "user_id_fk" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."field_types" DROP COLUMN "createdAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."file_formats" DROP COLUMN "createdAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."print_history" DROP COLUMN "documentId",
DROP COLUMN "printedById",
DROP COLUMN "printerId",
ADD COLUMN     "document_id_fk" TEXT NOT NULL,
ADD COLUMN     "printer_id_fk" TEXT NOT NULL,
ADD COLUMN     "user_id_fk" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."template_fields" DROP COLUMN "createdAt",
DROP COLUMN "fieldTypeId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "field_type_id_fk" INTEGER NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."user_roles" DROP COLUMN "roleId",
DROP COLUMN "userId",
ADD COLUMN     "role_id_fk" INTEGER NOT NULL,
ADD COLUMN     "user_id_fk" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "document_categories_name_document_type_id_fk_key" ON "public"."document_categories"("name", "document_type_id_fk");

-- CreateIndex
CREATE UNIQUE INDEX "document_clients_documentId_user_id_fk_key" ON "public"."document_clients"("documentId", "user_id_fk");

-- CreateIndex
CREATE UNIQUE INDEX "document_field_values_document_id_fk_template_field_id_fk_key" ON "public"."document_field_values"("document_id_fk", "template_field_id_fk");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_fk_role_id_fk_key" ON "public"."user_roles"("user_id_fk", "role_id_fk");

-- AddForeignKey
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_user_id_fk_fkey" FOREIGN KEY ("user_id_fk") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_role_id_fk_fkey" FOREIGN KEY ("role_id_fk") REFERENCES "public"."roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."document_categories" ADD CONSTRAINT "document_categories_document_type_id_fk_fkey" FOREIGN KEY ("document_type_id_fk") REFERENCES "public"."document_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."document_templates" ADD CONSTRAINT "document_templates_document_type_id_fk_fkey" FOREIGN KEY ("document_type_id_fk") REFERENCES "public"."document_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."document_templates" ADD CONSTRAINT "document_templates_category_id_fk_fkey" FOREIGN KEY ("category_id_fk") REFERENCES "public"."document_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."template_fields" ADD CONSTRAINT "template_fields_field_type_id_fk_fkey" FOREIGN KEY ("field_type_id_fk") REFERENCES "public"."field_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_user_id_fk_fkey" FOREIGN KEY ("user_id_fk") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_status_id_fk_fkey" FOREIGN KEY ("status_id_fk") REFERENCES "public"."document_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_file_format_id_fk_fkey" FOREIGN KEY ("file_format_id_fk") REFERENCES "public"."file_formats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."document_clients" ADD CONSTRAINT "document_clients_user_id_fk_fkey" FOREIGN KEY ("user_id_fk") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."document_field_values" ADD CONSTRAINT "document_field_values_document_id_fk_fkey" FOREIGN KEY ("document_id_fk") REFERENCES "public"."documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."document_field_values" ADD CONSTRAINT "document_field_values_template_field_id_fk_fkey" FOREIGN KEY ("template_field_id_fk") REFERENCES "public"."template_fields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."print_history" ADD CONSTRAINT "print_history_document_id_fk_fkey" FOREIGN KEY ("document_id_fk") REFERENCES "public"."documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."print_history" ADD CONSTRAINT "print_history_user_id_fk_fkey" FOREIGN KEY ("user_id_fk") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."print_history" ADD CONSTRAINT "print_history_printer_id_fk_fkey" FOREIGN KEY ("printer_id_fk") REFERENCES "public"."printers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_logs" ADD CONSTRAINT "activity_logs_user_id_fk_fkey" FOREIGN KEY ("user_id_fk") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_logs" ADD CONSTRAINT "activity_logs_activity_type_id_fk_fkey" FOREIGN KEY ("activity_type_id_fk") REFERENCES "public"."activity_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
