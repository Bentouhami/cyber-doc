// Prisma seed snippet for template altzam-tswyh-wdhayh-drajh-naryh
await prisma.documentTemplate.create({
  data: {
    id: 'altzam-tswyh-wdhayh-drajh-naryh',
    slug: 'altzam-tswyh-wdhayh-drajh-naryh',
    title: 'التــــــــــزام',
    locale: 'ar-MA',
    isActive: true,
    fields: { create: [
      {
        id: 'altzam-tswyh-wdhayh-drajh-naryh_cin',
        fieldName: 'cin',
        fieldLabel: 'ا',
        fieldLabelAr: 'ا',
        isRequired: true,
        fieldType: 'cin',
      },
      {
        id: 'altzam-tswyh-wdhayh-drajh-naryh_signature',
        fieldName: 'signature',
        fieldLabel: 'التــــــــــزام أنا الموقعة أسفله :السيدة زعيمة بوطويل ، المزدادة في 1963  ، الحاملة للبطاقة الوطنية عدد F311140 و الساكنة بتجزئة تريفة 02 السعيدية  بموجب هذا اشهد على نفسي واصرح بشرفي بانني ساقوم بتسوية جميع الوثائق اللازمة لتثبيت لوحة رقم التسجيل بخصوص دراجتي النارية الحاملة للبيانات التالية خلال هذا الاسبوع .BLET CYCLOMOTEUR    النوع                :رقم الاطار الحديدي :  LBFXCBGL8H1117504اللون                 : رماديحررت هذا التصريح للإدلاء به عند الحاجة و الاقتضاء .2017.11.07   السعيدية فيالإمضاء:',
        fieldLabelAr: 'التــــــــــزام أنا الموقعة أسفله :السيدة زعيمة بوطويل ، المزدادة في 1963  ، الحاملة للبطاقة الوطنية عدد F311140 و الساكنة بتجزئة تريفة 02 السعيدية  بموجب هذا اشهد على نفسي واصرح بشرفي بانني ساقوم بتسوية جميع الوثائق اللازمة لتثبيت لوحة رقم التسجيل بخصوص دراجتي النارية الحاملة للبيانات التالية خلال هذا الاسبوع .BLET CYCLOMOTEUR    النوع                :رقم الاطار الحديدي :  LBFXCBGL8H1117504اللون                 : رماديحررت هذا التصريح للإدلاء به عند الحاجة و الاقتضاء .2017.11.07   السعيدية فيالإمضاء:',
        isRequired: true,
        fieldType: 'signature',
      },
    ] }
  }
});