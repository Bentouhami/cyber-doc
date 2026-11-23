import assert from "node:assert/strict";
import test from "node:test";

import {
  analyzeTemplatePlaceholders,
  analyzeTemplatePublication,
} from "../../lib/template-placeholder-policy";

test("template placeholders reject missing required and unknown fields", () => {
  assert.deepEqual(
    analyzeTemplatePlaceholders("<p>{{person.name}} {{unknown.value}} {{person.name}}</p>", [
      { fieldName: "person.name", isRequired: true },
      { fieldName: "document.date", isRequired: true },
    ]),
    {
      placeholders: ["person.name", "unknown.value"],
      missingRequired: ["document.date"],
      unknownPlaceholders: ["unknown.value"],
    },
  );
});

test("template placeholders accept a complete known contract", () => {
  assert.deepEqual(
    analyzeTemplatePlaceholders("<p>{{person.name}}</p>", [
      { fieldName: "person.name", isRequired: true },
      { fieldName: "person.phone" },
    ]),
    {
      placeholders: ["person.name"],
      missingRequired: [],
      unknownPlaceholders: [],
    },
  );
});

test("active templates require renderable content while drafts may stay incomplete", () => {
  assert.deepEqual(analyzeTemplatePublication(true, null, []), {
    missingContent: true,
    missingRequired: [],
    unknownPlaceholders: [],
  });
  assert.deepEqual(analyzeTemplatePublication(false, null, []), {
    missingContent: false,
    missingRequired: [],
    unknownPlaceholders: [],
  });
});
