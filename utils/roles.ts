import type { TFunction } from "i18next"

export function translateRoleName(roleName: string, t: TFunction, fallback?: string) {
  const safeName = roleName || fallback || ""
  if (!safeName) {
    return ""
  }

  const key = `roles.labels.${safeName}`
  const result = t(key, { defaultValue: safeName })

  if (typeof result === "string" && result.length) {
    return result
  }

  return safeName
}
