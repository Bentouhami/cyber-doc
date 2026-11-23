"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Printer, Wallet } from "lucide-react";

import { useLocale } from "@/hooks/use-locale";
import { useUserProfile } from "@/components/providers/user-profile-provider";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export type DocumentDetailData = {
  id: string;
  templateTitle: string;
  templateSlug: string;
  templateHasHtml: boolean;
  templateCategory?: string | null;
  statusName: string;
  statusColor?: string | null;
  createdAt: string;
  createdByName: string;
  fileName?: string | null;
  filePath?: string | null;
  chargedTotal?: string | null;
  unitPrice?: string | null;
  amountPaid?: string | null;
  changeGiven?: string | null;
  currency: string;
  totalCopies: number;
  paymentStatus?: string | null;
  paidAt?: string | null;
  fieldValues: {
    id: string;
    label: string;
    labelAr?: string | null;
    value: string;
  }[];
  participants: {
    id: string;
    roleKey: string;
    roleLabel?: string | null;
    roleLabelAr?: string | null;
    fullName?: string | null;
    fullNameAr?: string | null;
    nationalId?: string | null;
  }[];
};

type DocumentDetailProps = {
  document: DocumentDetailData;
};

export function DocumentDetail({ document }: DocumentDetailProps) {
  const { t, dir } = useLocale();
  const { user } = useUserProfile();
  const { toast } = useToast();

  const isCashier = useMemo(
    () =>
      user?.roles?.some(
        (role) => role.name === "employee" || role.name === "admin",
      ),
    [user?.roles],
  );

  const [paymentStatus, setPaymentStatus] = useState(
    document.paymentStatus ?? "UNPAID",
  );
  const [unitPrice, setUnitPrice] = useState(
    document.unitPrice ?? document.chargedTotal ?? "",
  );
  const [amountPaid, setAmountPaid] = useState(document.amountPaid ?? "");
  const [changeGiven, setChangeGiven] = useState(document.changeGiven ?? "");
  const [chargedTotal, setChargedTotal] = useState(
    document.chargedTotal ?? "",
  );
  const [copies, setCopies] = useState(
    String(Math.max(1, document.totalCopies)),
  );
  const [isPaying, setIsPaying] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const canRenderPdf = document.templateHasHtml;
  const uiLocale = dir === "rtl" ? "ar-MA" : "fr-FR";

  const updateAmountPaid = (value: string) => {
    setAmountPaid(value);
    const charged = chargedTotal ? Number(chargedTotal) : 0;
    const paid = value ? Number(value) : 0;
    setPaymentStatus(
      paid >= charged && charged > 0 ? "PAID" : paid > 0 ? "PARTIAL" : "UNPAID",
    );
  };

  const statusStyle = document.statusColor
    ? { borderColor: document.statusColor }
    : undefined;

  const handlePayment = async () => {
    setIsPaying(true);
    try {
      const response = await fetch(`/api/documents/${document.id}/payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unitPrice: unitPrice === "" ? undefined : Number(unitPrice),
          amountPaid: amountPaid === "" ? undefined : Number(amountPaid),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Payment update failed");
      }

      const data = await response.json();
      if (data && typeof data === "object") {
        if (
          "chargedTotal" in data &&
          data.chargedTotal !== null &&
          data.chargedTotal !== undefined
        ) {
          setChargedTotal(String(data.chargedTotal));
        }
        if (
          "amountPaid" in data &&
          data.amountPaid !== null &&
          data.amountPaid !== undefined
        ) {
          setAmountPaid(String(data.amountPaid));
        }
        if (
          "changeGiven" in data &&
          data.changeGiven !== null &&
          data.changeGiven !== undefined
        ) {
          setChangeGiven(String(data.changeGiven));
        }
        if (
          "paymentStatus" in data &&
          typeof data.paymentStatus === "string"
        ) {
          setPaymentStatus(data.paymentStatus);
        }
      }
      toast({ title: t("documents.detail.paymentSaved") });
    } catch (error) {
      toast({
        title: t("documents.detail.paymentError"),
        description:
          error instanceof Error ? error.message : "Payment update failed",
        variant: "destructive",
      });
    } finally {
      setIsPaying(false);
    }
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const response = await fetch(`/api/documents/${document.id}/print`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          copies: copies ? Number(copies) : 1,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Print failed");
      }

      toast({ title: t("documents.detail.printQueued") });
    } catch (error) {
      toast({
        title: t("documents.detail.printError"),
        description: error instanceof Error ? error.message : "Print failed",
        variant: "destructive",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="space-y-6" dir={dir}>
      <Card>
        <CardHeader className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-2xl">
                {document.templateTitle}
              </CardTitle>
              <CardDescription>
                {document.templateCategory ??
                  t("documents.detail.uncategorized")}
              </CardDescription>
            </div>
            <Badge variant="outline" style={statusStyle}>
              {document.statusName}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            {t("documents.detail.createdAt")}:{" "}
            {new Date(document.createdAt).toLocaleString(uiLocale, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Badge variant="outline">
            {t("documents.detail.createdBy")}: {document.createdByName}
          </Badge>
          <Badge variant="outline">
            {t("documents.detail.amount")}: {document.chargedTotal ?? "—"}{" "}
            {document.currency}
          </Badge>
          <Badge variant="outline">
            {t("documents.detail.copies")}: {document.totalCopies}
          </Badge>
          <Button
            asChild
            variant="outline"
            disabled={!document.filePath || !canRenderPdf}
          >
            <a href={`/api/documents/${document.id}/download`}>
              <Download className="mr-2 h-4 w-4" />
              {t("documents.detail.download")}
            </a>
          </Button>
          <Button
            asChild
            variant="outline"
            disabled={!document.filePath || !canRenderPdf}
          >
            <a
              href={`/documents/${document.id}/print`}
              target="_blank"
              rel="noreferrer"
            >
              <Printer className="mr-2 h-4 w-4" />
              {t("documents.detail.printView")}
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("documents.detail.previewTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {canRenderPdf ? (
            <div className="rounded-md border">
              <iframe
                title="document-preview"
                src={`/api/documents/${document.id}/preview`}
                sandbox=""
                className="h-[680px] w-full"
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("documents.detail.noPreview")}{" "}
              <a
                href={`/admin/templates/${document.templateSlug}`}
                className="text-primary underline"
              >
                {t("documents.detail.updateTemplate")}
              </a>
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("documents.detail.fieldsTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {document.fieldValues.length ? (
            document.fieldValues.map((field) => (
              <div key={field.id} className="rounded-lg border p-3">
                <div className="text-sm font-medium">
                  {field.labelAr || field.label}
                </div>
                <div className="text-sm text-muted-foreground">
                  {field.value || "—"}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("documents.detail.noFields")}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("documents.detail.participantsTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {document.participants.length ? (
            document.participants.map((participant) => (
              <div key={participant.id} className="rounded-lg border p-3">
                <div className="text-sm font-medium">
                  {participant.roleLabelAr ||
                    participant.roleLabel ||
                    participant.roleKey}
                </div>
                <div className="text-sm text-muted-foreground">
                  {participant.fullNameAr || participant.fullName || "—"}
                </div>
                {participant.nationalId ? (
                  <div className="text-xs text-muted-foreground">
                    {participant.nationalId}
                  </div>
                ) : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("documents.detail.noParticipants")}
            </p>
          )}
        </CardContent>
      </Card>

      {isCashier ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                {t("documents.detail.paymentTitle")}
              </CardTitle>
              <CardDescription>
                {t("documents.detail.paymentDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>{t("documents.detail.amount")}</span>
                  <span>
                    {chargedTotal || "—"} {document.currency}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t("documents.detail.amountPaid")}</span>
                  <span>
                    {amountPaid || "—"} {document.currency}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t("documents.detail.changeGiven")}</span>
                  <span>
                    {changeGiven || "—"} {document.currency}
                  </span>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={99_999_999.99}
                  step="0.01"
                  aria-label={t("documents.detail.unitPrice")}
                  value={unitPrice}
                  onChange={(event) => setUnitPrice(event.target.value)}
                  placeholder={t("documents.detail.unitPrice")}
                />
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={99_999_999.99}
                  step="0.01"
                  aria-label={t("documents.detail.amountPaid")}
                  value={amountPaid}
                  onChange={(event) => updateAmountPaid(event.target.value)}
                  placeholder={t("documents.detail.amountPaid")}
                />
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <span>{t("documents.detail.paymentStatus")}</span>
                <Badge variant="secondary">
                  {t(
                    paymentStatus === "PAID"
                      ? "documents.detail.paymentStatusPaid"
                      : paymentStatus === "PARTIAL"
                        ? "documents.detail.paymentStatusPartial"
                        : "documents.detail.paymentStatusUnpaid",
                  )}
                </Badge>
              </div>
              <Button onClick={handlePayment} disabled={isPaying}>
                {isPaying
                  ? t("documents.detail.paymentSaving")
                  : t("documents.detail.paymentAction")}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="h-4 w-4" />
                {t("documents.detail.printTitle")}
              </CardTitle>
              <CardDescription>
                {t("documents.detail.printDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                type="number"
                min={1}
                value={copies}
                onChange={(event) => setCopies(event.target.value)}
                placeholder={t("documents.detail.copies")}
              />
              <Button onClick={handlePrint} disabled={isPrinting}>
                {isPrinting
                  ? t("documents.detail.printing")
                  : t("documents.detail.printAction")}
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            {t("documents.detail.cashierOnly")}
          </CardContent>
        </Card>
      )}

      <Separator />
    </div>
  );
}
