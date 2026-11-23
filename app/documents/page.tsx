import type { Metadata } from "next"

import { DocumentsDashboard } from "@/components/documents/documents-dashboard"
import { getServerLocale } from "@/lib/server-locale"

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLocale()
  return lang === "ar"
    ? { title: "الوثائق", description: "قائمة الوثائق التي تم إنشاؤها." }
    : { title: "Documents", description: "Liste des documents générés." }
}

export default function DocumentsPage() {
  return <DocumentsDashboard />
}
