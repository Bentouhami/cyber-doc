// Prisma seed snippet for template aatraf-bdyn-alzrwaly
await prisma.documentTemplate.create({
  data: {
    id: 'aatraf-bdyn-alzrwaly',
    slug: 'aatraf-bdyn-alzrwaly',
    title: 'اعتـــــــــراف بديــن',
    locale: "ar-MA",
    isActive: true,
    fields: { create: [
      {
        id: 'aatraf-bdyn-alzrwaly_cin',
        fieldName: 'cin',
        fieldLabel: 'ا',
        fieldLabelAr: 'ا',
        isRequired: true,
        fieldType: 'cin',
      },
      {
        id: 'aatraf-bdyn-alzrwaly_amount',
        fieldName: 'amount',
        fieldLabel: 'اعتـــــــــراف بديــنأنا الموقع أسفله:زروالي محمد، مغربي الجنسية، و الحامل لبطاقة التعريف الوطنية رقم: FE12477.اعترف و أشهد على نفسي بأنني مدين السيد جمال مضروني، حامل لبطاقة التعريف الوطنية رقم: S839508، و ذلك في دين ناتج على استغلال لغرفة في فندق HOTEL  NEWYORL COMIPY   و المبلغ هو: 10500.0 gى استغلال لغرفة في فندق لوطنية رقم: 0 درهم (عشرة الف و خمس مئة درهم)، و أشهد بأنني سوف اسدده في أجل أقصاه 2017.12.20.الإمضاء.',
        fieldLabelAr: 'اعتـــــــــراف بديــنأنا الموقع أسفله',
        isRequired: true,
        fieldType: 'amount',
      },
      {
        id: 'aatraf-bdyn-alzrwaly_signature',
        fieldName: 'signature',
        fieldLabel: 'اعتـــــــــراف بديــنأنا الموقع أسفله:زروالي محمد، مغربي الجنسية، و الحامل لبطاقة التعريف الوطنية رقم: FE12477.اعترف و أشهد على نفسي بأنني مدين السيد جمال مضروني، حامل لبطاقة التعريف الوطنية رقم: S839508، و ذلك في دين ناتج على استغلال لغرفة في فندق HOTEL  NEWYORL COMIPY   و المبلغ هو: 10500.0 gى استغلال لغرفة في فندق لوطنية رقم: 0 درهم (عشرة الف و خمس مئة درهم)، و أشهد بأنني سوف اسدده في أجل أقصاه 2017.12.20.الإمضاء.',
        fieldLabelAr: 'اعتـــــــــراف بديــنأنا الموقع أسفله',
        isRequired: true,
        fieldType: 'signature',
      },
    ] }
  }
});