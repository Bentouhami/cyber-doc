import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/admin-auth";
import { buildNestedPayload, ensureHtmlDocument, renderHtmlTemplate } from "@/services/documentGenerationService";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ documentId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  const authResult = await getAuthenticatedUser(request.headers);
  if ("error" in authResult) {
    return authResult.error;
  }

  const { documentId } = await params;

  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      template: {
        select: {
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

  if (!document.template?.content) {
    return new NextResponse("HTML template is required to preview.", { status: 400 });
  }

  const payload: Record<string, unknown> = {};
  for (const fieldValue of document.fieldValues) {
    payload[fieldValue.field.fieldName] = fieldValue.valueJson ?? fieldValue.value ?? "";
  }

  const nestedPayload = buildNestedPayload(payload);
  const html = renderHtmlTemplate(document.template.content, nestedPayload);
  const metadata = (document.template.metadata ?? {}) as Record<string, unknown>;
  const contentCss = typeof metadata.htmlCss === "string" ? metadata.htmlCss : null;
  const page = ensureHtmlDocument(html, contentCss);

  return new NextResponse(page, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
