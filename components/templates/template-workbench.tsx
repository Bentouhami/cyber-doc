"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

import { useLocale } from "@/hooks/use-locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TemplatePicker } from "@/components/templates/template-picker"
import { TemplateForm, GenerationTemplate } from "@/components/templates/template-form"

type TemplateWorkbenchProps = {
  templates: GenerationTemplate[]
  initialTemplateId?: string
  initialValues?: Record<string, string>
  initialParticipants?: Record<
    string,
    {
      fullName?: string
      nationalId?: string
      phone?: string
      email?: string
      birthDate?: string
      birthPlace?: string
      addressLine1?: string
      city?: string
      gender?: string
      occupation?: string
      employer?: string
    }
  >
  initialPayment?: { copies?: number; amountPaid?: number }
  initialDocumentId?: string
}

export function TemplateWorkbench({
  templates,
  initialTemplateId,
  initialValues,
  initialParticipants,
  initialPayment,
  initialDocumentId,
}: TemplateWorkbenchProps) {
  const { t, dir } = useLocale()
  const [selectedId, setSelectedId] = useState<string | undefined>(initialTemplateId ?? templates[0]?.id)
  const [currentStep, setCurrentStep] = useState(initialDocumentId ? 2 : 1)
  const steps = useMemo(
    () => [
      { id: 1, label: t("templates.steps.selectTemplate") },
      { id: 2, label: t("templates.steps.fillForm") },
    ],
    [t],
  )

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedId) ?? null,
    [templates, selectedId],
  )

  if (!templates.length) {
    return (
      <Card dir={dir}>
        <CardHeader>
          <CardTitle>{t("templates.title")}</CardTitle>
          <CardDescription>{t("templates.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t("templates.noTemplatesAvailable")}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("templates.noTemplatesHint")}{" "}
            <Link href="/admin/templates" className="text-primary underline">
              {t("templates.noTemplatesCta")}
            </Link>
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6" dir={dir}>
      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">{t("templates.steps.title")}</p>
              <p className="text-xs text-muted-foreground">{t("templates.steps.subtitle")}</p>
            </div>
            <div className="flex gap-3">
              {steps.map((step) => {
                const isActive = step.id === currentStep
                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-muted text-muted-foreground"
                    }`}
                  >
                    <span>{`${step.id}.`}</span>
                    <span>{step.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("templates.title")}</CardTitle>
          <CardDescription>{t("templates.formInstructions")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <TemplatePicker
            templates={templates}
            value={selectedId}
            onChange={setSelectedId}
            disabled={Boolean(initialDocumentId)}
          />
          {selectedTemplate ? (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <span className="font-medium">{t("templates.locale")}:</span> {selectedTemplate.locale.toUpperCase()}
              </p>
              <p>
                <span className="font-medium">{t("templates.fieldsCount", { count: selectedTemplate.fields.length })}</span>
              </p>
              <p>
                <span className="font-medium">{t("templates.basePrice")}:</span>{" "}
                {selectedTemplate.basePrice ? selectedTemplate.basePrice : "—"}
              </p>
              {initialDocumentId ? (
                <p className="text-xs text-muted-foreground">{t("templates.editModeHint")}</p>
              ) : null}
            </div>
          ) : null}
        </CardContent>
        <div className="border-t px-6 py-4">
          <div className="flex justify-end">
            <Button
              onClick={() => setCurrentStep(2)}
              disabled={!selectedTemplate || currentStep === 2}
            >
              {t("templates.steps.nextAction")}
            </Button>
          </div>
        </div>
      </Card>

      {selectedTemplate ? (
        currentStep === 2 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{t("templates.steps.fillFormTitle")}</p>
                <p className="text-xs text-muted-foreground">{t("templates.steps.fillFormDescription")}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(1)}
              >
                {t("templates.steps.backAction")}
              </Button>
            </div>
            <TemplateForm
              key={selectedTemplate.id}
              template={selectedTemplate}
              initialValues={selectedTemplate.id === initialTemplateId ? initialValues : undefined}
              initialParticipants={selectedTemplate.id === initialTemplateId ? initialParticipants : undefined}
              initialPayment={selectedTemplate.id === initialTemplateId ? initialPayment : undefined}
              initialDocumentId={selectedTemplate.id === initialTemplateId ? initialDocumentId : undefined}
            />
          </div>
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              {t("templates.steps.readyForDetails")}
            </CardContent>
          </Card>
        )
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {t("templates.selectTemplatePlaceholder")}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
