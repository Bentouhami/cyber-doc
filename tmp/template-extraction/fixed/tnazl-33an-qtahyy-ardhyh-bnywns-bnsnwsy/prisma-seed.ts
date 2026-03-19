// Prisma seed snippet for template tnazl-33an-qtahyy-ardhyh-bnywns-bnsnwsy
await prisma.documentTemplate.create({
  data: {
    id: 'tnazl-33an-qtahyy-ardhyh-bnywns-bnsnwsy',
    slug: 'tnazl-33an-qtahyy-ardhyh-bnywns-bnsnwsy',
    title: 'تنـــازل',
    locale: "ar-MA",
    isActive: true,
    fields: { create: [
      {
        id: 'tnazl-33an-qtahyy-ardhyh-bnywns-bnsnwsy_cin',
        fieldName: 'cin',
        fieldLabel: 'ت',
        fieldLabelAr: 'ت',
        isRequired: true,
        fieldType: 'cin',
      },
      {
        id: 'tnazl-33an-qtahyy-ardhyh-bnywns-bnsnwsy_date',
        fieldName: 'date',
        fieldLabel: 'تنـــازل الموقع اسفله :السيد عبد الحميد عبروق ،المزداد في 02.06.1963 ،الحامل للبطاقة الوطنية رقم E272274 الساكن بسيدي احمد الشيخ زروق رقم 11 تازة الجديدة اشهد على نفسي واصرح انني اتنازل يومه هذا لفائدة مشغلي شركة LIGNO VERT sarlفي شخص ممثلها القانوني .   وذلك عن المتابعة امام مفتشية الشغل او المحكمة الابتدائية ببركان بعدما وقع التراضي والتفاهم والصلح بيننا وبعدما توصلت بمستحقاتي الخاصة بعملي بالشركة كبستاني بورش الاشغال الخاص بالفندق الكائن بالمحطة السياحية مارينا السعيدية .   وبذلك تكون وضعيتي قد سويت ايزاء مشغلي الذي اقطع معه الصلة حرا من كل التزام حالا ومستقبلا .حرر هذا التنازل للإدلاء به عند الحاجة والاقتضاء.السعيدية في : 2017.11.07الإمضاء:',
        fieldLabelAr: 'تنـــازل الموقع اسفله',
        isRequired: true,
        fieldType: 'date',
      },
      {
        id: 'tnazl-33an-qtahyy-ardhyh-bnywns-bnsnwsy_signature',
        fieldName: 'signature',
        fieldLabel: 'تنـــازل الموقع اسفله :السيد عبد الحميد عبروق ،المزداد في 02.06.1963 ،الحامل للبطاقة الوطنية رقم E272274 الساكن بسيدي احمد الشيخ زروق رقم 11 تازة الجديدة اشهد على نفسي واصرح انني اتنازل يومه هذا لفائدة مشغلي شركة LIGNO VERT sarlفي شخص ممثلها القانوني .   وذلك عن المتابعة امام مفتشية الشغل او المحكمة الابتدائية ببركان بعدما وقع التراضي والتفاهم والصلح بيننا وبعدما توصلت بمستحقاتي الخاصة بعملي بالشركة كبستاني بورش الاشغال الخاص بالفندق الكائن بالمحطة السياحية مارينا السعيدية .   وبذلك تكون وضعيتي قد سويت ايزاء مشغلي الذي اقطع معه الصلة حرا من كل التزام حالا ومستقبلا .حرر هذا التنازل للإدلاء به عند الحاجة والاقتضاء.السعيدية في : 2017.11.07الإمضاء:',
        fieldLabelAr: 'تنـــازل الموقع اسفله',
        isRequired: true,
        fieldType: 'signature',
      },
    ] }
  }
});