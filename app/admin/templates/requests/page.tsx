import { Metadata } from "next";

import { TemplateList } from "@/components/admin/templates/template-list";
import { getAdminTemplateListData } from "../_lib/template-list-data";

export const metadata: Metadata = {
  title: "Demandes de modèles",
};

export default async function AdminTemplateRequestsPage() {
  const templates = await getAdminTemplateListData({ pendingOnly: true });
  return <TemplateList templates={templates} />;
}
