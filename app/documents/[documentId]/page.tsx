import type { Metadata } from "next"
import { notFound } from "next/navigation"

import prisma from "@/lib/prisma"
import { DocumentDetail, type DocumentDetailData } from "@/components/documents/document-detail"
import { getServerLocale } from "@/lib/server-locale"

type PageProps = {
  params: Promise<{ documentId: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getServerLocale()) === "ar" ? "الوثيقة" : "Document" }
}

export default async function DocumentDetailPage({ params }: PageProps) {
  const { documentId } = await params
  const prismaAny = prisma as any

  const document = await prismaAny.document.findUnique({
    where: { id: documentId },
    include: {
      template: { include: { category: true } },
      status: true,
      createdBy: true,
      fieldValues: {
        include: {
          field: true,
        },
        orderBy: { createdAt: "asc" },
      },
      participants: {
        include: {
          persona: true,
        },
      },
    },
  })

  if (!document) {
    notFound()
  }

  const versionHistory = document.versionGroupId
    ? await prismaAny.document.findMany({
        where: { versionGroupId: document.versionGroupId },
        orderBy: { versionNumber: "desc" },
        select: {
          id: true,
          versionNumber: true,
          createdAt: true,
          supersededAt: true,
          createdBy: { select: { name: true, email: true } },
        },
      })
    : [document]

  const detail: DocumentDetailData = {
    id: document.id,
    templateTitle: document.template.titleAr || document.template.title,
    templateSlug: document.template.slug,
    templateHasHtml: Boolean(document.template.content),
    templateCategory: document.template.category?.nameAr || document.template.category?.name || null,
    statusName: document.status.nameAr || document.status.name,
    statusColor: document.status.color,
    createdAt: document.createdAt.toISOString(),
    createdByName: document.createdBy.name || document.createdBy.email || "—",
    fileName: document.fileName,
    filePath: document.filePath,
    chargedTotal: document.chargedTotal ? document.chargedTotal.toString() : null,
    unitPrice: document.unitPrice ? document.unitPrice.toString() : null,
    amountPaid: document.amountPaid ? document.amountPaid.toString() : null,
    changeGiven: document.changeGiven ? document.changeGiven.toString() : null,
    currency: document.currency || "MAD",
    totalCopies: document.totalCopies,
    versionNumber: document.versionNumber,
    isCurrentVersion: !document.supersededAt,
    versionHistory: versionHistory.map((version: any) => ({
      id: version.id,
      versionNumber: version.versionNumber,
      createdAt: version.createdAt.toISOString(),
      createdByName: version.createdBy.name || version.createdBy.email || "—",
      isCurrent: !version.supersededAt,
    })),
    paymentStatus: document.paymentStatus,
    paidAt: document.paidAt ? document.paidAt.toISOString() : null,
    fieldValues: document.fieldValues.map((value: any) => ({
      id: value.id,
      label: value.field.fieldLabel,
      labelAr: value.field.fieldLabelAr,
      value: value.value,
    })),
    participants: document.participants.map((participant: any) => ({
      id: participant.id,
      roleKey: participant.roleKey,
      roleLabel: participant.roleLabel,
      roleLabelAr: participant.roleLabelAr,
      fullName: participant.persona?.fullName ?? null,
      fullNameAr: participant.persona?.fullNameAr ?? null,
      nationalId: participant.persona?.nationalId ?? null,
    })),
  }

  return (
    <div className="container mx-auto space-y-6 py-10">
      <DocumentDetail document={detail} />
    </div>
  )
}
