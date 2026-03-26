import { Metadata } from "next"

import { TemplateList } from "@/components/admin/templates/template-list"
import { getAdminTemplateListData } from "./_lib/template-list-data"

export const metadata: Metadata = {
  title: "Gestion des modèles",
}

export default async function AdminTemplatesPage() {
  const templates = await getAdminTemplateListData()
  return <TemplateList templates={templates} />
}
