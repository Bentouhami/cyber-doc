import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Roles
  await prisma.role.createMany({
    data: [
      { name: "ADMIN", description: "Gérant" },
      { name: "EMPLOYEE", description: "Employé" },
    ],
    skipDuplicates: true,
  });

  // Document Status
  await prisma.documentStatus.createMany({
    data: [
      { name: "DRAFT", description: "Brouillon", displayOrder: 1 },
      { name: "READY", description: "Prêt", displayOrder: 2 },
      { name: "PRINTED", description: "Imprimé", displayOrder: 3 },
      { name: "ARCHIVED", description: "Archivé", displayOrder: 4 },
    ],
    skipDuplicates: true,
  });

  // File Formats
  await prisma.fileFormat.createMany({
    data: [
      { name: "PDF", extension: ".pdf", mimeType: "application/pdf" },
      {
        name: "DOCX",
        extension: ".docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },
    ],
    skipDuplicates: true,
  });

  // Field types
  await prisma.fieldType.createMany({
    data: [
      { name: "TEXT" },
      { name: "NUMBER" },
      { name: "DATE" },
      { name: "EMAIL" },
      { name: "PHONE" },
      { name: "BOOLEAN" },
      { name: "LONG_TEXT" },
    ],
    skipDuplicates: true,
  });
}

main().finally(() => prisma.$disconnect());
