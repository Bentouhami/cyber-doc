/*
  Warnings:

  - You are about to drop the column `details` on the `activity_logs` table. All the data in the column will be lost.
  - You are about to drop the column `ipAddress` on the `activity_logs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."activity_logs" DROP COLUMN "details",
DROP COLUMN "ipAddress";

-- AlterTable
ALTER TABLE "public"."documents" ADD COLUMN     "amountPaid" DECIMAL(10,2),
ADD COLUMN     "cashier_id_fk" TEXT,
ADD COLUMN     "changeGiven" DECIMAL(10,2),
ADD COLUMN     "chargedTotal" DECIMAL(10,2),
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'MAD',
ADD COLUMN     "discount" DECIMAL(10,2),
ADD COLUMN     "negotiatedPrice" DECIMAL(10,2),
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentStatus" TEXT,
ADD COLUMN     "standardPrice" DECIMAL(10,2),
ADD COLUMN     "surcharge" DECIMAL(10,2),
ADD COLUMN     "unitPrice" DECIMAL(10,2);

-- CreateIndex
CREATE INDEX "documents_paidAt_cashier_id_fk_idx" ON "public"."documents"("paidAt", "cashier_id_fk");

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_cashier_id_fk_fkey" FOREIGN KEY ("cashier_id_fk") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
