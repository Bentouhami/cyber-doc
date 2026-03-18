import type { Prisma, PrismaClient } from "@prisma/client";

type DailyStatsIncrement = {
  documentsCreated?: number;
  documentsPrinted?: number;
  totalCopies?: number;
  uniqueClients?: number;
  activeEmployees?: number;
  topDocumentType?: string | null;
  topCategory?: string | null;
};

export async function incrementDailyStats(
  prisma: PrismaClient | Prisma.TransactionClient,
  date: Date,
  increment: DailyStatsIncrement,
) {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);

  return prisma.dailyStats.upsert({
    where: { date: day },
    update: {
      documentsCreated: {
        increment: increment.documentsCreated ?? 0,
      },
      documentsPrinted: {
        increment: increment.documentsPrinted ?? 0,
      },
      totalCopies: {
        increment: increment.totalCopies ?? 0,
      },
      uniqueClients: {
        increment: increment.uniqueClients ?? 0,
      },
      activeEmployees: {
        increment: increment.activeEmployees ?? 0,
      },
      topDocumentType: increment.topDocumentType ?? undefined,
      topCategory: increment.topCategory ?? undefined,
    },
    create: {
      date: day,
      documentsCreated: increment.documentsCreated ?? 0,
      documentsPrinted: increment.documentsPrinted ?? 0,
      totalCopies: increment.totalCopies ?? 0,
      uniqueClients: increment.uniqueClients ?? 0,
      activeEmployees: increment.activeEmployees ?? 0,
      topDocumentType: increment.topDocumentType ?? null,
      topCategory: increment.topCategory ?? null,
    },
  });
}
