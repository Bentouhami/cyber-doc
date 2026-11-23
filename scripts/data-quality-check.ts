import fs from "node:fs/promises";
import path from "node:path";
import { loadEnvConfig } from "@next/env";

function normalizeText(value: unknown) {
  return (value ?? "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

async function run() {
  loadEnvConfig(process.cwd());
  const { default: prisma } = await import("../lib/prisma");
  const outDir = path.join(process.cwd(), "tmp", "data-quality");
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      personasTotal: 0,
      participantsTotal: 0,
      documentsWithParticipants: 0,
      likelyDuplicatePersonas: 0,
      personasWithoutCoreIdentity: 0,
      orphanParticipantLinks: 0,
    },
    findings: {
      likelyDuplicatePersonas: [] as Array<{
        key: string;
        count: number;
        personas: Array<{
          id: string;
          fullName: string | null;
          fullNameAr: string | null;
          phone: string | null;
          city: string | null;
          email: string | null;
        }>;
      }>,
      personasWithoutCoreIdentity: [] as Array<{
        id: string;
        updatedAt: Date;
      }>,
      orphanParticipantLinks: [] as Array<{
        id: string;
        documentId: string;
        personaId: string;
        roleKey: string;
        roleLabel: string | null;
      }>,
    },
  };

  const [personas, participants, docsWithParticipants] = await Promise.all([
    prisma.persona.findMany({
      select: {
        id: true,
        fullName: true,
        fullNameAr: true,
        nationalId: true,
        phone: true,
        email: true,
        city: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.documentParticipant.findMany({
      select: {
        id: true,
        documentId: true,
        personaId: true,
        roleKey: true,
        roleLabel: true,
      },
    }),
    prisma.document.count({
      where: {
        participants: {
          some: {},
        },
      },
    }),
  ]);

  report.summary.personasTotal = personas.length;
  report.summary.participantsTotal = participants.length;
  report.summary.documentsWithParticipants = docsWithParticipants;

  const personasWithoutCoreIdentity = personas.filter((persona) => {
    const hasCore =
      normalizeText(persona.fullName) ||
      normalizeText(persona.fullNameAr) ||
      normalizeText(persona.nationalId) ||
      normalizeText(persona.phone) ||
      normalizeText(persona.email);
    return !hasCore;
  });
  report.findings.personasWithoutCoreIdentity = personasWithoutCoreIdentity.map((persona) => ({
    id: persona.id,
    updatedAt: persona.updatedAt,
  }));
  report.summary.personasWithoutCoreIdentity = report.findings.personasWithoutCoreIdentity.length;

  const personaById = new Set(personas.map((persona) => persona.id));
  const orphanParticipantLinks = participants.filter(
    (participant) => !personaById.has(participant.personaId),
  );
  report.findings.orphanParticipantLinks = orphanParticipantLinks;
  report.summary.orphanParticipantLinks = orphanParticipantLinks.length;

  const duplicateBuckets = new Map<string, typeof personas>();
  for (const persona of personas) {
    if (normalizeText(persona.nationalId)) continue;
    const key = [
      normalizeText(persona.fullName) || normalizeText(persona.fullNameAr),
      normalizeText(persona.phone),
      normalizeText(persona.city),
    ].join("|");
    if (!key || key === "||") continue;
    const bucket = duplicateBuckets.get(key) ?? [];
    bucket.push(persona);
    duplicateBuckets.set(key, bucket);
  }

  const likelyDuplicatePersonas: typeof report.findings.likelyDuplicatePersonas = [];
  for (const [key, bucket] of duplicateBuckets.entries()) {
    if (bucket.length < 2) continue;
    likelyDuplicatePersonas.push({
      key,
      count: bucket.length,
      personas: bucket.map((persona) => ({
        id: persona.id,
        fullName: persona.fullName,
        fullNameAr: persona.fullNameAr,
        phone: persona.phone,
        city: persona.city,
        email: persona.email,
      })),
    });
  }
  report.findings.likelyDuplicatePersonas = likelyDuplicatePersonas;
  report.summary.likelyDuplicatePersonas = likelyDuplicatePersonas.length;

  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(
    path.join(outDir, "results.json"),
    JSON.stringify(report, null, 2),
    "utf8",
  );

  if (report.summary.orphanParticipantLinks > 0) {
    process.exitCode = 1;
  }

  await prisma.$disconnect();
}

run()
  .catch((error) => {
    console.error("data-quality-check failed:", error);
    process.exitCode = 1;
  });
