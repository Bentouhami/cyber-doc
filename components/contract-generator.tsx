"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Eye, Send } from "lucide-react"

type ContractFieldType = "text" | "textarea" | "number" | "date" | "select"

interface TemplateField {
  id: string
  name: string
  label: string
  type: ContractFieldType
  required: boolean
  placeholder?: string
  options?: string[]
}

interface ContractTemplate {
  id: string
  name: string
  category: string
  fields: TemplateField[]
}
// 🇲🇦 Morocco-adapted templates (MAD currency, CIN/CNIE, local terminology)
const mockTemplates: ContractTemplate[] = [
  {
    id: "1",
    name: "عقد كراء منزل/شقة (المغرب)",
    category: "عقارات",
    fields: [
      { id: "1", name: "landlordName", label: "اسم المكري (المؤجر)", type: "text", required: true },
      { id: "2", name: "landlordCIN", label: "CIN المكري", type: "text", required: true },
      { id: "3", name: "tenantName", label: "اسم المكتري (المستأجر)", type: "text", required: true },
      { id: "4", name: "tenantCIN", label: "CIN المكتري", type: "text", required: true },
      { id: "5", name: "propertyAddress", label: "عنوان العقار (كامل)", type: "textarea", required: true },
      { id: "6", name: "city", label: "المدينة/الجماعة", type: "text", required: true },
      { id: "7", name: "province", label: "العمالة/الإقليم", type: "text", required: false },
      { id: "8", name: "monthlyRent", label: "السومة الكرائية الشهرية (بالدرهم)", type: "number", required: true },
      { id: "9", name: "deposit", label: "واجب الضمان (بعدد الأشهر)", type: "number", required: false },
      { id: "10", name: "payDay", label: "يوم الأداء من كل شهر", type: "number", required: false },
      { id: "11", name: "startDate", label: "تاريخ بداية العقد", type: "date", required: true },
      { id: "12", name: "duration", label: "مدة العقد (بالأشهر)", type: "number", required: true },
    ],
  },
  {
    id: "2",
    name: "عقد بيع سيارة (المغرب)",
    category: "مركبات",
    fields: [
      { id: "1", name: "sellerName", label: "اسم البائع", type: "text", required: true },
      { id: "2", name: "sellerCIN", label: "CIN البائع", type: "text", required: true },
      { id: "3", name: "buyerName", label: "اسم المشتري", type: "text", required: true },
      { id: "4", name: "buyerCIN", label: "CIN المشتري", type: "text", required: true },
      { id: "5", name: "carBrand", label: "ماركة السيارة", type: "text", required: true },
      { id: "6", name: "carModel", label: "موديل السيارة", type: "text", required: true },
      { id: "7", name: "carYear", label: "سنة الصنع", type: "number", required: true },
      { id: "8", name: "vin", label: "رقم الهيكل (VIN)", type: "text", required: false },
      { id: "9", name: "immatriculation", label: "رقم التسجيل", type: "text", required: true },
      { id: "10", name: "mileage", label: "عداد الكيلومترات", type: "number", required: false },
      { id: "11", name: "fuel", label: "نوع الوقود", type: "select", required: false, options: ["بنزين", "ديزل", "هجين", "كهربائي"] },
      { id: "12", name: "color", label: "اللون", type: "text", required: false },
      { id: "13", name: "salePrice", label: "ثمن البيع (بالدرهم)", type: "number", required: true },
      { id: "14", name: "city", label: "مكان التوقيع (المدينة)", type: "text", required: true },
      { id: "15", name: "date", label: "تاريخ التوقيع", type: "date", required: true },
    ],
  },
  {
    id: "3",
    name: "عقد بيع دراجة نارية (المغرب)",
    category: "مركبات",
    fields: [
      { id: "1", name: "sellerName", label: "اسم البائع", type: "text", required: true },
      { id: "2", name: "sellerCIN", label: "CIN البائع", type: "text", required: true },
      { id: "3", name: "buyerName", label: "اسم المشتري", type: "text", required: true },
      { id: "4", name: "buyerCIN", label: "CIN المشتري", type: "text", required: true },
      { id: "5", name: "bikeBrand", label: "ماركة الدراجة", type: "text", required: true },
      { id: "6", name: "bikeModel", label: "موديل الدراجة", type: "text", required: true },
      { id: "7", name: "engineSize", label: "سعة المحرك (سم³)", type: "number", required: true },
      { id: "8", name: "frameNumber", label: "رقم الهيكل/الإطار", type: "text", required: false },
      { id: "9", name: "immatriculation", label: "رقم التسجيل", type: "text", required: true },
      { id: "10", name: "salePrice", label: "ثمن البيع (بالدرهم)", type: "number", required: true },
      { id: "11", name: "city", label: "مكان التوقيع (المدينة)", type: "text", required: true },
      { id: "12", name: "date", label: "تاريخ التوقيع", type: "date", required: true },
    ],
  },
  {
    id: "4",
    name: "عقد بيع دراجة هوائية (المغرب)",
    category: "مركبات",
    fields: [
      { id: "1", name: "sellerName", label: "اسم البائع", type: "text", required: true },
      { id: "2", name: "buyerName", label: "اسم المشتري", type: "text", required: true },
      { id: "3", name: "bikeBrand", label: "ماركة الدراجة", type: "text", required: true },
      { id: "4", name: "bikeType", label: "نوع الدراجة", type: "select", required: true, options: ["جبلية", "طريق", "هجين", "كهربائية"] },
      { id: "5", name: "bikeSize", label: "مقاس الدراجة", type: "text", required: true },
      { id: "6", name: "salePrice", label: "ثمن البيع (بالدرهم)", type: "number", required: true },
      { id: "7", name: "city", label: "مكان التوقيع (المدينة)", type: "text", required: true },
      { id: "8", name: "date", label: "تاريخ التوقيع", type: "date", required: true },
    ],
  },
]

// Convert Western digits 0-9 to Arabic-Indic ٠-٩ (for display)
const toArabicIndic = (text: string): string => {
  const map: Record<string, string> = {
    "0": "٠", "1": "١", "2": "٢", "3": "٣", "4": "٤",
    "5": "٥", "6": "٦", "7": "٧", "8": "٨", "9": "٩",
  }
  return text.replace(/[0-9]/g, (d) => map[d] || d)
}

const formatDateArMA = (date: Date): string => {
  const d = new Intl.DateTimeFormat("ar-MA", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date)
  return d
}

const formatMoneyMAD = (value: string | number): string => {
  const num = Number(value || 0)
  return new Intl.NumberFormat("ar-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 0 }).format(num)
}

export function ContractGenerator() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [customConditions, setCustomConditions] = useState<string>("")
  const [generatedContract, setGeneratedContract] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)

  const currentTemplate = mockTemplates.find((t) => t.id === selectedTemplate)

  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }))
  }

  const handleGenerateContract = () => {
    if (!currentTemplate) return
    setIsGenerating(true)

    let contractContent = ""

    const city = formData.city || "[المدينة]"
    const today = formatDateArMA(new Date())

    contractContent += `═══════════════════════════════════════════════════════════════\n`
    contractContent += `                    ${currentTemplate.name}\n`
    contractContent += `═══════════════════════════════════════════════════════════════\n\n`

    contractContent += `تاريخ الإنشاء: ${today}\n`
    contractContent += `مكان التحرير: ${city} - المملكة المغربية\n\n`

    if (currentTemplate.id === "1") {
      // Rent
      contractContent += `الطرف الأول (المكري): ${formData.landlordName || "[اسم المكري]"} (CIN: ${formData.landlordCIN || "[CIN]"})\n`
      contractContent += `الطرف الثاني (المكتري): ${formData.tenantName || "[اسم المكتري]"} (CIN: ${formData.tenantCIN || "[CIN]"})\n\n`

      contractContent += `عنوان العقار: ${formData.propertyAddress || "[عنوان العقار]"} — ${city} (${formData.province || "[الإقليم]"})\n`
      contractContent += `السومة الكرائية: ${formatMoneyMAD(formData.monthlyRent || 0)}\n`
      contractContent += `واجب الضمان: ${toArabicIndic(String(formData.deposit || "0"))} شهر\n`
      contractContent += `يوم الأداء: ${toArabicIndic(String(formData.payDay || "[اليوم]"))}\n`
      contractContent += `تاريخ البداية: ${formData.startDate || "[تاريخ البداية]"}\n`
      contractContent += `مدة العقد: ${toArabicIndic(String(formData.duration || "[المدة]"))} شهر\n\n`
    } else if (currentTemplate.id === "2") {
      // Car sale
      contractContent += `البائع: ${formData.sellerName || "[اسم البائع]"} (CIN: ${formData.sellerCIN || "[CIN]"})\n`
      contractContent += `المشتري: ${formData.buyerName || "[اسم المشتري]"} (CIN: ${formData.buyerCIN || "[CIN]"})\n\n`
      contractContent += `الماركة/الموديل: ${formData.carBrand || "[الماركة]"} ${formData.carModel || "[الموديل]"}\n`
      contractContent += `سنة الصنع: ${toArabicIndic(String(formData.carYear || "[السنة]"))}\n`
      contractContent += `VIN: ${formData.vin || "[VIN]"}\n`
      contractContent += `رقم التسجيل: ${formData.immatriculation || "[رقم التسجيل]"}\n`
      contractContent += `العداد: ${toArabicIndic(String(formData.mileage || "[العداد]"))}\n`
      contractContent += `نوع الوقود: ${formData.fuel || "[الوقود]"}\n`
      contractContent += `اللون: ${formData.color || "[اللون]"}\n`
      contractContent += `الثمن: ${formatMoneyMAD(formData.salePrice || 0)}\n\n`
    } else if (currentTemplate.id === "3") {
      // Motorbike sale
      contractContent += `البائع: ${formData.sellerName || "[اسم البائع]"} (CIN: ${formData.sellerCIN || "[CIN]"})\n`
      contractContent += `المشتري: ${formData.buyerName || "[اسم المشتري]"} (CIN: ${formData.buyerCIN || "[CIN]"})\n\n`
      contractContent += `الماركة/الموديل: ${formData.bikeBrand || "[الماركة]"} ${formData.bikeModel || "[الموديل]"}\n`
      contractContent += `سعة المحرك: ${toArabicIndic(String(formData.engineSize || "[سعة]"))} سم³\n`
      contractContent += `رقم الهيكل/الإطار: ${formData.frameNumber || "[الرقم]"}\n`
      contractContent += `رقم التسجيل: ${formData.immatriculation || "[رقم التسجيل]"}\n`
      contractContent += `الثمن: ${formatMoneyMAD(formData.salePrice || 0)}\n\n`
    } else if (currentTemplate.id === "4") {
      // Bicycle sale
      contractContent += `البائع: ${formData.sellerName || "[اسم البائع]"}\n`
      contractContent += `المشتري: ${formData.buyerName || "[اسم المشتري]"}\n\n`
      contractContent += `الماركة: ${formData.bikeBrand || "[الماركة]"}\n`
      contractContent += `النوع: ${formData.bikeType || "[النوع]"}\n`
      contractContent += `المقاس: ${formData.bikeSize || "[المقاس]"}\n`
      contractContent += `الثمن: ${formatMoneyMAD(formData.salePrice || 0)}\n\n`
    }

    contractContent += `═══════════════════════════════════════════════════════════════\n`
    contractContent += `                        الشروط والأحكام\n`
    contractContent += `═══════════════════════════════════════════════════════════════\n\n`

    if (customConditions.trim()) {
      contractContent += `الشروط الخاصة:\n${customConditions}\n\n`
    }

    contractContent += `الشروط العامة:\n`
    contractContent += `1. يلتزم الطرفان بتنفيذ بنود العقد بحسن نية.\n`
    contractContent += `2. أي تعديل يجب أن يكون كتابياً وموقعاً من الطرفين.\n`
    contractContent += `3. في حالة النزاع، تُعتمد المحاكم المختصة بالمملكة المغربية.\n`
    contractContent += `4. يسري العقد ابتداءً من تاريخ التوقيع.\n\n`

    contractContent += `───────────────────────────────────────────────────────────────\n`
    contractContent += `                          إقرار وتوقيع\n`
    contractContent += `───────────────────────────────────────────────────────────────\n\n`
    contractContent += `حُرِّر بهذا بمدينة ${city} بتاريخ ${today}.\n\n`
    contractContent += `الطرف الأول: ________________________    الطرف الثاني: ________________________\n\n`
    contractContent += `التوقيع: ___________________________    التوقيع: ___________________________\n\n`

    contractContent += `═══════════════════════════════════════════════════════════════\n`
    contractContent += `                    انتهى العقد - CYBER SAIDIA\n`
    contractContent += `═══════════════════════════════════════════════════════════════`

    setGeneratedContract(contractContent)
    setIsGenerating(false)
  }

  const handleDownloadContract = () => {
    const blob = new Blob([generatedContract], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `عقد-${selectedTemplate}-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-2xl font-bold text-foreground">مولد العقود (المغرب)</h2>
        <p className="text-muted-foreground">اختر نموذجاً واملأ المعلومات المطلوبة</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-secondary" />
              إعداد العقد
            </CardTitle>
            <CardDescription>اختر نموذجاً واملأ الحقول المطلوبة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="template">نموذج العقد</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نموذجاً" />
                </SelectTrigger>
                <SelectContent>
                  {mockTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{template.name}</span>
                        <Badge variant="outline" className="mr-2">
                          {template.category}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {currentTemplate && (
              <div className="space-y-4 pt-4 border-t border-border">
                <h4 className="font-medium text-foreground">معلومات العقد</h4>
                {currentTemplate.fields.map((field) => (
                  <div key={field.id}>
                    <Label htmlFor={field.name}>
                      {field.label}
                      {field.required && <span className="text-destructive mr-1">*</span>}
                    </Label>
                    {field.type === "select" ? (
                      <Select
                        value={formData[field.name] || ""}
                        onValueChange={(value) => handleFieldChange(field.name, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`اختر ${field.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((option: string) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : field.type === "textarea" ? (
                      <Textarea
                        id={field.name}
                        value={formData[field.name] || ""}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                      />
                    ) : (
                      <Input
                        id={field.name}
                        type={field.type}
                        value={formData[field.name] || ""}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                      />
                    )}
                  </div>
                ))}

                <div className="pt-4 border-t border-border">
                  <Label htmlFor="customConditions">الشروط الخاصة (اختيارية)</Label>
                  <Textarea
                    id="customConditions"
                    value={customConditions}
                    onChange={(e) => setCustomConditions(e.target.value)}
                    placeholder="أضف أي شروط خاصة بهذا العقد..."
                    rows={4}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    يمكنك إضافة شروط خاصة حسب طبيعة الصفقة والأطراف المعنية
                  </p>
                </div>

                <Button
                  onClick={handleGenerateContract}
                  disabled={isGenerating || !selectedTemplate}
                  className="w-full bg-secondary hover:bg-secondary/90"
                >
                  {isGenerating ? "جاري إنشاء العقد..." : "إنشاء العقد"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-chart-3" />
              معاينة العقد
            </CardTitle>
            <CardDescription>معاينة العقد المُنشأ</CardDescription>
          </CardHeader>
          <CardContent>
            {generatedContract ? (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg border max-h-96 overflow-y-auto">
                  <pre className="text-sm text-foreground whitespace-pre-wrap font-mono text-right">
                    {generatedContract}
                  </pre>
                </div>
                <div className="flex space-x-2 rtl:space-x-reverse">
                  <Button onClick={handleDownloadContract} className="flex-1 bg-chart-3 hover:bg-chart-3/90">
                    <Download className="h-4 w-4 ml-2" />
                    تحميل (.txt)
                  </Button>
                  <Button variant="outline" className="flex-1 bg-transparent">
                    <Send className="h-4 w-4 ml-2" />
                    إرسال بالإيميل
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>اختر نموذجاً وأنشئ عقداً لرؤية المعاينة</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}




