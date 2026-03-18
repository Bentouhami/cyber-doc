/*
  Warnings:

  - A unique constraint covering the columns `[title,document_type_id_fk,category_id_fk]` on the table `document_templates` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "document_templates_title_document_type_id_fk_category_id_fk_key" ON "public"."document_templates"("title", "document_type_id_fk", "category_id_fk");
