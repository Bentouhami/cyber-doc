import { Metadata } from "next"

import { TemplateCreateForm } from "@/components/admin/templates/template-create-form"

export const metadata: Metadata = {
  title: "Nouveau modèle",
}

export default function TemplateCreatePage() {
  return (
    <div className="container mx-auto space-y-6 py-10">
      <TemplateCreateForm />
    </div>
  )
}
