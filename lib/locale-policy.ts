export type UiLocale = "ar" | "fr";

export function resolveUiLocale(value: string | undefined): UiLocale {
  return value === "fr" ? "fr" : "ar";
}
