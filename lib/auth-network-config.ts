import { isIP } from "node:net";

const DEVELOPMENT_ORIGINS = ["http://localhost:3000", "http://localhost:5000"];

type AuthEnvironment = Partial<Pick<
  NodeJS.ProcessEnv,
  | "NODE_ENV"
  | "BETTER_AUTH_SECRET"
  | "BETTER_AUTH_URL"
  | "NEXT_PUBLIC_APP_URL"
  | "NEXTAUTH_URL"
  | "BETTER_AUTH_TRUSTED_ORIGINS"
  | "BETTER_AUTH_TRUSTED_PROXIES"
  | "VERCEL"
  | "VERCEL_URL"
>>;

export function resolveAuthSecret(env: AuthEnvironment) {
  const secret = env.BETTER_AUTH_SECRET?.trim();
  if (env.NODE_ENV === "production" && (!secret || secret.length < 32)) {
    throw new Error("BETTER_AUTH_SECRET must contain at least 32 characters in production");
  }
  return secret;
}

function parseTrustedProxy(value: string) {
  const [address, prefix, extra] = value.split("/");
  const family = isIP(address ?? "");
  if (!family || extra !== undefined) {
    throw new Error("Trusted proxies must be exact IP addresses or CIDR ranges");
  }
  if (prefix === undefined) return address;
  const maxPrefix = family === 4 ? 32 : 128;
  if (!/^\d+$/.test(prefix) || Number(prefix) > maxPrefix) {
    throw new Error("Trusted proxies must be exact IP addresses or CIDR ranges");
  }
  return `${address}/${Number(prefix)}`;
}

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

  const trustedProxies = new Set<string>();
  for (const value of env.BETTER_AUTH_TRUSTED_PROXIES?.split(",") ?? []) {
    const candidate = value.trim();
    if (candidate) trustedProxies.add(parseTrustedProxy(candidate));
  }

  return {
    baseURL,
    trustedOrigins: [...origins],
    trustedProxies: [...trustedProxies],
    ipAddressHeaders:
      env.VERCEL === "1"
        ? ["x-vercel-forwarded-for"]
        : trustedProxies.size
          ? ["x-forwarded-for"]
          : [],
  };
}
