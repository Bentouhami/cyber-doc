// Prisma seed snippet for template ashhad-skn-zhyr-hsayny
await prisma.documentTemplate.create({
  data: {
    id: 'ashhad-skn-zhyr-hsayny',
    slug: 'ashhad-skn-zhyr-hsayny',
    title: 'تصريـــح بالشرف',
    locale: "ar-MA",
    isActive: true,
    fields: { create: [
      {
        id: 'ashhad-skn-zhyr-hsayny_cin',
        fieldName: 'cin',
        fieldLabel: 'ت',
        fieldLabelAr: 'ت',
        isRequired: true,
        fieldType: 'cin',
      },
      {
        id: 'ashhad-skn-zhyr-hsayny_signature',
        fieldName: 'signature',
        fieldLabel: 'تصريـــح بالشرفأنا الموقع أسفله :السيد                             : الزاهر الحسينالحامل للبطاقة الوطنية رقم     : S150859 العنوان                            : تجزئة الوحدة رقم 584  السعيدية.بموجب هذا اشهد على نفسي وأصرح بشرفي بأن السيدة سكينة عنصاري، الحاملة للبطاقة الوطنية رقم S786893 ، تقطن معي بمنزلي الكائن بالعنوان اعلاه لاكثر من ستة شهور. حررت هذا التصريح للإدلاء به عند الحاجة و الاقتضاء .السعيدية في 2017.09.12الإمضاء:',
        fieldLabelAr: 'تصريـــح بالشرفأنا الموقع أسفله',
        isRequired: true,
        fieldType: 'signature',
      },
      {
        id: 'ashhad-skn-zhyr-hsayny_address',
        fieldName: 'address',
        fieldLabel: 'تصريـــح بالشرفأنا الموقع أسفله :السيد                             : الزاهر الحسينالحامل للبطاقة الوطنية رقم     : S150859 العنوان                            : تجزئة الوحدة رقم 584  السعيدية.بموجب هذا اشهد على نفسي وأصرح بشرفي بأن السيدة سكينة عنصاري، الحاملة للبطاقة الوطنية رقم S786893 ، تقطن معي بمنزلي الكائن بالعنوان اعلاه لاكثر من ستة شهور. حررت هذا التصريح للإدلاء به عند الحاجة و الاقتضاء .السعيدية في 2017.09.12الإمضاء:',
        fieldLabelAr: 'تصريـــح بالشرفأنا الموقع أسفله',
        isRequired: false,
        fieldType: 'multiline',
      },
    ] }
  }
});