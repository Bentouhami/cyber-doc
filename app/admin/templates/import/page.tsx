import { Metadata } from "next"

import { TemplateImportForm } from "@/components/admin/templates/template-import-form"

export const metadata: Metadata = {
  title: "Importer un modèle",
}

export default function TemplateImportPage() {
  return (
    <div className="container mx-auto space-y-6 py-10">
      <TemplateImportForm />
    </div>
  )
}
