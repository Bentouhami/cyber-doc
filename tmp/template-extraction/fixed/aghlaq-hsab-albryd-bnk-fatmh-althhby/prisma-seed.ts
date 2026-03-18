// Prisma seed snippet for template aghlaq-hsab-albryd-bnk-fatmh-althhby
await prisma.documentTemplate.create({
  data: {
    id: 'aghlaq-hsab-albryd-bnk-fatmh-althhby',
    slug: 'aghlaq-hsab-albryd-bnk-fatmh-althhby',
    title: 'الحمــــــــــــــــــــــــــــــــــد لله وحده',
    locale: "ar-MA",
    isActive: true,
    fields: { create: [
      {
        id: 'aghlaq-hsab-albryd-bnk-fatmh-althhby_cin',
        fieldName: 'cin',
        fieldLabel: 'ا',
        fieldLabelAr: 'ا',
        isRequired: true,
        fieldType: 'cin',
      },
    ] }
  }
});