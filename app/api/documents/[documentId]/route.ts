import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/admin-auth";
import { hasAnyRole } from "@/lib/permissions";

export const runtime = "nodejs";

const requestSchema = z.object({
  templateId: z.string().optional(),
  slug: z.string().optional(),
  payload: z.record(z.any()).default({}),
  copies: z.number().int().min(1).optional(),
  amountPaid: z.number().optional(),
  participants: z
    .array(
      z.object({
        roleKey: z.string().min(1),
        roleLabel: z.string().optional(),
        personaId: z.string().optional(),
        persona: z
          .object({
            fullName: z.string().optional(),
            fullNameAr: z.string().optional(),
            nationalId: z.string().optional(),
            phone: z.string().optional(),
            email: z.string().optional(),
            birthDate: z.string().datetime().optional(),
            birthPlace: z.string().optional(),
            addressLine1: z.string().optional(),
            city: z.string().optional(),
            gender: z.string().optional(),
            occupation: z.string().optional(),
            employer: z.string().optional(),
            locale: z.string().optional(),
            notes: z.string().optional(),
          })
          .optional(),
      }),
    )
    .optional(),
});

type RouteContext = {
  params: Promise<{ documentId: string }>;
};

type TemplateFieldWithMeta = {
  id: string;
  fieldName: string;
  fieldLabel: string;
  fieldLabelAr: string | null;
  isRequired: boolean;
  allowMultiple: boolean;
};

type NormalizedFieldValue = {
  fieldId: string;
  fieldName: string;
  value: string;
  valueJson?: unknown;
};

function normalizeTemplateValues(fields: TemplateFieldWithMeta[], payload: Record<string, unknown>) {
  const normalized: NormalizedFieldValue[] = [];

  for (const field of fields) {
    const rawValue = payload[field.fieldName];

    if (rawValue === undefined || rawValue === null || rawValue === "") {
      if (field.isRequired) {
        throw new Error(`Missing required field: ${field.fieldLabelAr || field.fieldLabel}`);
      }
      continue;
    }

    if (field.allowMultiple) {
      let values: string[] = [];

      if (Array.isArray(rawValue)) {
        values = rawValue.map((value) => value?.toString?.().trim()).filter(Boolean) as string[];
      } else if (typeof rawValue === "string") {
        values = rawValue
          .split(/\r?\n/)
          .map((value) => value.trim())
          .filter(Boolean);
      } else {
        values = [String(rawValue)];
      }

      if (!values.length) {
        if (field.isRequired) {
          throw new Error(`Missing required field: ${field.fieldLabelAr || field.fieldLabel}`);
        }
        continue;
      }

      normalized.push({
        fieldId: field.id,
        fieldName: field.fieldName,
        value: values.join("\n"),
        valueJson: values,
      });
      continue;
    }

    const stringValue = (() => {
      if (typeof rawValue === "string") return rawValue;
      if (typeof rawValue === "number" || typeof rawValue === "boolean") return rawValue.toString();
      if (rawValue instanceof Date) return rawValue.toISOString();
      try {
        return JSON.stringify(rawValue);
      } catch {
        return String(rawValue);
      }
    })();

    if (!stringValue && field.isRequired) {
      throw new Error(`Missing required field: ${field.fieldLabelAr || field.fieldLabel}`);
    }

    const jsonValue =
      typeof rawValue === "string" || rawValue === null || rawValue === undefined
        ? undefined
        : rawValue;

    normalized.push({
      fieldId: field.id,
      fieldName: field.fieldName,
      value: stringValue,
      valueJson: jsonValue,
    });
  }

  return normalized;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const authResult = await getAuthenticatedUser(request.headers);
  if ("error" in authResult) {
    return authResult.error;
  }
  const { currentUser } = authResult;
  if (!hasAnyRole(currentUser, ["employee", "admin"])) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  let parsedBody: z.infer<typeof requestSchema>;
  try {
    const json = await request.json();
    const result = requestSchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid request payload", issues: result.error.flatten() },
        { status: 400 },
      );
    }
    parsedBody = result.data;
  } catch (error) {
    console.error("Invalid JSON payload:", error);
    return NextResponse.json({ message: "Unable to parse request body" }, { status: 400 });
  }

  const { documentId } = await params;
  const { templateId, slug, payload, participants = [], copies, amountPaid } = parsedBody;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.document.findUnique({
        where: { id: documentId },
        include: { template: true },
      });

      if (!existing) {
        throw new Error("Document not found");
      }

      if (templateId && templateId !== existing.templateId) {
        throw new Error("Template mismatch for document update");
      }

      const template = await tx.documentTemplate.findUnique({
        where: { id: existing.templateId },
        include: {
          fields: {
            select: {
              id: true,
              fieldName: true,
              fieldLabel: true,
              fieldLabelAr: true,
              isRequired: true,
              allowMultiple: true,
            },
            orderBy: { displayOrder: "asc" },
          },
        },
      });

      if (!template || (slug && template.slug !== slug)) {
        throw new Error("Template not found");
      }

      const normalizedValues = normalizeTemplateValues(template.fields, payload);
      const metadata = (template.metadata ?? {}) as Record<string, unknown>;
      const basePrice = typeof metadata.basePrice === "number" ? metadata.basePrice : undefined;
      const unitPrice =
        basePrice ??
        (existing.unitPrice !== null && existing.unitPrice !== undefined
          ? Number(existing.unitPrice)
          : undefined);
      const nextCopies = copies ?? existing.totalCopies ?? 1;
      const chargedTotal = unitPrice ? unitPrice * nextCopies : undefined;
      const amountPaidValue =
        amountPaid ??
        (existing.amountPaid !== null && existing.amountPaid !== undefined
          ? Number(existing.amountPaid)
          : undefined);
      const paymentStatus =
        chargedTotal !== undefined && amountPaidValue !== undefined
          ? amountPaidValue >= chargedTotal
            ? "PAID"
            : amountPaidValue > 0
              ? "PARTIAL"
              : "UNPAID"
          : amountPaidValue
            ? "PARTIAL"
            : undefined;

      const updatedDocument = await tx.document.update({
        where: { id: documentId },
        data: {
          totalCopies: nextCopies,
          standardPrice: basePrice ?? null,
          unitPrice: unitPrice ?? null,
          chargedTotal: chargedTotal ?? null,
          amountPaid: amountPaidValue ?? null,
          paymentStatus,
          paidAt: amountPaidValue ? new Date() : null,
          cashierId: amountPaidValue ? currentUser.id : null,
          fileName: null,
          filePath: null,
        },
      });

      await tx.documentFieldValue.deleteMany({ where: { documentId } });
      if (normalizedValues.length) {
        await tx.documentFieldValue.createMany({
          data: normalizedValues.map((value) => ({
            documentId,
            fieldId: value.fieldId,
            value: value.value,
            ...(value.valueJson !== null && value.valueJson !== undefined
              ? { valueJson: value.valueJson as Prisma.InputJsonValue }
              : {}),
          })),
        });
      }

      await tx.documentParticipant.deleteMany({ where: { documentId } });
      if (participants.length) {
        const participantRows: { documentId: string; personaId: string; roleKey: string; roleLabel?: string | null }[] =
          [];

        for (const participant of participants) {
          if (participant.personaId) {
            const existingPersona = await tx.persona.findUnique({
              where: { id: participant.personaId },
            });
            if (!existingPersona) {
              throw new Error(`Persona not found: ${participant.personaId}`);
            }
            participantRows.push({
              documentId,
              personaId: existingPersona.id,
              roleKey: participant.roleKey,
              roleLabel: participant.roleLabel ?? null,
            });
            continue;
          }

          if (!participant.persona) {
            throw new Error(`Participant persona data is required for role ${participant.roleKey}`);
          }

          const personaData = participant.persona;
          let personaId: string;

          if (personaData.nationalId) {
            const persona = await tx.persona.upsert({
              where: { nationalId: personaData.nationalId },
              update: {
                fullName: personaData.fullName ?? undefined,
                fullNameAr: personaData.fullNameAr ?? undefined,
                phone: personaData.phone ?? undefined,
                email: personaData.email ?? undefined,
                birthDate: personaData.birthDate ? new Date(personaData.birthDate) : undefined,
                birthPlace: personaData.birthPlace ?? undefined,
                addressLine1: personaData.addressLine1 ?? undefined,
                city: personaData.city ?? undefined,
                gender: personaData.gender ?? undefined,
                occupation: personaData.occupation ?? undefined,
                employer: personaData.employer ?? undefined,
                locale: personaData.locale ?? undefined,
                notes: personaData.notes ?? undefined,
              },
              create: {
                nationalId: personaData.nationalId,
                fullName: personaData.fullName ?? null,
                fullNameAr: personaData.fullNameAr ?? null,
                phone: personaData.phone ?? null,
                email: personaData.email ?? null,
                birthDate: personaData.birthDate ? new Date(personaData.birthDate) : null,
                birthPlace: personaData.birthPlace ?? null,
                addressLine1: personaData.addressLine1 ?? null,
                city: personaData.city ?? null,
                gender: personaData.gender ?? null,
                occupation: personaData.occupation ?? null,
                employer: personaData.employer ?? null,
                locale: personaData.locale ?? null,
                notes: personaData.notes ?? null,
                createdById: currentUser.id,
              },
            });
            personaId = persona.id;
          } else {
            const persona = await tx.persona.create({
              data: {
                fullName: personaData.fullName ?? null,
                fullNameAr: personaData.fullNameAr ?? null,
                phone: personaData.phone ?? null,
                email: personaData.email ?? null,
                birthDate: personaData.birthDate ? new Date(personaData.birthDate) : null,
                birthPlace: personaData.birthPlace ?? null,
                addressLine1: personaData.addressLine1 ?? null,
                city: personaData.city ?? null,
                gender: personaData.gender ?? null,
                occupation: personaData.occupation ?? null,
                employer: personaData.employer ?? null,
                locale: personaData.locale ?? null,
                notes: personaData.notes ?? null,
                createdById: currentUser.id,
              },
            });
            personaId = persona.id;
          }

          participantRows.push({
            documentId,
            personaId,
            roleKey: participant.roleKey,
            roleLabel: participant.roleLabel ?? null,
          });
        }

        if (participantRows.length) {
          await tx.documentParticipant.createMany({
            data: participantRows,
            skipDuplicates: true,
          });
        }
      }

      return updatedDocument;
    });

    return NextResponse.json({ documentId: updated.id, message: "Document updated" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Document update failed";
    const status = message === "Document not found" ? 404 : 400;
    return NextResponse.json({ message }, { status });
  }
}
