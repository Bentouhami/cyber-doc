export async function areReadinessDependenciesAvailable(
  checks: Array<() => Promise<unknown>>,
) {
  try {
    await Promise.all(checks.map((check) => check()));
    return true;
  } catch {
    return false;
  }
}
