import { Metadata } from "next"
import { DocumentsDashboard } from "@/components/documents/documents-dashboard"

export const metadata: Metadata = {
  title: "Documents",
  description: "A list of all the generated documents.",
}

export default function DocumentsPage() {
  return <DocumentsDashboard />
}
