// Prisma seed snippet for template tsryh-balshrf-drajh-naryh
await prisma.documentTemplate.create({
  data: {
    id: 'tsryh-balshrf-drajh-naryh',
    slug: 'tsryh-balshrf-drajh-naryh',
    title: 'تصريح بالشرف',
    locale: "ar-MA",
    isActive: true,
    fields: { create: [
      {
        id: 'tsryh-balshrf-drajh-naryh_cin',
        fieldName: 'cin',
        fieldLabel: 'ت',
        fieldLabelAr: 'ت',
        isRequired: true,
        fieldType: 'cin',
      },
      {
        id: 'tsryh-balshrf-drajh-naryh_signature',
        fieldName: 'signature',
        fieldLabel: 'تصريح بالشرفأنا الموقعة أسفله :السيدة زعيمة بوطويل ، المزدادة في 1963  ، الحاملة للبطاقة الوطنية عدد F311140 و الساكنة بتجزئة تريفة 02 السعيدية  بموجب هذا اشهد على نفسي واصرح بشرفي بان الدراجة النارية الواردة بياناتها اسفله في ملكي BLET CYCLOMOTEUR    النوع                :رقم الاطار الحديدي :  LBFXCBGL8H1117504اللون                 : رماديحرر  للإدلاء به عند الحاجة و الاقتضاء .2017.11.07   السعيدية فيالإمضاء:',
        fieldLabelAr: 'تصريح بالشرفأنا الموقعة أسفله',
        isRequired: true,
        fieldType: 'signature',
      },
    ] }
  }
});