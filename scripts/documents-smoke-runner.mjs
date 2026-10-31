import fs from "node:fs/promises";
import path from "node:path";
import { request as playwrightRequest } from "playwright";

const baseURL = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000";
const adminEmail = process.env.SMOKE_ADMIN_EMAIL ?? "admin@cybercafe.com";
const adminPassword = process.env.SMOKE_ADMIN_PASSWORD ?? "12345678";
const outDir = path.join(process.cwd(), "tmp", "documents-smoke");

const results = [];
const testArtifacts = {
  documentIds: new Set(),
  personaIds: new Set(),
  printHistoryIds: new Set(),
};

function pushResult(name, ok, details = "") {
  results.push({ name, ok, details });
}

async function requestJson(api, method, routePath, data) {
  const response = await api.fetch(routePath, {
    method,
    headers: data !== undefined ? { "content-type": "application/json" } : undefined,
    data,
  });
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

async function loginAsAdmin(api) {
  const candidates = ["/api/auth/sign-in/email", "/api/auth/sign-in/credential", "/api/auth/sign-in"];

  for (const endpoint of candidates) {
    try {
      const { response } = await requestJson(api, "POST", endpoint, {
        email: adminEmail,
        password: adminPassword,
        rememberMe: true,
      });
      if (!response.ok()) continue;
      const me = await requestJson(api, "GET", "/api/users/me");
      const isPrivileged = me.response.ok() && Array.isArray(me.body?.roles) && me.body.roles.some((role) => role?.name === "admin" || role?.name === "employee");
      if (isPrivileged) {
        pushResult("Auth login", true, `Authenticated via ${endpoint}`);
        return true;
      }
    } catch {
      // try next endpoint
    }
  }

  pushResult("Auth login", false, "Unable to authenticate with seed credentials");
  return false;
}

function inferPersonaKey(fieldName, dataSource) {
  const source = `${fieldName}.${dataSource ?? ""}`.toLowerCase();
  if (source.includes("fullnamear")) return "fullNameAr";
  if (source.includes("fullname")) return "fullName";
  if (source.includes("nationalid") || source.includes("cin")) return "nationalId";
  if (source.includes("phone") || source.includes("tel")) return "phone";
  if (source.includes("email") || source.includes("mail")) return "email";
  if (source.includes("birthdate") || source.includes("dateofbirth")) return "birthDate";
  if (source.includes("birthplace") || source.includes("placeofbirth")) return "birthPlace";
  if (source.includes("addressline1") || source.includes("address")) return "addressLine1";
  if (source.includes("city") || source.includes("ville")) return "city";
  if (source.includes("gender") || source.includes("sexe")) return "gender";
  if (source.includes("occupation") || source.includes("profession")) return "occupation";
  if (source.includes("employer") || source.includes("workplace")) return "employer";
  return null;
}

function detectRoleKey(field, roleKeys) {
  if (field.participantRoleKey && roleKeys.includes(field.participantRoleKey)) {
    return field.participantRoleKey;
  }
  const dataSource = String(field.dataSource ?? "");
  for (const roleKey of roleKeys) {
    if (dataSource.includes(`personas.${roleKey}.`) || field.name.startsWith(`${roleKey}.`)) {
      return roleKey;
    }
  }
  return null;
}

function buildFieldPayload(fields, participantMap, useArabic) {
  const payload = {};
  const roleKeys = Object.keys(participantMap);
  for (const field of fields) {
    const type = String(field.type ?? "TEXT").toUpperCase();
    const roleKey = detectRoleKey(field, roleKeys);
    const personaKey = inferPersonaKey(field.name, field.dataSource);
    const rolePersona = roleKey ? participantMap[roleKey] : null;

    let value;
    if (rolePersona && personaKey && rolePersona[personaKey]) {
      value = rolePersona[personaKey];
    } else if (type === "SELECT" && Array.isArray(field.options) && field.options.length) {
      value = field.options[0];
    } else if (type === "DATE") {
      value = "2026-03-22";
    } else if (type === "NUMBER") {
      value = 1;
    } else if (type === "EMAIL") {
      value = "smoke@cyberdoc.local";
    } else if (type === "PHONE") {
      value = "0611223344";
    } else if (field.allowMultiple) {
      value = useArabic ? ["سطر أول", "سطر ثان"] : ["Ligne 1", "Ligne 2"];
    } else {
      value = useArabic ? "نص اختبار" : "Texte de test";
    }

    if ((value === "" || value === null || value === undefined) && field.isRequired) {
      value = useArabic ? "قيمة" : "Valeur";
    }
    payload[field.name] = value;
  }
  return payload;
}

async function chooseTemplate(api) {
  const list = await requestJson(api, "GET", "/api/templates?active=true&withFields=true&withRoles=true");
  if (!list.response.ok() || !Array.isArray(list.body) || !list.body.length) {
    pushResult("Template list", false, `HTTP ${list.response.status()}`);
    return null;
  }
  pushResult("Template list", true, `Found ${list.body.length} active templates`);

  const ordered = [...list.body].sort((a, b) => {
    const aFr = String(a.locale ?? "").startsWith("fr") ? 1 : 0;
    const bFr = String(b.locale ?? "").startsWith("fr") ? 1 : 0;
    return bFr - aFr;
  });

  for (const candidate of ordered) {
    const detail = await requestJson(api, "GET", `/api/templates/${candidate.slug}`);
    const fields = Array.isArray(detail.body?.fields) ? detail.body.fields : [];
    const roles = Array.isArray(detail.body?.participantRoles) ? detail.body.participantRoles : [];
    const hasContent = typeof detail.body?.contentHtml === "string" && detail.body.contentHtml.trim().length > 0;
    if (detail.response.ok() && hasContent && fields.length > 0 && roles.length > 0) {
      pushResult("Template choose", true, `slug=${candidate.slug} locale=${detail.body.locale} roles=${roles.length} fields=${fields.length}`);
      return detail.body;
    }
  }

  pushResult("Template choose", false, "No active template with content + fields + participant roles");
  return null;
}

function buildParticipantDraft(roleKey, index, unique, useArabic) {
  const n = index + 1;
  const nationalId = `SMK${unique}${n}`;
  const fullName = useArabic ? `عميل اختبار ${n}` : `Client Smoke ${n}`;
  return {
    roleKey,
    roleLabel: roleKey,
    persona: {
      fullName,
      nationalId,
      phone: `0600000${100 + n}`,
      email: `smoke.${unique}.${n}@cyberdoc.local`,
      city: useArabic ? "السعيدية" : "Saidia",
      addressLine1: useArabic ? "العنوان التجريبي" : "Adresse test",
      birthDate: "1990-01-01",
      occupation: useArabic ? "مستخدم" : "Employe",
      employer: useArabic ? "شركة اختبار" : "Societe Test",
    },
  };
}

async function runGenerationGuardChecks(api, template) {
  const missing = await requestJson(api, "POST", "/api/documents/generate", {
    templateId: template.id,
    slug: template.slug,
    locale: template.locale,
    payload: {},
    participants: [],
  });
  const missingBlocked =
    missing.response.status() === 400 &&
    missing.body?.code === "INVALID_PARTICIPANTS" &&
    !missing.body?.document?.id;
  pushResult(
    "Documents required participants guard",
    missingBlocked,
    `HTTP ${missing.response.status()} code=${missing.body?.code ?? "n/a"}`,
  );

  const unknown = await requestJson(api, "POST", "/api/documents/generate", {
    templateId: template.id,
    slug: template.slug,
    locale: template.locale,
    payload: {},
    participants: [{ roleKey: "__unknown_smoke_role__", personaId: "not-used" }],
  });
  const unknownBlocked =
    unknown.response.status() === 400 &&
    unknown.body?.code === "INVALID_PARTICIPANTS" &&
    Array.isArray(unknown.body?.issues) &&
    unknown.body.issues.some((issue) => issue?.code === "PARTICIPANT_ROLE_UNKNOWN");
  pushResult(
    "Documents unknown participant role guard",
    unknownBlocked,
    `HTTP ${unknown.response.status()} code=${unknown.body?.code ?? "n/a"}`,
  );

  const negativePayment = await requestJson(api, "POST", "/api/documents/generate", {
    templateId: template.id,
    slug: template.slug,
    locale: template.locale,
    payload: {},
    amountPaid: -1,
  });
  pushResult(
    "Documents negative initial payment guard",
    negativePayment.response.status() === 400 && negativePayment.body?.code === "INVALID_REQUEST_PAYLOAD",
    `HTTP ${negativePayment.response.status()} code=${negativePayment.body?.code ?? "n/a"}`,
  );
}

async function runNewClientFlow(api, template) {
  const unique = Date.now().toString(36);
  const useArabic = String(template.locale ?? "").startsWith("ar");
  const roles = template.participantRoles;
  const participants = roles.map((role, index) => buildParticipantDraft(role.roleKey, index, unique, useArabic));
  const participantMap = Object.fromEntries(participants.map((p) => [p.roleKey, p.persona]));
  const payload = buildFieldPayload(template.fields, participantMap, useArabic);

  const generate = await requestJson(api, "POST", "/api/documents/generate", {
    templateId: template.id,
    slug: template.slug,
    locale: template.locale,
    payload,
    participants,
    copies: 1,
    amountPaid: 20,
    languageOverrideConfirmed: true,
  });

  if (!generate.response.ok()) {
    pushResult("Documents new-client generate", false, `HTTP ${generate.response.status()} ${JSON.stringify(generate.body)}`);
    return null;
  }

  const persisted = Array.isArray(generate.body?.persistedParticipants) ? generate.body.persistedParticipants : [];
  const hasCreated = persisted.some((item) => item?.action === "created_new");
  if (generate.body?.document?.id) testArtifacts.documentIds.add(generate.body.document.id);
  pushResult("Documents new-client persisted", hasCreated, `persisted=${persisted.length} document=${generate.body?.document?.id ?? "n/a"}`);

  const firstParticipant = participants[0];
  const verifyPersona = await requestJson(api, "GET", `/api/personas?q=${encodeURIComponent(firstParticipant.persona.nationalId)}&limit=5`);
  const foundPersona = verifyPersona.response.ok() && Array.isArray(verifyPersona.body) && verifyPersona.body.find((item) => item?.nationalId === firstParticipant.persona.nationalId);
  if (foundPersona?.id) testArtifacts.personaIds.add(foundPersona.id);
  pushResult("Documents new-client persona searchable", Boolean(foundPersona), foundPersona ? `personaId=${foundPersona.id}` : `HTTP ${verifyPersona.response.status()}`);

  return {
    documentId: generate.body?.document?.id,
    personaId: foundPersona?.id,
  };
}

async function runExistingClientFlow(api, template) {
  const unique = `${Date.now().toString(36)}x`;
  const useArabic = String(template.locale ?? "").startsWith("ar");
  const roles = template.participantRoles;
  const primaryRoleKey = roles.find((role) => role.roleKey === "client")?.roleKey ?? roles[0]?.roleKey;
  if (!primaryRoleKey) {
    pushResult("Documents existing-client setup", false, "No participant role found");
    return;
  }

  const seedNationalId = `SMKEX${unique}`;
  const seedCreate = await requestJson(api, "POST", "/api/personas", {
    fullName: useArabic ? "عميل قديم" : "Client Existant",
    nationalId: seedNationalId,
    phone: "0601234567",
    email: `seed.${unique}@cyberdoc.local`,
    city: useArabic ? "بركان" : "Berkane",
  });
  if (seedCreate.response.status() !== 201 || !seedCreate.body?.id) {
    pushResult("Documents existing-client setup", false, `HTTP ${seedCreate.response.status()}`);
    return;
  }
  const seedPersonaId = seedCreate.body.id;
  testArtifacts.personaIds.add(seedPersonaId);
  pushResult("Documents existing-client setup", true, `personaId=${seedPersonaId}`);

  const participants = roles.map((role, index) => {
    const draft = buildParticipantDraft(role.roleKey, index, unique, useArabic);
    if (role.roleKey === primaryRoleKey) {
      return {
        roleKey: role.roleKey,
        roleLabel: role.roleLabel,
        personaId: seedPersonaId,
        persona: {
          ...draft.persona,
          nationalId: seedNationalId,
          email: `updated.${unique}@cyberdoc.local`,
          city: useArabic ? "وجدة" : "Oujda",
        },
      };
    }
    return {
      roleKey: role.roleKey,
      roleLabel: role.roleLabel,
      persona: draft.persona,
    };
  });

  const participantMap = Object.fromEntries(participants.map((p) => [p.roleKey, p.persona]));
  const payload = buildFieldPayload(template.fields, participantMap, useArabic);

  const primaryParticipant = participants.find((participant) => participant.roleKey === primaryRoleKey);
  const duplicateIdentity = primaryParticipant
    ? await requestJson(api, "POST", "/api/documents/generate", {
        templateId: template.id,
        slug: template.slug,
        locale: template.locale,
        payload,
        participants: [
          ...participants.map((participant) =>
            participant.roleKey === primaryRoleKey
              ? {
                  roleKey: participant.roleKey,
                  roleLabel: participant.roleLabel,
                  personaId: participant.personaId,
                }
              : participant,
          ),
          {
            roleKey: primaryRoleKey,
            roleLabel: primaryParticipant.roleLabel,
            persona: primaryParticipant.persona,
          },
        ],
        copies: 1,
        languageOverrideConfirmed: true,
      })
    : null;
  const duplicateIdentityBlocked =
    duplicateIdentity?.response.status() === 400 &&
    duplicateIdentity.body?.code === "INVALID_PARTICIPANTS" &&
    duplicateIdentity.body?.issues?.some(
      (issue) => issue?.code === "PARTICIPANT_DUPLICATE",
    );
  pushResult(
    "Documents stored-plus-inline duplicate participant guard",
    Boolean(duplicateIdentityBlocked),
    duplicateIdentity
      ? `HTTP ${duplicateIdentity.response.status()} duplicate=${Boolean(duplicateIdentityBlocked)}`
      : "Primary participant unavailable",
  );

  const generate = await requestJson(api, "POST", "/api/documents/generate", {
    templateId: template.id,
    slug: template.slug,
    locale: template.locale,
    payload,
    participants,
    copies: 1,
    amountPaid: 20,
    languageOverrideConfirmed: true,
  });

  if (!generate.response.ok()) {
    pushResult("Documents existing-client generate", false, `HTTP ${generate.response.status()} ${JSON.stringify(generate.body)}`);
    return;
  }

  const persisted = Array.isArray(generate.body?.persistedParticipants) ? generate.body.persistedParticipants : [];
  if (generate.body?.document?.id) testArtifacts.documentIds.add(generate.body.document.id);
  const primaryPersisted = persisted.find((item) => item?.roleKey === primaryRoleKey);
  const actionOk = primaryPersisted?.action === "updated_existing" || primaryPersisted?.action === "linked_existing";
  pushResult("Documents existing-client persisted", Boolean(actionOk), `action=${primaryPersisted?.action ?? "n/a"} document=${generate.body?.document?.id ?? "n/a"}`);

  const verifyPersona = await requestJson(api, "GET", `/api/personas?q=${encodeURIComponent(seedNationalId)}&limit=5`);
  const fetched = verifyPersona.response.ok() && Array.isArray(verifyPersona.body) && verifyPersona.body.find((item) => item?.id === seedPersonaId);
  const emailUpdated = fetched?.email === `updated.${unique}@cyberdoc.local`;
  pushResult("Documents existing-client enrichment", Boolean(emailUpdated), fetched ? `email=${fetched.email}` : `HTTP ${verifyPersona.response.status()}`);

  const history = await requestJson(api, "GET", `/api/personas/${seedPersonaId}/documents?page=1&pageSize=10`);
  const hasHistory = history.response.ok() && Array.isArray(history.body?.data) && history.body.data.length > 0;
  pushResult("Documents existing-client history link", Boolean(hasHistory), hasHistory ? `count=${history.body.data.length}` : `HTTP ${history.response.status()}`);

  return {
    documentId: generate.body?.document?.id,
  };
}

async function runDeliveryChecks(api, documentId) {
  if (!documentId) {
    pushResult("Documents delivery preview", false, "No documentId to test");
    pushResult("Documents delivery download", false, "No documentId to test");
    pushResult("Documents delivery print-view", false, "No documentId to test");
    pushResult("Documents delivery duplicate", false, "No documentId to test");
    pushResult("Documents immutable patch", false, "No documentId to test");
    pushResult("Documents print mutation", false, "No documentId to test");
    return;
  }

  const preview = await api.fetch(`/api/documents/${documentId}/preview`);
  const previewType = preview.headers()["content-type"] ?? "";
  const previewCsp = preview.headers()["content-security-policy"] ?? "";
  const previewOk =
    preview.ok() &&
    previewType.includes("text/html") &&
    previewCsp.includes("default-src 'none'") &&
    previewCsp.includes("script-src 'none'") &&
    previewCsp.includes("frame-ancestors 'self'");
  pushResult(
    "Documents delivery preview",
    previewOk,
    `HTTP ${preview.status()} content-type=${previewType || "n/a"} csp=${previewCsp ? "present" : "missing"}`,
  );

  const download = await api.fetch(`/api/documents/${documentId}/download`);
  const downloadType = download.headers()["content-type"] ?? "";
  const downloadOk = download.ok() && (downloadType.includes("application/pdf") || downloadType.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document"));
  pushResult("Documents delivery download", downloadOk, `HTTP ${download.status()} content-type=${downloadType || "n/a"}`);

  const printPage = await api.fetch(`/documents/${documentId}/print`);
  const printSource = await fs.readFile(
    path.join(process.cwd(), "app", "documents", "[documentId]", "print", "page.tsx"),
    "utf8",
  );
  const hasPrintFrameContract =
    printSource.includes('id="document-print-frame"') &&
    printSource.includes('sandbox="allow-same-origin allow-modals"') &&
    printSource.includes('src={`/api/documents/${documentId}/preview`}');
  pushResult(
    "Documents delivery print-view",
    printPage.ok() && hasPrintFrameContract,
    `HTTP ${printPage.status()} frameContract=${hasPrintFrameContract}`,
  );

  const duplicate = await requestJson(api, "POST", `/api/documents/${documentId}/duplicate`);
  const duplicateId = duplicate.body?.documentId;
  const duplicateOk =
    duplicate.response.ok() &&
    typeof duplicateId === "string" &&
    duplicateId.length > 0 &&
    duplicateId !== documentId;
  if (duplicateOk) testArtifacts.documentIds.add(duplicateId);
  pushResult(
    "Documents delivery duplicate",
    duplicateOk,
    `HTTP ${duplicate.response.status()} distinctIdentity=${duplicateOk}`,
  );

  const immutable = await requestJson(api, "PATCH", `/api/documents/${documentId}`, {});
  const immutableOk =
    immutable.response.status() === 405 &&
    immutable.body?.code === "DOCUMENT_IMMUTABLE";
  pushResult(
    "Documents immutable patch",
    immutableOk,
    `HTTP ${immutable.response.status()} code=${immutable.body?.code ?? "n/a"}`,
  );

  const prints = await Promise.all([
    requestJson(api, "POST", `/api/documents/${documentId}/print`, {
      copies: 1,
      printerName: "CyberDoc smoke A",
    }),
    requestJson(api, "POST", `/api/documents/${documentId}/print`, {
      copies: 1,
      printerName: "CyberDoc smoke B",
    }),
  ]);
  const printOk = prints.every(
    (print) =>
      print.response.ok() &&
      print.body?.documentId === documentId &&
      typeof print.body?.printHistoryId === "string",
  );
  for (const print of prints) {
    if (typeof print.body?.printHistoryId === "string") {
      testArtifacts.printHistoryIds.add(print.body.printHistoryId);
    }
  }
  pushResult(
    "Documents concurrent print mutations",
    printOk,
    `HTTP ${prints.map((print) => print.response.status()).join(",")} histories=${prints.filter((print) => print.body?.printHistoryId).length}`,
  );

  const missingId = `missing-${Date.now().toString(36)}`;
  const missingPreview = await api.fetch(`/api/documents/${missingId}/preview`);
  const missingDuplicate = await requestJson(api, "POST", `/api/documents/${missingId}/duplicate`);
  const missingPrint = await requestJson(api, "POST", `/api/documents/${missingId}/print`, {
    copies: 1,
  });
  const missingOk =
    missingPreview.status() === 404 &&
    missingDuplicate.response.status() === 404 &&
    missingPrint.response.status() === 404;
  pushResult(
    "Documents missing resource",
    missingOk,
    `preview=${missingPreview.status()} duplicate=${missingDuplicate.response.status()} print=${missingPrint.response.status()}`,
  );

  const invalidPrinter = await requestJson(api, "POST", `/api/documents/${documentId}/print`, {
    copies: 1,
    printerId: `missing-${Date.now().toString(36)}`,
  });
  pushResult(
    "Documents inactive or missing printer rejected",
    invalidPrinter.response.status() === 400 && invalidPrinter.body?.code === "INVALID_PRINTER",
    `HTTP ${invalidPrinter.response.status()} code=${invalidPrinter.body?.code ?? "n/a"}`,
  );
}

async function runInvalidPaginationChecks(api) {
  const cases = [
    ["documents page", "/api/documents?page=abc"],
    ["personas limit", "/api/personas?limit=-1"],
    ["persona history pageSize", "/api/personas/not-a-persona/documents?pageSize=zero"],
    ["document creators limit", "/api/document-creators?limit=abc"],
  ];

  for (const [name, routePath] of cases) {
    const result = await requestJson(api, "GET", routePath);
    const rejected = result.response.status() === 400 && result.body?.message === "Invalid query parameter" && Array.isArray(result.body?.issues);
    pushResult(`Invalid pagination ${name}`, rejected, `HTTP ${result.response.status()}`);
  }
}

async function runPaymentUpdateCheck(api, documentId) {
  if (!documentId) {
    pushResult("Documents payment update", false, "No documentId to test");
    return;
  }

  const payment = await requestJson(api, "PATCH", `/api/documents/${documentId}/payment`, {
    unitPrice: 25,
    amountPaid: 100,
  });

  const paymentOk =
    payment.response.ok() &&
    payment.body?.paymentStatus === "PAID" &&
    payment.body?.chargedTotal === "75" &&
    payment.body?.amountPaid === "100" &&
    payment.body?.changeGiven === "25";
  pushResult(
    "Documents payment update",
    paymentOk,
    `HTTP ${payment.response.status()} status=${payment.body?.paymentStatus ?? "n/a"} charged=${payment.body?.chargedTotal ?? "n/a"} amountPaid=${payment.body?.amountPaid ?? "n/a"} change=${payment.body?.changeGiven ?? "n/a"}`,
  );

  for (const [name, payload] of [
    ["negative amount", { amountPaid: -1 }],
    ["client-derived status", { amountPaid: 30, paymentStatus: "PAID" }],
    ["unsupported currency", { amountPaid: 30, currency: "EUR" }],
  ]) {
    const rejected = await requestJson(
      api,
      "PATCH",
      `/api/documents/${documentId}/payment`,
      payload,
    );
    pushResult(
      `Documents payment rejects ${name}`,
      rejected.response.status() === 400,
      `HTTP ${rejected.response.status()}`,
    );
  }
}

async function runLanguageOverrideFlow(api, template) {
  const roles = template.participantRoles;
  const primaryRoleKey = roles.find((role) => role.roleKey === "client")?.roleKey ?? roles[0]?.roleKey;
  if (!primaryRoleKey) {
    pushResult("Documents language override check", false, "No participant role found");
    return;
  }

  const participants = roles.map((role, index) => ({
    roleKey: role.roleKey,
    roleLabel: role.roleLabel,
    persona: {
      fullName: role.roleKey === primaryRoleKey ? "John Doe" : `Nom ${index + 1}`,
      nationalId: `LG${Date.now().toString(36)}${index + 1}`,
      phone: `0615000${index + 1}`,
      city: role.roleKey === primaryRoleKey ? "Paris" : "Rabat",
      addressLine1: "Adresse test",
    },
  }));
  const participantMap = Object.fromEntries(participants.map((p) => [p.roleKey, p.persona]));
  const payload = buildFieldPayload(template.fields, participantMap, false);

  const firstTry = await requestJson(api, "POST", "/api/documents/generate", {
    templateId: template.id,
    slug: template.slug,
    locale: template.locale,
    payload,
    participants,
    copies: 1,
    amountPaid: 10,
    languageOverrideConfirmed: false,
  });

  const firstCode = firstTry.body?.code;
  const requiresOverride = firstTry.response.status() === 409 && firstCode === "LANGUAGE_OVERRIDE_REQUIRED";
  const blockedByMismatch = firstTry.response.status() === 422 && firstCode === "LANGUAGE_MISMATCH";
  pushResult("Documents language guard trigger", requiresOverride || blockedByMismatch, `HTTP ${firstTry.response.status()} code=${firstCode ?? "n/a"}`);

  if (!requiresOverride) {
    return;
  }

  const secondTry = await requestJson(api, "POST", "/api/documents/generate", {
    templateId: template.id,
    slug: template.slug,
    locale: template.locale,
    payload,
    participants,
    copies: 1,
    amountPaid: 10,
    languageOverrideConfirmed: true,
  });
  pushResult("Documents language override confirm", secondTry.response.ok(), `HTTP ${secondTry.response.status()}`);
}

async function saveReport() {
  await fs.mkdir(outDir, { recursive: true });
  const summary = {
    generatedAt: new Date().toISOString(),
    baseURL,
    adminEmail,
    passCount: results.filter((result) => result.ok).length,
    failCount: results.filter((result) => !result.ok).length,
    results,
    artifacts: {
      documentIds: [...testArtifacts.documentIds],
      personaIds: [...testArtifacts.personaIds],
      printHistoryIds: [...testArtifacts.printHistoryIds],
      cleanup:
        "The public API has no document/persona test-cleanup operation; run this suite against a disposable database and storage volume or reset them after the run.",
    },
  };
  await fs.writeFile(path.join(outDir, "results.json"), JSON.stringify(summary, null, 2), "utf8");
  return summary;
}

async function run() {
  const api = await playwrightRequest.newContext({ baseURL });
  try {
    const loggedIn = await loginAsAdmin(api);
    if (!loggedIn) return;

    const template = await chooseTemplate(api);
    if (!template) return;

    await runInvalidPaginationChecks(api);
    await runGenerationGuardChecks(api, template);

    const newFlow = await runNewClientFlow(api, template);
    const existingFlow = await runExistingClientFlow(api, template);

    const deliveryDocId = existingFlow?.documentId ?? newFlow?.documentId;
    await runDeliveryChecks(api, deliveryDocId);
    await runPaymentUpdateCheck(api, deliveryDocId);
    await runLanguageOverrideFlow(api, template);
  } finally {
    await api.dispose();
  }
}

run()
  .catch((error) => {
    pushResult("Runner crash", false, error instanceof Error ? error.message : String(error));
  })
  .finally(async () => {
    const summary = await saveReport();
    if (summary.failCount > 0) {
      process.exitCode = 1;
    }
  });
