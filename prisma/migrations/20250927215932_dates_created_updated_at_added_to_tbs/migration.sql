/*
  Warnings:

  - You are about to drop the column `createdAt` on the `activity_logs` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `activity_types` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `app_settings` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `app_settings` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `daily_stats` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `daily_stats` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `document_categories` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `document_clients` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `document_field_values` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `document_field_values` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `document_templates` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `document_templates` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `document_types` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `printedAt` on the `print_history` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `printers` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `printers` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `users` table. All the data in the column will be lost.
  - Added the required column `updated_at` to the `activity_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `activity_types` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `app_settings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `daily_stats` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `document_categories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `document_clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `document_field_values` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `document_templates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `document_types` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `print_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `printers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `roles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."activity_logs" DROP COLUMN "createdAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."activity_types" DROP COLUMN "createdAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."app_settings" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."daily_stats" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."document_categories" DROP COLUMN "createdAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."document_clients" DROP COLUMN "createdAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."document_field_values" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."document_templates" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."document_types" DROP COLUMN "createdAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."documents" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."print_history" DROP COLUMN "printedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "printed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."printers" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."roles" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;
