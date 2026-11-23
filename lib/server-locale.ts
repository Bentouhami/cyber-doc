import "server-only";

import { cookies } from "next/headers";

import { resolveUiLocale } from "./locale-policy";

export async function getServerLocale() {
  const cookieStore = await cookies();
  return resolveUiLocale(cookieStore.get("cyberdoc_lang")?.value);
}
