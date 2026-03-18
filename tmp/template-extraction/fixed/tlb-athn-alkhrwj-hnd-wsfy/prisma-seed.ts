// Prisma seed snippet for template tlb-athn-alkhrwj-hnd-wsfy
await prisma.documentTemplate.create({
  data: {
    id: 'tlb-athn-alkhrwj-hnd-wsfy',
    slug: 'tlb-athn-alkhrwj-hnd-wsfy',
    title: 'طلـــــــب',
    locale: "ar-MA",
    isActive: true,
    fields: { create: [
      {
        id: 'tlb-athn-alkhrwj-hnd-wsfy_cin',
        fieldName: 'cin',
        fieldLabel: 'ط',
        fieldLabelAr: 'ط',
        isRequired: true,
        fieldType: 'cin',
      },
    ] }
  }
});