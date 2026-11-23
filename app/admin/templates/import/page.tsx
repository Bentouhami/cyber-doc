import type { Metadata } from "next"

import { TemplateImportForm } from "@/components/admin/templates/template-import-form"
import { getServerLocale } from "@/lib/server-locale"

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getServerLocale()) === "ar" ? "استيراد قالب" : "Importer un modèle" }
}

export default function TemplateImportPage() {
  return (
    <div className="container mx-auto space-y-6 py-10">
      <TemplateImportForm />
    </div>
  )
}
