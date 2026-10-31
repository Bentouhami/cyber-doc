const DEVELOPMENT_ORIGINS = ["http://localhost:3000", "http://localhost:5000"];

type AuthEnvironment = Partial<Pick<
  NodeJS.ProcessEnv,
  | "NODE_ENV"
  | "BETTER_AUTH_URL"
  | "NEXT_PUBLIC_APP_URL"
  | "NEXTAUTH_URL"
  | "BETTER_AUTH_TRUSTED_ORIGINS"
  | "VERCEL"
  | "VERCEL_URL"
>>;

function isLoopback(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

function parseHttpUrl(value: string, production: boolean) {
  const url = new URL(value);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error("Invalid authentication URL configuration");
  }
  if (production && url.protocol !== "https:" && !isLoopback(url.hostname)) {
    throw new Error("Production authentication URL must use HTTPS");
  }
  return url;
}

function parseExactOrigin(value: string, production: boolean) {
  const url = parseHttpUrl(value, production);
  if (url.pathname !== "/") {
    throw new Error("Trusted origins must not include a path");
  }
  return url.origin;
}

function resolveVercelDeploymentUrl(env: AuthEnvironment, production: boolean) {
  const hostname = env.VERCEL_URL?.trim();
  if (env.VERCEL !== "1" || !hostname) return undefined;
  return parseExactOrigin(`https://${hostname}`, production);
}

export function resolveAuthNetworkConfig(env: AuthEnvironment) {
  const production = env.NODE_ENV === "production";
  const baseURL =
    env.BETTER_AUTH_URL?.trim() ||
    env.NEXT_PUBLIC_APP_URL?.trim() ||
    env.NEXTAUTH_URL?.trim() ||
    resolveVercelDeploymentUrl(env, production) ||
    undefined;

  if (production && !baseURL) {
    throw new Error("A canonical authentication URL is required in production");
  }

  const origins = new Set<string>();
  if (!production) {
    for (const origin of DEVELOPMENT_ORIGINS) origins.add(origin);
  }
  if (baseURL) {
    origins.add(parseHttpUrl(baseURL, production).origin);
  }

  for (const value of env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",") ?? []) {
    const candidate = value.trim();
    if (candidate) origins.add(parseExactOrigin(candidate, production));
  }

  return {
    baseURL,
    trustedOrigins: [...origins],
  };
}
