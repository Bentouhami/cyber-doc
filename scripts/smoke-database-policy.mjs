const DISPOSABLE_NAME = /(^|[-_])(ci|test|smoke|restore|recovery|preview|staging|dev)([-_]|$)/i;
const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]"]);

/**
 * @param {{ databaseUrl?: string, disposableAcknowledgement?: string, branchName?: string }} target
 */
export function assertDisposableSmokeDatabase({
  databaseUrl,
  disposableAcknowledgement,
  branchName,
}) {
  if (disposableAcknowledgement !== "1") {
    throw new Error(
      "Critical smoke mutates data; set SMOKE_DISPOSABLE_DATABASE=1 only for a disposable target.",
    );
  }

  let target;
  try {
    target = new URL(databaseUrl);
  } catch {
    throw new Error("Critical smoke requires a valid PostgreSQL DATABASE_URL.");
  }
  if (!new Set(["postgres:", "postgresql:"]).has(target.protocol)) {
    throw new Error("Critical smoke requires a PostgreSQL DATABASE_URL.");
  }

  if (LOOPBACK_HOSTS.has(target.hostname)) {
    if (!DISPOSABLE_NAME.test(target.pathname.slice(1))) {
      throw new Error("Local smoke database name must identify a disposable target.");
    }
    return;
  }

  if (!branchName || !DISPOSABLE_NAME.test(branchName)) {
    throw new Error("Remote smoke database branch must identify a disposable target.");
  }
}
