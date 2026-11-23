import type { Metadata } from "next"

import { TemplateCreateForm } from "@/components/admin/templates/template-create-form"
import { getServerLocale } from "@/lib/server-locale"

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getServerLocale()) === "ar" ? "قالب جديد" : "Nouveau modèle" }
}

export default function TemplateCreatePage() {
  return (
    <div className="container mx-auto space-y-6 py-10">
      <TemplateCreateForm />
    </div>
  )
}
