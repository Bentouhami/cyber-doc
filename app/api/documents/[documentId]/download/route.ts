import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/admin-auth";
import {
  buildNestedPayload,
  generatePdfBufferFromHtml,
  renderHtmlTemplate,
} from "@/services/documentRenderService";
import {
  buildDocumentStoragePath,
  ensureStoragePath,
  resolveStorageRoot,
} from "@/services/documentStorageService";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ documentId: string }>;
};

function isSafeRelativePath(filePath: string) {
  if (filePath.startsWith("/") || filePath.includes(":")) {
    return false;
  }
  if (filePath.includes("..")) {
    return false;
  }
  return true;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const authResult = await getAuthenticatedUser(request.headers);
  if ("error" in authResult) {
    return authResult.error;
  }

  const { documentId } = await params;

  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      fileName: true,
      filePath: true,
      template: {
        select: {
          slug: true,
          content: true,
          metadata: true,
        },
      },
      fieldValues: {
        select: {
          value: true,
          valueJson: true,
          field: {
            select: {
              fieldName: true,
            },
          },
        },
      },
    },
  });

  if (!document) {
    return new NextResponse("Document not found", { status: 404 });
  }

  const url = new URL(request.url);
  const inline = url.searchParams.get("inline") === "1";
  const fileName = document.fileName ?? null;
  const filePath = document.filePath ?? null;
  const extensionSource = (fileName || filePath || "").toLowerCase();
  const isPdf = extensionSource.endsWith(".pdf");

  const hasHtmlTemplate = Boolean(document.template?.content);
  const shouldGeneratePdf = hasHtmlTemplate && (!filePath || !isPdf);

  if (shouldGeneratePdf) {
    try {
      const payload: Record<string, unknown> = {};
      for (const fieldValue of document.fieldValues) {
        payload[fieldValue.field.fieldName] =
          fieldValue.valueJson ?? fieldValue.value ?? "";
      }
      const nestedPayload = buildNestedPayload(payload);
      const html = renderHtmlTemplate(document.template?.content ?? "", nestedPayload);

      const metadata = (document.template?.metadata ?? {}) as Record<string, unknown>;
      const contentCss = typeof metadata.htmlCss === "string" ? metadata.htmlCss : null;
      const pdfOptions = metadata.pdfOptions as Record<string, unknown> | undefined;
      const pdfConfig =
        pdfOptions && typeof pdfOptions === "object"
          ? {
              format: typeof pdfOptions.format === "string" ? pdfOptions.format : undefined,
              margin:
                typeof pdfOptions.margin === "object" && pdfOptions.margin
                  ? {
                      top:
                        typeof (pdfOptions.margin as any).top === "string"
                          ? (pdfOptions.margin as any).top
                          : undefined,
                      right:
                        typeof (pdfOptions.margin as any).right === "string"
                          ? (pdfOptions.margin as any).right
                          : undefined,
                      bottom:
                        typeof (pdfOptions.margin as any).bottom === "string"
                          ? (pdfOptions.margin as any).bottom
                          : undefined,
                      left:
                        typeof (pdfOptions.margin as any).left === "string"
                          ? (pdfOptions.margin as any).left
                          : undefined,
                    }
                  : undefined,
            }
          : undefined;

      const buffer = await generatePdfBufferFromHtml(html, pdfConfig, contentCss);
      const nextFileName = `${document.template?.slug ?? "document"}-${documentId}.pdf`;
      const nextFilePath = buildDocumentStoragePath(nextFileName);
      const outputPath = await ensureStoragePath(nextFilePath);
      await fs.writeFile(outputPath, buffer);

      const pdfFormat = await prisma.fileFormat.findFirst({ where: { name: "PDF" } });
      await prisma.document.update({
        where: { id: documentId },
        data: {
          fileName: nextFileName,
          filePath: nextFilePath,
          fileFormatId: pdfFormat?.id ?? undefined,
        },
      });

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${nextFileName}"`,
        },
      });
    } catch (error) {
      console.error("PDF regeneration failed:", error);
      return new NextResponse("Unable to generate PDF", { status: 500 });
    }
  }

  if (!hasHtmlTemplate && filePath && !isPdf) {
    return new NextResponse("HTML template is required to generate PDF.", { status: 400 });
  }

  if (!filePath) {
    return new NextResponse("File not found", { status: 404 });
  }

  const normalizedPath = filePath.replace(/\\/g, "/");

  if (!isSafeRelativePath(normalizedPath)) {
    return new NextResponse("Invalid file path", { status: 400 });
  }

  try {
    const storageRoot = resolveStorageRoot();
    const absolutePath = path.join(storageRoot, normalizedPath);
    const buffer = await fs.readFile(absolutePath);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": isPdf
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `${isPdf && inline ? "inline" : "attachment"}; filename="${fileName ?? "document.pdf"}"`,
      },
    });
  } catch (error) {
    console.error("Download failed:", error);
    return new NextResponse("File not found", { status: 404 });
  }
}
