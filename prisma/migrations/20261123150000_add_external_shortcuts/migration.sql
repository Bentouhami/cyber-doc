CREATE TABLE "external_shortcuts" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "title_ar" TEXT NOT NULL,
  "description" TEXT,
  "description_ar" TEXT,
  "url" TEXT NOT NULL,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "external_shortcuts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "external_shortcuts_is_active_display_order_title_idx"
ON "external_shortcuts"("is_active", "display_order", "title");
