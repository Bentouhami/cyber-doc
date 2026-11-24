import type { Metadata } from "next";

import { TemplateList } from "@/components/admin/templates/template-list";
import { getServerLocale } from "@/lib/server-locale";
import { getAdminTemplateListData } from "../_lib/template-list-data";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getServerLocale()) === "ar" ? "طلبات القوالب" : "Demandes de modèles" };
}

export default async function AdminTemplateRequestsPage() {
  const templates = await getAdminTemplateListData({ pendingOnly: true });
  return <TemplateList templates={templates} mode="requests" />;
}
