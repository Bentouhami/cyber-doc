import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { ensureAdminUser } from "@/lib/admin-auth";
import { buildNestedPayload, generatePdfBufferFromHtml, renderHtmlTemplate } from "@/services/documentGenerationService";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

function buildMockPayload(fields: { fieldName: string; fieldType: { name: string } }[]) {
  const payload: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.fieldType.name.toUpperCase() === "DATE") {
      payload[field.fieldName] = "2025-01-01";
    } else if (field.fieldType.name.toUpperCase() === "NUMBER") {
      payload[field.fieldName] = "1000";
    } else {
      payload[field.fieldName] = "Sample";
    }
  }
  return payload;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const adminCheck = await ensureAdminUser(request.headers);
  if ("error" in adminCheck) {
    return adminCheck.error;
  }

  const { slug } = await params;
  const template = await prisma.documentTemplate.findUnique({
    where: { slug },
    include: {
      fields: {
        include: { fieldType: true },
      },
    },
  });

  if (!template?.content) {
    return NextResponse.json({ message: "HTML template is missing." }, { status: 400 });
  }

  try {
    const payload = buildMockPayload(template.fields as any[]);
    const html = renderHtmlTemplate(template.content, buildNestedPayload(payload));
    const metadata = (template.metadata ?? {}) as Record<string, unknown>;
    const contentCss = typeof metadata.htmlCss === "string" ? metadata.htmlCss : null;
    const pdfOptions = metadata.pdfOptions as Record<string, unknown> | undefined;
    const pdfConfig = pdfOptions && typeof pdfOptions === "object"
      ? {
          format: typeof pdfOptions.format === "string" ? pdfOptions.format : undefined,
          margin: typeof pdfOptions.margin === "object" && pdfOptions.margin
            ? {
                top: typeof (pdfOptions.margin as any).top === "string" ? (pdfOptions.margin as any).top : undefined,
                right: typeof (pdfOptions.margin as any).right === "string" ? (pdfOptions.margin as any).right : undefined,
                bottom: typeof (pdfOptions.margin as any).bottom === "string" ? (pdfOptions.margin as any).bottom : undefined,
                left: typeof (pdfOptions.margin as any).left === "string" ? (pdfOptions.margin as any).left : undefined,
              }
            : undefined,
        }
      : undefined;
    const buffer = await generatePdfBufferFromHtml(html, pdfConfig, contentCss);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${template.slug}-preview.pdf"`,
      },
    });
  } catch (error) {
    console.error("Render test failed:", error);
    return NextResponse.json({ message: "Render test failed." }, { status: 500 });
  }
}
