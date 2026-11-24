type DatabaseEnvironment = Partial<Pick<
  NodeJS.ProcessEnv,
  "NODE_ENV" | "DATABASE_URL" | "POSTGRES_PRISMA_URL" | "POSTGRES_URL"
>>;

const LOCAL_DATABASE_URL =
  "postgresql://postgres:postgres@127.0.0.1:5432/cyber_doc_ci";

export function resolveDatabaseUrl(env: DatabaseEnvironment) {
  const databaseUrl =
    env.DATABASE_URL?.trim() ||
    env.POSTGRES_PRISMA_URL?.trim() ||
    env.POSTGRES_URL?.trim();

  if (databaseUrl) return databaseUrl;
  if (env.NODE_ENV === "production") {
    throw new Error("A PostgreSQL connection URL is required in production");
  }
  return LOCAL_DATABASE_URL;
}
