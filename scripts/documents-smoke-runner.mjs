import fs from "node:fs/promises";
import path from "node:path";
import { request as playwrightRequest } from "playwright";

const baseURL = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000";
const adminEmail = process.env.SMOKE_ADMIN_EMAIL ?? "admin@cybercafe.com";
const adminPassword = process.env.SMOKE_ADMIN_PASSWORD ?? "12345678";
const outDir = path.join(process.cwd(), "tmp", "documents-smoke");

const results = [];

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
  const candidates = [
    "/api/auth/sign-in/email",
    "/api/auth/sign-in/credential",
    "/api/auth/sign-in",
  ];

  for (const endpoint of candidates) {
    try {
      const { response } = await requestJson(api, "POST", endpoint, {
        email: adminEmail,
        password: adminPassword,
        rememberMe: true,
      });
      if (!response.ok()) continue;
      const me = await requestJson(api, "GET", "/api/users/me");
      const isPrivileged =
        me.response.ok() &&
        Array.isArray(me.body?.roles) &&
        me.body.roles.some((role) => role?.name === "admin" || role?.name === "employee");
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
      pushResult(
        "Template choose",
        true,
        `slug=${candidate.slug} locale=${detail.body.locale} roles=${roles.length} fields=${fields.length}`,
      );
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
  pushResult("Documents new-client persisted", hasCreated, `persisted=${persisted.length} document=${generate.body?.document?.id ?? "n/a"}`);

  const firstParticipant = participants[0];
  const verifyPersona = await requestJson(
    api,
    "GET",
    `/api/personas?q=${encodeURIComponent(firstParticipant.persona.nationalId)}&limit=5`,
  );
  const foundPersona =
    verifyPersona.response.ok() &&
    Array.isArray(verifyPersona.body) &&
    verifyPersona.body.find((item) => item?.nationalId === firstParticipant.persona.nationalId);
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
  const primaryPersisted = persisted.find((item) => item?.roleKey === primaryRoleKey);
  const actionOk =
    primaryPersisted?.action === "updated_existing" || primaryPersisted?.action === "linked_existing";
  pushResult("Documents existing-client persisted", Boolean(actionOk), `action=${primaryPersisted?.action ?? "n/a"} document=${generate.body?.document?.id ?? "n/a"}`);

  const verifyPersona = await requestJson(api, "GET", `/api/personas?q=${encodeURIComponent(seedNationalId)}&limit=5`);
  const fetched =
    verifyPersona.response.ok() &&
    Array.isArray(verifyPersona.body) &&
    verifyPersona.body.find((item) => item?.id === seedPersonaId);
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
    pushResult("Documents delivery download", false, "No documentId to test");
    pushResult("Documents delivery print-view", false, "No documentId to test");
    return;
  }

  const download = await api.fetch(`/api/documents/${documentId}/download`);
  const downloadType = download.headers()["content-type"] ?? "";
  const downloadOk =
    download.ok() &&
    (downloadType.includes("application/pdf") ||
      downloadType.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document"));
  pushResult(
    "Documents delivery download",
    downloadOk,
    `HTTP ${download.status()} content-type=${downloadType || "n/a"}`,
  );

  const printPage = await api.fetch(`/documents/${documentId}/print`);
  const printHtml = await printPage.text();
  const hasPrintFrame = /document-print-frame/i.test(printHtml);
  pushResult(
    "Documents delivery print-view",
    printPage.ok() && hasPrintFrame,
    `HTTP ${printPage.status()} frame=${hasPrintFrame}`,
  );
}

async function runPaymentUpdateCheck(api, documentId) {
  if (!documentId) {
    pushResult("Documents payment update", false, "No documentId to test");
    return;
  }

  const paidAt = new Date().toISOString();
  const payment = await requestJson(
    api,
    "PATCH",
    `/api/documents/${documentId}/payment`,
    {
      unitPrice: 25,
      chargedTotal: 25,
      amountPaid: 30,
      paidAt,
      currency: "MAD",
      paymentStatus: "PAID",
    },
  );

  const paymentOk =
    payment.response.ok() &&
    payment.body?.paymentStatus === "PAID" &&
    payment.body?.amountPaid === "30" &&
    payment.body?.changeGiven === "5";
  pushResult(
    "Documents payment update",
    paymentOk,
    `HTTP ${payment.response.status()} status=${payment.body?.paymentStatus ?? "n/a"} amountPaid=${payment.body?.amountPaid ?? "n/a"} change=${payment.body?.changeGiven ?? "n/a"}`,
  );
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
  const requiresOverride =
    firstTry.response.status() === 409 && firstCode === "LANGUAGE_OVERRIDE_REQUIRED";
  const blockedByMismatch =
    firstTry.response.status() === 422 && firstCode === "LANGUAGE_MISMATCH";
  pushResult(
    "Documents language guard trigger",
    requiresOverride || blockedByMismatch,
    `HTTP ${firstTry.response.status()} code=${firstCode ?? "n/a"}`,
  );

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
  pushResult(
    "Documents language override confirm",
    secondTry.response.ok(),
    `HTTP ${secondTry.response.status()}`,
  );
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
