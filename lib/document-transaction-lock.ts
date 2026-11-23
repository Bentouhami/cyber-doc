import { Prisma } from "@prisma/client";

export async function lockDocumentForUpdate(
  tx: Prisma.TransactionClient,
  documentId: string,
) {
  const rows = await tx.$queryRaw<Array<{ id: string }>>(
    Prisma.sql`SELECT "id" FROM "documents" WHERE "id" = ${documentId} FOR UPDATE`,
  );
  return rows.length > 0;
}
