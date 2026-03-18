export function parseRoleNames(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  const parsed = value
    .map((roleName) => (typeof roleName === "string" ? roleName.trim() : null))
    .filter((roleName): roleName is string => Boolean(roleName));

  if (parsed.length !== value.length) {
    return null;
  }

  return Array.from(new Set(parsed));
}
