import type { Metadata } from "next"

import { TemplateList } from "@/components/admin/templates/template-list"
import { getServerLocale } from "@/lib/server-locale"
import { getAdminTemplateListData } from "./_lib/template-list-data"

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getServerLocale()) === "ar" ? "إدارة القوالب" : "Gestion des modèles" }
}

export default async function AdminTemplatesPage() {
  const templates = await getAdminTemplateListData()
  return <TemplateList templates={templates} />
}
