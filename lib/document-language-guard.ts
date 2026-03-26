type ExpectedScript = "arabic" | "latin" | "unknown"
type DetectedScript = "arabic" | "latin" | "mixed" | "none"

export type LanguageIssue = {
  key: string
  label: string
  valuePreview: string
  expectedScript: Exclude<ExpectedScript, "unknown">
  detectedScript: Exclude<DetectedScript, "none">
  category: "LEGAL_OVERRIDE_REQUIRED" | "NON_LEGAL_MISMATCH"
}

type ValidateDocumentLanguageInput = {
  locale: string
  payload: Record<string, unknown>
  fieldLabels?: Record<string, string>
  participants?: Array<{
    roleKey: string
    persona?: Record<string, unknown>
  }>
}

type ValidateDocumentLanguageResult = {
  hardIssues: LanguageIssue[]
  overrideIssues: LanguageIssue[]
}

const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/gu
const LATIN_RE = /[A-Za-zÀ-ÖØ-öø-ÿ]/gu

const IDENTIFIER_KEY_RE =
  /(nationalid|passport|cin|id\b|reference|code|phone|email|vin|plate|registration|serial|zip|postal)/i

const LEGAL_OVERRIDE_KEY_RE =
  /(fullname|name|address|city|country|birthplace|residence|location|employer|occupation|nationality)/i
const VEHICLE_OVERRIDE_KEY_RE =
  /(vehicle|car|marque|model|modele|make|owner|proprietaire|propriétaire|chassis|engine|motor|color|couleur|trim|variant)/i

const PERSONA_OVERRIDE_KEYS = new Set([
  "fullName",
  "fullNameAr",
  "addressLine1",
  "city",
  "birthPlace",
  "country",
  "employer",
  "occupation",
])

const PERSONA_IDENTIFIER_KEYS = new Set(["nationalId", "phone", "email"])

function toExpectedScript(locale: string): ExpectedScript {
  const normalized = locale.toLowerCase()
  if (normalized.startsWith("ar")) return "arabic"
  if (normalized.startsWith("fr")) return "latin"
  return "unknown"
}

function stripNoise(value: string) {
  return value.replace(/[\d\s\p{P}\p{S}_]+/gu, "")
}

function detectScript(value: string): DetectedScript {
  const normalized = stripNoise(value)
  if (!normalized) return "none"

  const arabicMatches = normalized.match(ARABIC_RE)?.length ?? 0
  const latinMatches = normalized.match(LATIN_RE)?.length ?? 0

  if (arabicMatches > 0 && latinMatches > 0) return "mixed"
  if (arabicMatches > 0) return "arabic"
  if (latinMatches > 0) return "latin"
  return "none"
}

function toPreview(value: string) {
  const trimmed = value.trim()
  if (trimmed.length <= 80) return trimmed
  return `${trimmed.slice(0, 77)}...`
}

function extractValues(rawValue: unknown): string[] {
  if (rawValue === null || rawValue === undefined) return []
  if (Array.isArray(rawValue)) {
    return rawValue
      .map((item) => (item === null || item === undefined ? "" : String(item)))
      .filter((item) => item.trim().length > 0)
  }
  if (typeof rawValue === "object") {
    return [JSON.stringify(rawValue)]
  }
  const value = String(rawValue)
  return value.trim() ? [value] : []
}

function shouldSkipAsIdentifier(key: string) {
  return IDENTIFIER_KEY_RE.test(key)
}

function isOverrideEligibleKey(key: string) {
  return LEGAL_OVERRIDE_KEY_RE.test(key) || VEHICLE_OVERRIDE_KEY_RE.test(key)
}

function addIssue(
  issues: ValidateDocumentLanguageResult,
  issue: LanguageIssue,
  isOverride: boolean,
) {
  if (isOverride) {
    issues.overrideIssues.push(issue)
  } else {
    issues.hardIssues.push(issue)
  }
}

export function validateDocumentLanguage(
  input: ValidateDocumentLanguageInput,
): ValidateDocumentLanguageResult {
  const expectedScript = toExpectedScript(input.locale)
  const result: ValidateDocumentLanguageResult = { hardIssues: [], overrideIssues: [] }

  if (expectedScript === "unknown") {
    return result
  }

  const addFromValue = (params: {
    key: string
    label: string
    rawValue: unknown
    isOverrideEligible: boolean
    skipAsIdentifier?: boolean
  }) => {
    if (params.skipAsIdentifier) return
    const values = extractValues(params.rawValue)
    for (const value of values) {
      const detected = detectScript(value)
      if (detected === "none" || detected === expectedScript) continue

      const issue: LanguageIssue = {
        key: params.key,
        label: params.label,
        valuePreview: toPreview(value),
        expectedScript,
        detectedScript: detected,
        category: params.isOverrideEligible
          ? "LEGAL_OVERRIDE_REQUIRED"
          : "NON_LEGAL_MISMATCH",
      }
      addIssue(result, issue, params.isOverrideEligible)
    }
  }

  for (const [fieldName, rawValue] of Object.entries(input.payload)) {
    const label = input.fieldLabels?.[fieldName] ?? fieldName
    addFromValue({
      key: fieldName,
      label,
      rawValue,
      isOverrideEligible: isOverrideEligibleKey(fieldName),
      skipAsIdentifier: shouldSkipAsIdentifier(fieldName),
    })
  }

  for (const participant of input.participants ?? []) {
    if (!participant.persona) continue
    for (const [personaKey, rawValue] of Object.entries(participant.persona)) {
      if (PERSONA_IDENTIFIER_KEYS.has(personaKey)) continue

      const fieldKey = `participants.${participant.roleKey}.${personaKey}`
      addFromValue({
        key: fieldKey,
        label: fieldKey,
        rawValue,
        isOverrideEligible: PERSONA_OVERRIDE_KEYS.has(personaKey),
        skipAsIdentifier: false,
      })
    }
  }

  return result
}
