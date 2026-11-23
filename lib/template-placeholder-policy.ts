export type TemplateFieldContract = {
  fieldName: string;
  isRequired?: boolean;
};

export function analyzeTemplatePlaceholders(html: string, fields: TemplateFieldContract[]) {
  const placeholders = [
    ...new Set([...html.matchAll(/{{\s*([\w.]+)\s*}}/g)].map((match) => match[1])),
  ];
  const knownFields = new Set(fields.map(({ fieldName }) => fieldName));

  return {
    placeholders,
    missingRequired: fields
      .filter(({ fieldName, isRequired }) => isRequired && !placeholders.includes(fieldName))
      .map(({ fieldName }) => fieldName),
    unknownPlaceholders: placeholders.filter((placeholder) => !knownFields.has(placeholder)),
  };
}

export function analyzeTemplatePublication(
  isActive: boolean,
  html: string | null | undefined,
  fields: TemplateFieldContract[],
) {
  if (!isActive) {
    return { missingContent: false, missingRequired: [], unknownPlaceholders: [] };
  }
  if (!html?.trim()) {
    return { missingContent: true, missingRequired: [], unknownPlaceholders: [] };
  }
  return { missingContent: false, ...analyzeTemplatePlaceholders(html, fields) };
}
