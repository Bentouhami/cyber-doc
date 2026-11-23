import type { PrismaClient } from "@prisma/client";

export type TemplateDuplicateCandidate = {
  id: string;
  slug: string;
  title: string;
  titleAr: string | null;
  locale: string;
  documentTypeName: string;
  categoryName: string;
  assetChecksum: string | null;
  updatedAt: string;
  reasons: string[];
};

export type TemplateDuplicateCheckInput = {
  title: string;
  locale?: string | null;
  documentTypeName: string;
  categoryName: string;
  checksum?: string | null;
  excludeSlug?: string;
};

export async function findTemplateDuplicateCandidates(
  prisma: PrismaClient,
  input: TemplateDuplicateCheckInput,
): Promise<TemplateDuplicateCandidate[]> {
  const title = input.title.trim();
  const locale = input.locale?.trim() || "ar-MA";
  const documentTypeName = input.documentTypeName.trim();
  const categoryName = input.categoryName.trim();

  if (!title || !documentTypeName || !categoryName) {
    return [];
  }

  const templates = await prisma.documentTemplate.findMany({
    where: {
      title: { equals: title, mode: "insensitive" },
      locale,
      documentType: {
        name: { equals: documentTypeName, mode: "insensitive" },
      },
      category: {
        name: { equals: categoryName, mode: "insensitive" },
      },
      ...(input.excludeSlug ? { NOT: { slug: input.excludeSlug } } : {}),
    },
    include: {
      documentType: { select: { name: true } },
      category: { select: { name: true } },
      asset: { select: { checksum: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });

  return templates.map((template) => {
    const reasons = ["same_title_and_context"];
    if (
      input.checksum &&
      template.asset?.checksum &&
      template.asset.checksum === input.checksum
    ) {
      reasons.push("same_asset_checksum");
    }

    return {
      id: template.id,
      slug: template.slug,
      title: template.title,
      titleAr: template.titleAr,
      locale: template.locale,
      documentTypeName: template.documentType.name,
      categoryName: template.category.name,
      assetChecksum: template.asset?.checksum ?? null,
      updatedAt: template.updatedAt.toISOString(),
      reasons,
    };
  });
}
