import type { Metadata } from "next"

import { TemplateImportForm } from "@/components/admin/templates/template-import-form"
import { getServerLocale } from "@/lib/server-locale"

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getServerLocale()) === "ar" ? "استيراد قالب" : "Importer un modèle" }
}

export default function TemplateImportPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <TemplateImportForm />
    </div>
  )
}
