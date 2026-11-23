import fs from "node:fs/promises";
import path from "node:path";
import { loadEnvConfig } from "@next/env";

import { catalogPriceSchema } from "../lib/payment-policy";
import { analyzeTemplatePublication } from "../lib/template-placeholder-policy";

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
      ownerAssignments: 0,
      activeOwners: 0,
      activeTemplatesWithoutValidPrice: 0,
      templatesWithoutRenderableSource: 0,
      templatesWithInvalidPlaceholderContract: 0,
      unsafePackagedTemplateAssets: 0,
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
      activeTemplatesWithoutValidPrice: [] as string[],
      templatesWithoutRenderableSource: [] as string[],
      templatesWithInvalidPlaceholderContract: [] as Array<{
        slug: string;
        missingRequired: string[];
        unknownPlaceholders: string[];
      }>,
      unsafePackagedTemplateAssets: [] as Array<{
        slug: string;
        filePath: string;
      }>,
    },
  };

  const [personas, participants, docsWithParticipants, owners, templates] = await Promise.all([
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
    prisma.userRole.findMany({
      where: { role: { name: "owner" } },
      select: {
        user: {
          select: {
            activatedAt: true,
            deactivatedAt: true,
            deletedAt: true,
          },
        },
      },
    }),
    prisma.documentTemplate.findMany({
      select: {
        slug: true,
        isActive: true,
        metadata: true,
        content: true,
        asset: { select: { filePath: true } },
        fields: {
          where: { isActive: true },
          select: { fieldName: true, isRequired: true },
        },
      },
      orderBy: { slug: "asc" },
    }),
  ]);

  report.summary.personasTotal = personas.length;
  report.summary.participantsTotal = participants.length;
  report.summary.documentsWithParticipants = docsWithParticipants;
  report.summary.ownerAssignments = owners.length;
  report.summary.activeOwners = owners.filter(
    ({ user }) => user.activatedAt && !user.deactivatedAt && !user.deletedAt,
  ).length;

  for (const template of templates) {
    const metadata =
      template.metadata && typeof template.metadata === "object" && !Array.isArray(template.metadata)
        ? template.metadata
        : {};
    if (template.isActive && !catalogPriceSchema.safeParse(metadata.basePrice).success) {
      report.findings.activeTemplatesWithoutValidPrice.push(template.slug);
    }
    if (template.isActive && !template.content?.trim()) {
      report.findings.templatesWithoutRenderableSource.push(template.slug);
    }
    if (template.isActive && template.content) {
      const placeholderContract = analyzeTemplatePublication(
        true,
        template.content,
        template.fields,
      );
      if (
        placeholderContract.missingRequired.length ||
        placeholderContract.unknownPlaceholders.length
      ) {
        report.findings.templatesWithInvalidPlaceholderContract.push({
          slug: template.slug,
          missingRequired: placeholderContract.missingRequired,
          unknownPlaceholders: placeholderContract.unknownPlaceholders,
        });
      }
    }
    const assetPath = template.asset?.filePath.replaceAll("\\", "/");
    if (
      assetPath?.startsWith("templates_docs/") &&
      !assetPath.startsWith("templates_docs/sanitized/")
    ) {
      report.findings.unsafePackagedTemplateAssets.push({
        slug: template.slug,
        filePath: assetPath,
      });
    }
  }
  report.summary.activeTemplatesWithoutValidPrice =
    report.findings.activeTemplatesWithoutValidPrice.length;
  report.summary.templatesWithoutRenderableSource =
    report.findings.templatesWithoutRenderableSource.length;
  report.summary.templatesWithInvalidPlaceholderContract =
    report.findings.templatesWithInvalidPlaceholderContract.length;
  report.summary.unsafePackagedTemplateAssets =
    report.findings.unsafePackagedTemplateAssets.length;

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
  console.log("data-quality-check:", JSON.stringify(report.summary));

  if (
    report.summary.orphanParticipantLinks > 0 ||
    report.summary.ownerAssignments !== 1 ||
    report.summary.activeOwners !== 1 ||
    report.summary.activeTemplatesWithoutValidPrice > 0 ||
    report.summary.templatesWithoutRenderableSource > 0 ||
    report.summary.templatesWithInvalidPlaceholderContract > 0 ||
    report.summary.unsafePackagedTemplateAssets > 0
  ) {
    process.exitCode = 1;
  }

  await prisma.$disconnect();
}

run()
  .catch((error) => {
    console.error("data-quality-check failed:", error);
    process.exitCode = 1;
  });
