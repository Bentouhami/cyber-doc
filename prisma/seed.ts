// prisma/seed.ts
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { hashPassword as betterAuthHashPassword } from "better-auth/crypto";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });
const prismaAny = prisma as any;

// Small helper to log a section nicely
const log = {
  section: (t: string) => console.log(`\n=== ${t} ===`),
  ok: (t: string) => console.log(`✓ ${t}`),
  info: (t: string) => console.log(`… ${t}`),
};

type FieldGroupFieldSeed = {
  fieldName: string;
  fieldLabel: string;
  fieldLabelAr?: string;
  fieldType: string;
  isRequired?: boolean;
  defaultValue?: string;
  validationRules?: Prisma.JsonValue;
  placeholder?: string;
  placeholderAr?: string;
  helpText?: string;
  helpTextAr?: string;
  dataSource?: string;
  metadata?: Prisma.JsonValue;
  options?: string[];
  displayOrder?: number;
};

type FieldGroupSeed = {
  code: string;
  name: string;
  nameAr?: string;
  description?: string;
  metadata?: Prisma.JsonValue;
  fields: FieldGroupFieldSeed[];
};

type TemplateParticipantRoleSeed = {
  roleKey: string;
  roleLabel: string;
  roleLabelAr?: string;
  description?: string;
  isRequired?: boolean;
  min?: number;
  max?: number;
};

type TemplateGroupAssignmentSeed = {
  code: string;
  roleKey?: string;
  section?: string;
  sectionAr?: string;
  displayOrder?: number;
  isRequired?: boolean;
  fieldNamePrefix?: string;
};

type TemplateCustomFieldSeed = {
  fieldName: string;
  fieldLabel: string;
  fieldLabelAr?: string;
  fieldType: string;
  isRequired?: boolean;
  participantRoleKey?: string;
  placeholder?: string;
  placeholderAr?: string;
  helpText?: string;
  helpTextAr?: string;
  dataSource?: string;
  allowMultiple?: boolean;
  section?: string;
  sectionAr?: string;
  displayOrder?: number;
  validationRules?: Prisma.JsonValue;
  defaultValue?: string;
  metadata?: Prisma.JsonValue;
  options?: string[];
};

type DocumentTypeSeed = {
  name: string;
  nameAr?: string;
  description?: string;
};

type DocumentCategorySeed = {
  name: string;
  nameAr?: string;
  description?: string;
};

type TemplateAssetSeed = {
  fileName: string;
  filePath: string;
  storageDriver?: string;
  fileType?: string;
  version?: number;
  metadata?: Prisma.JsonValue;
};

type TemplateSeed = {
  slug: string;
  title: string;
  titleAr?: string;
  description?: string;
  documentType: DocumentTypeSeed;
  category: DocumentCategorySeed;
  locale?: string;
  language?: string;
  version?: number;
  contentHtml?: string;
  contentCss?: string;
  pdfOptions?: Prisma.JsonValue;
  basePrice?: number;
  asset: TemplateAssetSeed;
  metadata?: Prisma.JsonValue;
  participantRoles: TemplateParticipantRoleSeed[];
  groupAssignments: TemplateGroupAssignmentSeed[];
  fields?: TemplateCustomFieldSeed[];
};

const FIELD_GROUP_SEEDS: FieldGroupSeed[] = [
  {
    code: "PERSON_CORE",
    name: "Identité complète",
    nameAr: "هوية الشخص",
    description: "Informations d'état civil et coordonnées détaillées",
    fields: [
      {
        fieldName: "fullName",
        fieldLabel: "Nom complet",
        fieldLabelAr: "الاسم الكامل",
        fieldType: "TEXT",
        isRequired: true,
        dataSource: "personas.{role}.fullName",
      },
      {
        fieldName: "nationalId",
        fieldLabel: "Numéro CIN",
        fieldLabelAr: "رقم البطاقة الوطنية",
        fieldType: "TEXT",
        isRequired: true,
        dataSource: "personas.{role}.nationalId",
      },
      {
        fieldName: "birthDate",
        fieldLabel: "Date de naissance",
        fieldLabelAr: "تاريخ الازدياد",
        fieldType: "DATE",
        dataSource: "personas.{role}.birthDate",
      },
      {
        fieldName: "birthPlace",
        fieldLabel: "Lieu de naissance",
        fieldLabelAr: "مكان الازدياد",
        fieldType: "TEXT",
        dataSource: "personas.{role}.birthPlace",
      },
      {
        fieldName: "gender",
        fieldLabel: "Genre",
        fieldLabelAr: "الجنس",
        fieldType: "SELECT",
        options: ["ذكر", "أنثى"],
        dataSource: "personas.{role}.gender",
      },
      {
        fieldName: "addressLine1",
        fieldLabel: "Adresse",
        fieldLabelAr: "العنوان",
        fieldType: "TEXTAREA",
        dataSource: "personas.{role}.addressLine1",
      },
      {
        fieldName: "city",
        fieldLabel: "Ville",
        fieldLabelAr: "المدينة",
        fieldType: "TEXT",
        dataSource: "personas.{role}.city",
      },
      {
        fieldName: "phone",
        fieldLabel: "Téléphone",
        fieldLabelAr: "الهاتف",
        fieldType: "PHONE",
        dataSource: "personas.{role}.phone",
      },
    ],
  },
  {
    code: "PERSON_MINIMAL",
    name: "Identité (essentielle)",
    nameAr: "هوية مختصرة",
    fields: [
      {
        fieldName: "fullName",
        fieldLabel: "Nom complet",
        fieldLabelAr: "الاسم الكامل",
        fieldType: "TEXT",
        isRequired: true,
        dataSource: "personas.{role}.fullName",
      },
      {
        fieldName: "nationalId",
        fieldLabel: "Numéro CIN",
        fieldLabelAr: "رقم البطاقة الوطنية",
        fieldType: "TEXT",
        dataSource: "personas.{role}.nationalId",
      },
      {
        fieldName: "addressLine1",
        fieldLabel: "Adresse",
        fieldLabelAr: "العنوان",
        fieldType: "TEXTAREA",
        dataSource: "personas.{role}.addressLine1",
      },
    ],
  },
  {
    code: "VEHICLE_CORE",
    name: "Détails du véhicule",
    nameAr: "معلومات المركبة",
    fields: [
      {
        fieldName: "manufacturer",
        fieldLabel: "Constructeur",
        fieldLabelAr: "الشركة المصنعة",
        fieldType: "TEXT",
        dataSource: "vehicles.{prefix}.manufacturer",
      },
      {
        fieldName: "model",
        fieldLabel: "Modèle",
        fieldLabelAr: "الطراز",
        fieldType: "TEXT",
        dataSource: "vehicles.{prefix}.model",
      },
      {
        fieldName: "registrationNumber",
        fieldLabel: "Numéro d'immatriculation",
        fieldLabelAr: "رقم التسجيل",
        fieldType: "TEXT",
        dataSource: "vehicles.{prefix}.registrationNumber",
      },
      {
        fieldName: "frameNumber",
        fieldLabel: "Numéro de châssis",
        fieldLabelAr: "رقم الهيكل",
        fieldType: "TEXT",
        dataSource: "vehicles.{prefix}.frameNumber",
      },
      {
        fieldName: "color",
        fieldLabel: "Couleur",
        fieldLabelAr: "اللون",
        fieldType: "TEXT",
        dataSource: "vehicles.{prefix}.color",
      },
    ],
  },
  {
    code: "FINANCIAL_COMMITMENT",
    name: "Engagement financier",
    nameAr: "التزام مالي",
    fields: [
      {
        fieldName: "amount",
        fieldLabel: "Montant",
        fieldLabelAr: "المبلغ",
        fieldType: "NUMBER",
        dataSource: "financial.amount",
      },
      {
        fieldName: "amountInWords",
        fieldLabel: "Montant en toutes lettres",
        fieldLabelAr: "المبلغ بالحروف",
        fieldType: "TEXTAREA",
        dataSource: "financial.amountInWords",
      },
      {
        fieldName: "dueDate",
        fieldLabel: "Date d'échéance",
        fieldLabelAr: "تاريخ الاستحقاق",
        fieldType: "DATE",
        dataSource: "financial.dueDate",
      },
    ],
  },
  {
    code: "DOCUMENT_META_BASIC",
    name: "Métadonnées document",
    nameAr: "بيانات الوثيقة",
    fields: [
      {
        fieldName: "issueCity",
        fieldLabel: "Ville d'émission",
        fieldLabelAr: "مدينة التحرير",
        fieldType: "TEXT",
        dataSource: "document.issueCity",
      },
      {
        fieldName: "issueDate",
        fieldLabel: "Date d'émission",
        fieldLabelAr: "تاريخ التحرير",
        fieldType: "DATE",
        dataSource: "document.issueDate",
      },
    ],
  },
];

const DOCUMENT_TEMPLATE_SEEDS: TemplateSeed[] = [
  {
    slug: "attestation-residence",
    title: "Attestation de résidence",
    titleAr: "إشهاد بالسكن",
    description: "تأكيد استضافة شخص ومحل إقامته",
    documentType: { name: "ATTESTATION", nameAr: "شهادة" },
    category: { name: "residence_attestation", nameAr: "إثبات السكن" },
    locale: "ar-MA",
    language: "ar",
    contentHtml: `
<div class="page">
  <h1 class="title">إشهاد بالسكن</h1>
  <p>أنا الموقع(ة) أسفله:</p>
  <div class="row">
    <span>السيد: {{declarant.fullName}}</span>
  </div>
  <div class="row">
    <span>الحامل(ة) للبطاقة الوطنية رقم: {{declarant.nationalId}}</span>
  </div>
  <div class="row">
    <span>العنوان: {{declarant.addressLine1}}</span>
  </div>
  <p class="mt">بموجب هذا أشهد على نفسي وأصرح بشرفي بأن:</p>
  <div class="row">
    <span>السيد(ة): {{hostedPerson.fullName}}</span>
  </div>
  <div class="row">
    <span>رقم البطاقة الوطنية: {{hostedPerson.nationalId}}</span>
  </div>
  <div class="row">
    <span>تقيم معي في نفس العنوان أعلاه.</span>
  </div>
  <p class="mt">حررت هذه الشهادة للإدلاء بها عند الحاجة والاقتضاء.</p>
  <div class="row">
    <span><span class="ltr">{{document.issueCity}}</span> في <span class="ltr">{{document.issueDate}}</span></span>
  </div>
  <div class="signature">
    <span>الإمضاء:</span>
  </div>
</div>
`.trim(),
    contentCss: `
body { direction: rtl; font-family: "Tajawal", "Segoe UI", Arial, sans-serif; }
.page { padding: 40px 48px; }
.title { text-align: center; font-size: 22px; margin-bottom: 16px; }
.row { margin: 6px 0; font-size: 15px; }
.mt { margin-top: 16px; }
.signature { margin-top: 32px; text-align: left; }
`.trim(),
    pdfOptions: {
      format: "A4",
      margin: { top: "1.2cm", right: "1.5cm", bottom: "1.2cm", left: "1.5cm" },
    },
    asset: {
      fileName: "اشهــــــاد سكن زهير حسايني.docx",
      filePath: "templates_docs/اشهــــــاد سكن زهير حسايني.docx",
      storageDriver: "local",
      metadata: { status: "legacy_imported" },
    },
    metadata: { status: "needs_tokenization" },
    participantRoles: [
      {
        roleKey: "declarant",
        roleLabel: "Déclarant",
        roleLabelAr: "المصرّح(ة)",
        isRequired: true,
      },
      {
        roleKey: "hostedPerson",
        roleLabel: "Personne hébergée",
        roleLabelAr: "المستفيد(ة)",
        isRequired: true,
      },
    ],
    groupAssignments: [
      { code: "PERSON_CORE", roleKey: "declarant", section: "Déclarant", sectionAr: "المصرّح(ة)", displayOrder: 1 },
      { code: "PERSON_MINIMAL", roleKey: "hostedPerson", section: "Personne hébergée", sectionAr: "المستفيد(ة)", displayOrder: 2 },
      { code: "DOCUMENT_META_BASIC", fieldNamePrefix: "document", section: "Métadonnées", sectionAr: "بيانات الوثيقة", displayOrder: 3 },
    ],
  },
  {
    slug: "debt-acknowledgement",
    title: "Reconnaissance de dette",
    titleAr: "اعتراف بدين",
    description: "إقرار بالدين والتزام بالسداد",
    documentType: { name: "DECLARATION", nameAr: "تصريح" },
    category: { name: "debt_acknowledgement", nameAr: "اعتراف بدين" },
    locale: "ar-MA",
    language: "ar",
    contentHtml: `
<div class="page">
  <h1 class="title">اعتراف بدين</h1>
  <p>أنا الموقع(ة) أسفله:</p>
  <div class="row">
    <span>{{debtor.fullName}}</span>، مغربي(ة) الجنسية، والحامل(ة) لبطاقة التعريف الوطنية رقم:
    <span>{{debtor.nationalId}}</span>.
  </div>
  <p class="mt">
    أقر وأشهد على نفسي بأنني مدين(ة) للسيد(ة):
    <span>{{creditor.fullName}}</span>، حامل لبطاقة التعريف الوطنية رقم:
    <span>{{creditor.nationalId}}</span>.
  </p>
  <p class="mt">
    وذلك في دين ناتج عن: <span>{{financial.reason}}</span>
  </p>
  <p class="mt">
    والمبلغ هو: <strong>{{financial.amount}}</strong> درهم
    (<span>{{financial.amountInWords}}</span>)، وسأسدده في أجل أقصاه:
    <span>{{financial.dueDate}}</span>.
  </p>
  <div class="row mt">
    <span><span class="ltr">{{document.issueCity}}</span> في <span class="ltr">{{document.issueDate}}</span></span>
  </div>
  <div class="signature">
    <span>الإمضاء:</span>
  </div>
</div>
`.trim(),
    contentCss: `
body { direction: rtl; font-family: "Tajawal", "Segoe UI", Arial, sans-serif; }
.page { padding: 40px 48px; }
.title { text-align: center; font-size: 22px; margin-bottom: 16px; }
.row { margin: 6px 0; font-size: 15px; }
.mt { margin-top: 16px; }
.signature { margin-top: 32px; text-align: left; }
`.trim(),
    pdfOptions: {
      format: "A4",
      margin: { top: "1.2cm", right: "1.5cm", bottom: "1.2cm", left: "1.5cm" },
    },
    asset: {
      fileName: "اعتـــــــــراف بديــن الزروالي.docx",
      filePath: "templates_docs/اعتـــــــــراف بديــن الزروالي.docx",
      storageDriver: "local",
      metadata: { status: "legacy_imported" },
    },
    metadata: { status: "needs_tokenization" },
    participantRoles: [
      {
        roleKey: "debtor",
        roleLabel: "Débiteur",
        roleLabelAr: "المدين(ة)",
        isRequired: true,
      },
      {
        roleKey: "creditor",
        roleLabel: "Créancier",
        roleLabelAr: "الدائن(ة)",
        isRequired: true,
      },
    ],
    groupAssignments: [
      { code: "PERSON_CORE", roleKey: "debtor", section: "Débiteur", sectionAr: "المدين(ة)", displayOrder: 1 },
      { code: "PERSON_CORE", roleKey: "creditor", section: "Créancier", sectionAr: "الدائن(ة)", displayOrder: 2 },
      { code: "FINANCIAL_COMMITMENT", fieldNamePrefix: "financial", section: "Engagement financier", sectionAr: "الالتزام المالي", displayOrder: 3 },
      { code: "DOCUMENT_META_BASIC", fieldNamePrefix: "document", section: "Métadonnées", sectionAr: "بيانات الوثيقة", displayOrder: 4 },
    ],
    fields: [
      {
        fieldName: "financial.reason",
        fieldLabel: "Motif de la dette",
        fieldLabelAr: "سبب الدين",
        fieldType: "TEXTAREA",
        section: "Engagement financier",
        sectionAr: "الالتزام المالي",
      },
    ],
  },
  {
    slug: "vehicle-sale-contract",
    title: "Contrat de vente véhicule",
    titleAr: "عقد بيع سيارة",
    description: "عقد بيع سيارة بين بائع ومشتري",
    documentType: { name: "CONTRACT", nameAr: "عقد" },
    category: { name: "vehicle_sale", nameAr: "عقد بيع سيارة" },
    locale: "ar-MA",
    language: "ar",
    basePrice: 200,
    contentHtml: `
<div class="page">
  <h1 class="title">عقد بيع سيارة</h1>
  <p>تم هذا العقد بين الطرفين:</p>
  <div class="section">
    <h2>البائع(ة)</h2>
    <p>الاسم الكامل: {{seller.fullName}}</p>
    <p>رقم البطاقة الوطنية: {{seller.nationalId}}</p>
    <p>العنوان: {{seller.addressLine1}}</p>
  </div>
  <div class="section">
    <h2>المشتري(ة)</h2>
    <p>الاسم الكامل: {{buyer.fullName}}</p>
    <p>رقم البطاقة الوطنية: {{buyer.nationalId}}</p>
    <p>العنوان: {{buyer.addressLine1}}</p>
  </div>
  <div class="section">
    <h2>معلومات السيارة</h2>
    <p>الشركة المصنعة: <span class="ltr">{{vehicle.manufacturer}}</span></p>
    <p>الطراز: <span class="ltr">{{vehicle.model}}</span></p>
    <p>رقم التسجيل: <span class="ltr">{{vehicle.registrationNumber}}</span></p>
    <p>رقم الهيكل: <span class="ltr">{{vehicle.frameNumber}}</span></p>
    <p>اللون: <span class="ltr">{{vehicle.color}}</span></p>
  </div>
  <div class="section">
    <h2>الثمن</h2>
    <p>المبلغ: <span class="ltr">{{sale.price}}</span> درهم</p>
    <p>المبلغ بالحروف: {{sale.priceInWords}}</p>
    <p>تاريخ البيع: <span class="ltr">{{sale.date}}</span></p>
  </div>
  <p class="mt">حرر هذا العقد للإدلاء به عند الحاجة.</p>
  <div class="row mt">
    <span><span class="ltr">{{document.issueCity}}</span> في <span class="ltr">{{document.issueDate}}</span></span>
  </div>
  <div class="signatures">
    <div>إمضاء البائع(ة):</div>
    <div>إمضاء المشتري(ة):</div>
  </div>
</div>
`.trim(),
    contentCss: `
body { direction: rtl; font-family: "Tajawal", "Segoe UI", Arial, sans-serif; }
.page { padding: 40px 48px; }
.title { text-align: center; font-size: 22px; margin-bottom: 16px; }
.section { margin: 14px 0; }
.section h2 { font-size: 16px; margin-bottom: 6px; }
.mt { margin-top: 16px; }
.row { margin: 6px 0; }
.signatures { margin-top: 32px; display: flex; justify-content: space-between; }
`.trim(),
    pdfOptions: {
      format: "A4",
      margin: { top: "1.2cm", right: "1.5cm", bottom: "1.2cm", left: "1.5cm" },
    },
    asset: {
      fileName: "vehicle-sale-contract.docx",
      filePath: "templates_docs/vehicle-sale-contract.docx",
      storageDriver: "local",
      metadata: { status: "legacy_imported" },
    },
    metadata: { status: "needs_tokenization" },
    participantRoles: [
      {
        roleKey: "seller",
        roleLabel: "Vendeur",
        roleLabelAr: "البائع(ة)",
        isRequired: true,
      },
      {
        roleKey: "buyer",
        roleLabel: "Acheteur",
        roleLabelAr: "المشتري(ة)",
        isRequired: true,
      },
    ],
    groupAssignments: [
      { code: "PERSON_CORE", roleKey: "seller", section: "Vendeur", sectionAr: "البائع(ة)", displayOrder: 1 },
      { code: "PERSON_CORE", roleKey: "buyer", section: "Acheteur", sectionAr: "المشتري(ة)", displayOrder: 2 },
      { code: "VEHICLE_CORE", fieldNamePrefix: "vehicle", section: "Véhicule", sectionAr: "السيارة", displayOrder: 3 },
      { code: "DOCUMENT_META_BASIC", fieldNamePrefix: "document", section: "Métadonnées", sectionAr: "بيانات الوثيقة", displayOrder: 4 },
    ],
    fields: [
      {
        fieldName: "sale.price",
        fieldLabel: "Prix de vente",
        fieldLabelAr: "ثمن البيع",
        fieldType: "NUMBER",
        section: "الثمن",
        sectionAr: "الثمن",
      },
      {
        fieldName: "sale.priceInWords",
        fieldLabel: "Montant en lettres",
        fieldLabelAr: "المبلغ بالحروف",
        fieldType: "TEXTAREA",
        section: "الثمن",
        sectionAr: "الثمن",
      },
      {
        fieldName: "sale.date",
        fieldLabel: "Date de vente",
        fieldLabelAr: "تاريخ البيع",
        fieldType: "DATE",
        section: "الثمن",
        sectionAr: "الثمن",
      },
    ],
  },
];


async function seedRoles() {
  log.section("الأدوار (Roles)");
  const roles = [
    { name: "admin", description: "Administrateur" },
    { name: "employee", description: "Employé" },
  ];
  for (const r of roles) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: r,
      create: r,
    });
    log.ok(`دور: ${r.name}`);
  }
}

async function seedAdminUser() {
  log.section("الحسابات الافتراضية (Default Users)");

  const adminRole = await prisma.role.findUnique({ where: { name: "admin" } });
  if (!adminRole) {
    log.info("تخطي إنشاء حساب المدير: دور admin غير موجود.");
    return;
  }
  const employeeRole = await prisma.role.findUnique({ where: { name: "employee" } });

  const adminEmail = "admin@cybercafe.com";
  const adminPassword = "12345678";
  const passwordHash = await hash(adminPassword, 10);
  const accountPasswordHash = await betterAuthHashPassword(adminPassword);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      firstName: "أحمد",
      lastName: "محمد",
      name: "أحمد محمد",
      emailVerified: true,
      emailVerifiedAt: new Date(),
      passwordHash,
    },
    create: {
      email: adminEmail,
      firstName: "أحمد",
      lastName: "محمد",
      name: "أحمد محمد",
      emailVerified: true,
      emailVerifiedAt: new Date(),
      passwordHash,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  await prisma.account.upsert({
    where: {
      providerId_accountId: {
        providerId: "credential",
        accountId: adminEmail,
      },
    },
    update: {
      userId: adminUser.id,
      password: accountPasswordHash,
    },
    create: {
      providerId: "credential",
      accountId: adminEmail,
      userId: adminUser.id,
      password: accountPasswordHash,
    },
  });

  log.ok(`حساب المدير جاهز: ${adminEmail} / ${adminPassword}`);

  if (!employeeRole) {
    log.info("تخطي إنشاء حساب الموظف: دور employee غير موجود.");
    return;
  }

  const employeeEmail = "employee@cybercafe.com";
  const employeePassword = "12345678";
  const employeePasswordHash = await hash(employeePassword, 10);
  const employeeAccountPasswordHash = await betterAuthHashPassword(employeePassword);

  const employeeUser = await prisma.user.upsert({
    where: { email: employeeEmail },
    update: {
      firstName: "سعيد",
      lastName: "العمري",
      name: "سعيد العمري",
      emailVerified: true,
      emailVerifiedAt: new Date(),
      passwordHash: employeePasswordHash,
    },
    create: {
      email: employeeEmail,
      firstName: "سعيد",
      lastName: "العمري",
      name: "سعيد العمري",
      emailVerified: true,
      emailVerifiedAt: new Date(),
      passwordHash: employeePasswordHash,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: employeeUser.id,
        roleId: employeeRole.id,
      },
    },
    update: {},
    create: {
      userId: employeeUser.id,
      roleId: employeeRole.id,
    },
  });

  await prisma.account.upsert({
    where: {
      providerId_accountId: {
        providerId: "credential",
        accountId: employeeEmail,
      },
    },
    update: {
      userId: employeeUser.id,
      password: employeeAccountPasswordHash,
    },
    create: {
      providerId: "credential",
      accountId: employeeEmail,
      userId: employeeUser.id,
      password: employeeAccountPasswordHash,
    },
  });

  log.ok(`حساب الموظف جاهز: ${employeeEmail} / ${employeePassword}`);
}

async function seedActivityTypes() {
  log.section("أنواع الأنشطة (ActivityTypes)");
  const activityTypes = [
    {
      name: "LOGIN",
      nameAr: "تسجيل الدخول",
      category: "auth",
      description: "User login",
    },
    {
      name: "LOGOUT",
      nameAr: "تسجيل الخروج",
      category: "auth",
      description: "User logout",
    },
    {
      name: "CREATE_EMPLOYEE",
      nameAr: "إضافة موظف",
      category: "user",
      description: "Create employee",
    },
    {
      name: "UPDATE_EMPLOYEE",
      nameAr: "تحديث موظف",
      category: "user",
      description: "Update employee",
    },
    {
      name: "CREATE_DOCUMENT",
      nameAr: "إنشاء وثيقة",
      category: "document",
      description: "Create document",
    },
    {
      name: "UPDATE_DOCUMENT",
      nameAr: "تحديث وثيقة",
      category: "document",
      description: "Update document",
    },
    {
      name: "PRINT_DOCUMENT",
      nameAr: "طباعة وثيقة",
      category: "document",
      description: "Print document",
    },
    {
      name: "ARCHIVE_DOCUMENT",
      nameAr: "أرشفة وثيقة",
      category: "document",
      description: "Archive document",
    },
    {
      name: "CREATE_TEMPLATE",
      nameAr: "إنشاء قالب",
      category: "template",
      description: "Create template",
    },
    {
      name: "UPDATE_TEMPLATE",
      nameAr: "تحديث قالب",
      category: "template",
      description: "Update template",
    },
    {
      name: "ASSIGN_CLIENT",
      nameAr: "ربط زبون بالوثيقة",
      category: "client",
      description: "Link client to document",
    },
  ];
  for (const t of activityTypes) {
    await prisma.activityType.upsert({
      where: { name: t.name },
      update: { ...t, isActive: true },
      create: { ...t, isActive: true },
    });
    log.ok(`نشاط: ${t.name} (${t.nameAr})`);
  }
}

async function seedDocumentStatuses() {
  log.section("حالات الوثائق (DocumentStatuses)");
  const statuses = [
    {
      name: "DRAFT",
      nameAr: "مسودة",
      description: "En cours de rédaction",
      color: "#64748B",
      displayOrder: 1,
    },
    {
      name: "READY",
      nameAr: "جاهز",
      description: "Prêt pour impression",
      color: "#22C55E",
      displayOrder: 2,
    },
    {
      name: "PRINTED",
      nameAr: "مطبوع",
      description: "Imprimé",
      color: "#0EA5E9",
      displayOrder: 3,
    },
    {
      name: "ARCHIVED",
      nameAr: "مؤرشف",
      description: "Archivé",
      color: "#6B7280",
      displayOrder: 4,
    },
  ];
  for (const s of statuses) {
    await prisma.documentStatus.upsert({
      where: { name: s.name },
      update: { ...s, isActive: true },
      create: { ...s, isActive: true },
    });
    log.ok(`حالة: ${s.name} (${s.nameAr})`);
  }
}

async function seedFileFormats() {
  log.section("صيغ الملفات (FileFormats)");
  const formats = [
    {
      name: "PDF",
      nameAr: "PDF",
      extension: ".pdf",
      mimeType: "application/pdf",
    },
    {
      name: "DOCX",
      nameAr: "DOCX",
      extension: ".docx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    },
    { name: "BOTH", nameAr: "كلاهما", extension: null, mimeType: null },
  ];
  for (const f of formats) {
    await prisma.fileFormat.upsert({
      where: { name: f.name },
      update: { ...f, isActive: true },
      create: { ...f, isActive: true },
    });
    log.ok(`صيغة: ${f.name}`);
  }
}

async function seedFieldTypes() {
  log.section("أنواع الحقول (FieldTypes)");
  const fieldTypes = [
    { name: "TEXT", nameAr: "نص" },
    { name: "TEXTAREA", nameAr: "نص متعدد الأسطر" },
    { name: "NUMBER", nameAr: "رقم" },
    { name: "DATE", nameAr: "تاريخ" },
    { name: "EMAIL", nameAr: "بريد إلكتروني" },
    { name: "PHONE", nameAr: "هاتف" },
    { name: "SELECT", nameAr: "اختيار" },
    { name: "CHECKBOX", nameAr: "خانة اختيار" },
  ];
  for (const ft of fieldTypes) {
    await prisma.fieldType.upsert({
      where: { name: ft.name },
      update: { ...ft, isActive: true },
      create: { ...ft, isActive: true },
    });
    log.ok(`حقل: ${ft.name} (${ft.nameAr})`);
  }
}

async function getFieldTypeMap() {
  const fieldTypes = await prisma.fieldType.findMany();
  return new Map(fieldTypes.map((ft) => [ft.name, ft.id]));
}

async function seedTemplateFieldGroups(fieldTypeMap: Map<string, number>) {
  log.section("مجموعات الحقول (TemplateFieldGroups)");

  for (const group of FIELD_GROUP_SEEDS) {
    const groupRecord = await prismaAny.templateFieldGroup.upsert({
      where: { code: group.code },
      update: {
        name: group.name,
        nameAr: group.nameAr ?? null,
        description: group.description ?? null,
        metadata: group.metadata ?? null,
        isActive: true,
      },
      create: {
        code: group.code,
        name: group.name,
        nameAr: group.nameAr ?? null,
        description: group.description ?? null,
        metadata: group.metadata ?? null,
        isActive: true,
      },
    });

    let displayOrder = 1;
    for (const field of group.fields) {
      const fieldTypeId = fieldTypeMap.get(field.fieldType);
      if (!fieldTypeId) {
        throw new Error(`FieldType ${field.fieldType} غير موجود لمجموعة ${group.code}`);
      }

      await prismaAny.templateFieldGroupField.upsert({
        where: {
          groupId_fieldName: {
            groupId: groupRecord.id,
            fieldName: field.fieldName,
          },
        },
        update: {
          fieldLabel: field.fieldLabel,
          fieldLabelAr: field.fieldLabelAr ?? null,
          fieldTypeId,
          isRequired: field.isRequired ?? false,
          defaultValue: field.defaultValue ?? null,
          validationRules: field.validationRules ?? null,
          placeholder: field.placeholder ?? null,
          placeholderAr: field.placeholderAr ?? null,
          helpText: field.helpText ?? null,
          helpTextAr: field.helpTextAr ?? null,
          dataSource: field.dataSource ?? null,
          metadata: field.metadata ?? null,
          displayOrder: field.displayOrder ?? displayOrder,
        },
        create: {
          groupId: groupRecord.id,
          fieldName: field.fieldName,
          fieldLabel: field.fieldLabel,
          fieldLabelAr: field.fieldLabelAr ?? null,
          fieldTypeId,
          isRequired: field.isRequired ?? false,
          defaultValue: field.defaultValue ?? null,
          validationRules: field.validationRules ?? null,
          placeholder: field.placeholder ?? null,
          placeholderAr: field.placeholderAr ?? null,
          helpText: field.helpText ?? null,
          helpTextAr: field.helpTextAr ?? null,
          dataSource: field.dataSource ?? null,
          metadata: field.metadata ?? null,
          displayOrder: field.displayOrder ?? displayOrder,
        },
      });

      displayOrder += 1;
    }
  }

  const groups = await prismaAny.templateFieldGroup.findMany({
    include: { fields: true },
  });

  return new Map<string, any>(groups.map((g: any) => [g.code as string, g]));
}

function resolveDataSource(
  base: string | null | undefined,
  assignment: TemplateGroupAssignmentSeed,
  fieldName: string,
) {
  if (base) {
    if (assignment.roleKey && base.includes("{role}")) {
      return base.replace("{role}", assignment.roleKey);
    }
    if (assignment.fieldNamePrefix && base.includes("{prefix}")) {
      return base.replace("{prefix}", assignment.fieldNamePrefix);
    }
    return base;
  }

  if (assignment.roleKey) {
    return `personas.${assignment.roleKey}.${fieldName}`;
  }

  if (assignment.fieldNamePrefix) {
    return `${assignment.fieldNamePrefix}.${fieldName}`;
  }

  return null;
}

async function seedDocumentTemplates(params: {
  fieldTypeMap: Map<string, number>;
  groupMap: Map<string, any>;
}) {
  log.section("قوالب الوثائق (DocumentTemplates)");

  const { fieldTypeMap, groupMap } = params;

  const typeCache = new Map<string, number>();
  for (const template of DOCUMENT_TEMPLATE_SEEDS) {
    if (!typeCache.has(template.documentType.name)) {
      const record = await prisma.documentType.upsert({
        where: { name: template.documentType.name },
        update: {
          nameAr: template.documentType.nameAr ?? null,
        },
        create: {
          name: template.documentType.name,
          nameAr: template.documentType.nameAr ?? null,
        },
      });
      typeCache.set(template.documentType.name, record.id);
      log.ok(`نوع وثيقة مهيأ: ${template.documentType.name}`);
    }
  }

  const categoryCache = new Map<string, number>();
  for (const template of DOCUMENT_TEMPLATE_SEEDS) {
    const typeId = typeCache.get(template.documentType.name)!;
    const key = `${typeId}:${template.category.name}`;
    if (!categoryCache.has(key)) {
      const record = await prisma.documentCategory.upsert({
        where: {
          name_documentTypeId: {
            name: template.category.name,
            documentTypeId: typeId,
          },
        },
        update: {
          nameAr: template.category.nameAr ?? null,
        },
        create: {
          name: template.category.name,
          nameAr: template.category.nameAr ?? null,
          documentTypeId: typeId,
        },
      });
      categoryCache.set(key, record.id);
      log.ok(`فئة مهيأة: ${template.category.name}`);
    }
  }

  for (const template of DOCUMENT_TEMPLATE_SEEDS) {
    const typeId = typeCache.get(template.documentType.name)!;
    const categoryId = categoryCache.get(`${typeId}:${template.category.name}`)!;

    const assetVersion = template.asset.version ?? 1;
    const asset = await prismaAny.templateAsset.upsert({
      where: {
        filePath_version: {
          filePath: template.asset.filePath,
          version: assetVersion,
        },
      },
      update: {
        fileName: template.asset.fileName,
        storageDriver: template.asset.storageDriver ?? "local",
        fileType:
          template.asset.fileType ??
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        metadata: template.asset.metadata ?? null,
      },
      create: {
        fileName: template.asset.fileName,
        filePath: template.asset.filePath,
        storageDriver: template.asset.storageDriver ?? "local",
        fileType:
          template.asset.fileType ??
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        version: assetVersion,
        metadata: template.asset.metadata ?? null,
      },
    });

    const baseMetadata =
      template.metadata && typeof template.metadata === "object"
        ? (template.metadata as Record<string, unknown>)
        : {};
    const templateMetadata = {
      ...baseMetadata,
      assetVersion,
      ...(template.contentCss ? { htmlCss: template.contentCss } : {}),
      ...(template.pdfOptions ? { pdfOptions: template.pdfOptions } : {}),
      ...(template.basePrice !== undefined ? { basePrice: template.basePrice } : {}),
    } as Prisma.JsonValue;

    const templateRecord = await prismaAny.documentTemplate.upsert({
      where: { slug: template.slug },
      update: {
        title: template.title,
        titleAr: template.titleAr ?? null,
        description: template.description ?? null,
        documentTypeId: typeId,
        categoryId,
        locale: template.locale ?? "ar-MA",
        language: template.language ?? "ar",
        version: template.version ?? 1,
        metadata: templateMetadata,
        assetId: asset.id,
        content: template.contentHtml ?? null,
        isActive: true,
      },
      create: {
        slug: template.slug,
        title: template.title,
        titleAr: template.titleAr ?? null,
        description: template.description ?? null,
        documentTypeId: typeId,
        categoryId,
        locale: template.locale ?? "ar-MA",
        language: template.language ?? "ar",
        version: template.version ?? 1,
        metadata: templateMetadata,
        assetId: asset.id,
        content: template.contentHtml ?? null,
        isActive: true,
      },
    });

    for (const role of template.participantRoles) {
      await prismaAny.templateParticipantRole.upsert({
        where: {
          templateId_roleKey: {
            templateId: templateRecord.id,
            roleKey: role.roleKey,
          },
        },
        update: {
          roleLabel: role.roleLabel,
          roleLabelAr: role.roleLabelAr ?? null,
          description: role.description ?? null,
          isRequired: role.isRequired ?? true,
          minParticipants: role.min ?? 1,
          maxParticipants: role.max ?? null,
        },
        create: {
          templateId: templateRecord.id,
          roleKey: role.roleKey,
          roleLabel: role.roleLabel,
          roleLabelAr: role.roleLabelAr ?? null,
          description: role.description ?? null,
          isRequired: role.isRequired ?? true,
          minParticipants: role.min ?? 1,
          maxParticipants: role.max ?? null,
        },
      });
    }

    let displayOrder = 1;
    for (const assignment of template.groupAssignments) {
      const group = groupMap.get(assignment.code);
      if (!group) {
        log.info(`⚠️ مجموعة الحقول غير موجودة: ${assignment.code}`);
        continue;
      }

      await prismaAny.templateFieldGroupAssignment.upsert({
        where: {
          templateId_groupId: {
            templateId: templateRecord.id,
            groupId: group.id,
          },
        },
        update: {
          displayOrder: assignment.displayOrder ?? displayOrder,
          isRequired: assignment.isRequired ?? true,
        },
        create: {
          templateId: templateRecord.id,
          groupId: group.id,
          displayOrder: assignment.displayOrder ?? displayOrder,
          isRequired: assignment.isRequired ?? true,
        },
      });

      const groupFields = [...group.fields].sort(
        (a: { displayOrder: number }, b: { displayOrder: number }) =>
          (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
      );

      for (const groupField of groupFields) {
        const prefix = assignment.fieldNamePrefix ?? assignment.roleKey ?? assignment.code.toLowerCase();
        const fieldName = prefix
          ? `${prefix}.${groupField.fieldName}`
          : groupField.fieldName;
        const dataSource = resolveDataSource(
          groupField.dataSource,
          assignment,
          groupField.fieldName,
        );
        const allowMultiple = Boolean(
          groupField.metadata &&
            typeof groupField.metadata === "object" &&
            (groupField.metadata as Record<string, unknown>).allowMultiple === true,
        );

        await prismaAny.templateField.upsert({
          where: {
            templateId_fieldName: {
              templateId: templateRecord.id,
              fieldName,
            },
          },
          update: {
            fieldLabel: groupField.fieldLabel,
            fieldLabelAr: groupField.fieldLabelAr ?? null,
            fieldTypeId: groupField.fieldTypeId,
            isRequired: groupField.isRequired ?? false,
            defaultValue: groupField.defaultValue ?? null,
            validationRules: groupField.validationRules ?? null,
            placeholder: groupField.placeholder ?? null,
            placeholderAr: groupField.placeholderAr ?? null,
            helpText: groupField.helpText ?? null,
            helpTextAr: groupField.helpTextAr ?? null,
            dataSource,
            participantRoleKey: assignment.roleKey ?? null,
            groupFieldId: groupField.id,
            metadata: groupField.metadata ?? null,
            options: groupField.options ?? null,
            uiSchema: null,
            allowMultiple,
            section: assignment.section ?? group.name,
            sectionAr: assignment.sectionAr ?? group.nameAr ?? null,
            displayOrder,
            isActive: true,
          },
          create: {
            templateId: templateRecord.id,
            fieldName,
            fieldLabel: groupField.fieldLabel,
            fieldLabelAr: groupField.fieldLabelAr ?? null,
            fieldTypeId: groupField.fieldTypeId,
            isRequired: groupField.isRequired ?? false,
            defaultValue: groupField.defaultValue ?? null,
            validationRules: groupField.validationRules ?? null,
            placeholder: groupField.placeholder ?? null,
            placeholderAr: groupField.placeholderAr ?? null,
            helpText: groupField.helpText ?? null,
            helpTextAr: groupField.helpTextAr ?? null,
            dataSource,
            participantRoleKey: assignment.roleKey ?? null,
            groupFieldId: groupField.id,
            metadata: groupField.metadata ?? null,
            options: groupField.options ?? null,
            uiSchema: null,
            allowMultiple,
            section: assignment.section ?? group.name,
            sectionAr: assignment.sectionAr ?? group.nameAr ?? null,
            displayOrder,
            isActive: true,
          },
        });

        displayOrder += 1;
      }
    }

    if (template.fields) {
      for (const custom of template.fields) {
        const fieldTypeId = fieldTypeMap.get(custom.fieldType);
        if (!fieldTypeId) {
          throw new Error(`FieldType ${custom.fieldType} غير موجود لحقل ${custom.fieldName}`);
        }

        await prismaAny.templateField.upsert({
          where: {
            templateId_fieldName: {
              templateId: templateRecord.id,
              fieldName: custom.fieldName,
            },
          },
          update: {
            fieldLabel: custom.fieldLabel,
            fieldLabelAr: custom.fieldLabelAr ?? null,
            fieldTypeId,
            isRequired: custom.isRequired ?? false,
            defaultValue: custom.defaultValue ?? null,
            validationRules: custom.validationRules ?? null,
            placeholder: custom.placeholder ?? null,
            placeholderAr: custom.placeholderAr ?? null,
            helpText: custom.helpText ?? null,
            helpTextAr: custom.helpTextAr ?? null,
            dataSource: custom.dataSource ?? null,
            participantRoleKey: custom.participantRoleKey ?? null,
            groupFieldId: null,
            metadata: custom.metadata ?? null,
            options: custom.options ?? null,
            uiSchema: null,
            allowMultiple: custom.allowMultiple ?? false,
            section: custom.section ?? "Autres informations",
            sectionAr: custom.sectionAr ?? "معلومات إضافية",
            displayOrder,
            isActive: true,
          },
          create: {
            templateId: templateRecord.id,
            fieldName: custom.fieldName,
            fieldLabel: custom.fieldLabel,
            fieldLabelAr: custom.fieldLabelAr ?? null,
            fieldTypeId,
            isRequired: custom.isRequired ?? false,
            defaultValue: custom.defaultValue ?? null,
            validationRules: custom.validationRules ?? null,
            placeholder: custom.placeholder ?? null,
            placeholderAr: custom.placeholderAr ?? null,
            helpText: custom.helpText ?? null,
            helpTextAr: custom.helpTextAr ?? null,
            dataSource: custom.dataSource ?? null,
            participantRoleKey: custom.participantRoleKey ?? null,
            groupFieldId: null,
            metadata: custom.metadata ?? null,
            options: custom.options ?? null,
            uiSchema: null,
            allowMultiple: custom.allowMultiple ?? false,
            section: custom.section ?? "Autres informations",
            sectionAr: custom.sectionAr ?? "معلومات إضافية",
            displayOrder,
            isActive: true,
          },
        });
        displayOrder += 1;
      }
    }

    log.ok(`قالب مهيأ: ${templateRecord.title}`);
  }
}

async function seedPrinters() {
  log.section("الطابعات (Printers)");
  const printers = [
    {
      id: "PRN-001",
      name: "Printer-FrontDesk",
      location: "Guichet 1",
      ipAddress: "192.168.1.50",
      isActive: true,
    },
  ];
  for (const p of printers) {
    await prisma.printer.upsert({
      where: { name: p.name }, // name is unique
      update: p,
      create: p,
    });
    log.ok(`طابعة: ${p.name}`);
  }
}

async function seedAppSettings() {
  log.section("إعدادات التطبيق (AppSettings)");
  const settings = [
    { key: "currency", value: "MAD", type: "string", category: "general" },
    {
      key: "max_copies_default",
      value: "3",
      type: "number",
      category: "print",
    },
    {
      key: "footer_note",
      value: "شكراً لثقتكم",
      type: "string",
      category: "ui",
    },
  ];
  for (const s of settings) {
    await prisma.appSetting.upsert({
      where: { key: s.key },
      update: s,
      create: s,
    });
    log.ok(`إعداد: ${s.key} = ${s.value}`);
  }
}

async function main() {
  log.section("بدء التهيئة (Seeding Start)");

  await seedRoles();
  await seedAdminUser();
  await seedActivityTypes();
  await seedDocumentStatuses();
  await seedFileFormats();
  await seedFieldTypes();

  const fieldTypeMap = await getFieldTypeMap();
  const groupMap = await seedTemplateFieldGroups(fieldTypeMap);
  await seedDocumentTemplates({ fieldTypeMap, groupMap });

  await seedPrinters();
  await seedAppSettings();

  log.section("إحصاءات سريعة (Quick Stats)");
  const [
    roles,
    activityTypes,
    statuses,
    formats,
    ftypes,
    doctypes,
    cats,
    templates,
    tfields,
    tfieldGroups,
    tgroupFields,
    participantRoles,
    templateAssets,
    printers,
    settings,
  ] = await Promise.all([
    prisma.role.count(),
    prisma.activityType.count(),
    prisma.documentStatus.count(),
    prisma.fileFormat.count(),
    prisma.fieldType.count(),
    prisma.documentType.count(),
    prisma.documentCategory.count(),
    prisma.documentTemplate.count(),
    prisma.templateField.count(),
    prismaAny.templateFieldGroup.count(),
    prismaAny.templateFieldGroupField.count(),
    prismaAny.templateParticipantRole.count(),
    prismaAny.templateAsset.count(),
    prisma.printer.count(),
    prisma.appSetting.count(),
  ]);

  console.log({
    roles,
    activityTypes,
    statuses,
    formats,
    ftypes,
    doctypes,
    cats,
    templates,
    tfields,
    tfieldGroups,
    tgroupFields,
    participantRoles,
    templateAssets,
    printers,
    settings,
  });

  log.section("انتهت التهيئة بنجاح ✅");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ خطأ أثناء التهيئة (Seed error):", e);
    await prisma.$disconnect();
    process.exit(1);
  });
