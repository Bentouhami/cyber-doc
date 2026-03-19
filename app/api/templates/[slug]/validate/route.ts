import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { ensureAdminUser } from "@/lib/admin-auth";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

function extractPlaceholders(html: string) {
  const matches = html.matchAll(/{{\s*([\w.]+)\s*}}/g);
  const values = new Set<string>();
  for (const match of matches) {
    if (match[1]) values.add(match[1]);
  }
  return [...values];
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const adminCheck = await ensureAdminUser(request.headers);
  if ("error" in adminCheck) {
    return adminCheck.error;
  }

  const { slug } = await params;

  const template = await prisma.documentTemplate.findUnique({
    where: { slug },
    select: {
      content: true,
      fields: {
        select: {
          fieldName: true,
          fieldLabel: true,
          fieldLabelAr: true,
          isRequired: true,
        },
      },
    },
  });

  if (!template) {
    return NextResponse.json({ message: "Template not found" }, { status: 404 });
  }

  if (!template.content) {
    return NextResponse.json(
      {
        ok: false,
        message: "HTML template is required",
        missingRequired: [],
        unusedFields: [],
        unknownPlaceholders: [],
      },
      { status: 200 },
    );
  }

  const placeholders = extractPlaceholders(template.content);
  const fieldMap = new Map<string, { label: string; required: boolean }>();
  for (const field of template.fields) {
    fieldMap.set(field.fieldName, {
      label: field.fieldLabelAr || field.fieldLabel,
      required: field.isRequired,
    });
  }

  const missingRequired = template.fields
    .filter((field) => field.isRequired && !placeholders.includes(field.fieldName))
    .map((field) => ({
      fieldName: field.fieldName,
      label: field.fieldLabelAr || field.fieldLabel,
    }));

  const unusedFields = template.fields
    .filter((field) => !placeholders.includes(field.fieldName))
    .map((field) => ({
      fieldName: field.fieldName,
      label: field.fieldLabelAr || field.fieldLabel,
      required: field.isRequired,
    }));

  const unknownPlaceholders = placeholders
    .filter((placeholder) => !fieldMap.has(placeholder))
    .map((placeholder) => ({
      fieldName: placeholder,
    }));

  return NextResponse.json({
    ok: missingRequired.length === 0,
    placeholders,
    missingRequired,
    unusedFields,
    unknownPlaceholders,
  });
}
