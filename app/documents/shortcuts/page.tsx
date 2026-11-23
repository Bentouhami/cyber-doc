import type { Metadata } from "next";

import { ExternalShortcuts } from "@/components/shortcuts/external-shortcuts";
import { getServerLocale } from "@/lib/server-locale";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: (await getServerLocale()) === "ar" ? "الروابط | سايبر دوك" : "Raccourcis | CyberDoc",
  };
}

export default function ShortcutsPage() {
  return <ExternalShortcuts />;
}
