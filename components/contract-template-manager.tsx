"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Settings } from "lucide-react"

interface ContractTemplate {
  id: string
  name: string
  description: string
  category: string
  fields: TemplateField[]
  content: string
  createdAt: string
  isActive: boolean
}

interface TemplateField {
  id: string
  name: string
  label: string
  type: "text" | "number" | "date" | "select" | "textarea"
  required: boolean
  options?: string[]
  placeholder?: string
}

// 🇲🇦 Mock templates adapted for Morocco (currency: MAD, IDs: CIN/CNIE, local terms)
const mockTemplates: ContractTemplate[] = [
  {
    id: "1",
    name: "عقد كراء منزل/شقة (المغرب)",
    description: "نموذج قياسي وفق العرف الجاري للمكترين والمؤجرين في المغرب.",
    category: "عقارات",
    fields: [
      { id: "1", name: "landlordName", label: "اسم المكري (المؤجر)", type: "text", required: true },
      { id: "2", name: "landlordCIN", label: "رقم البطاقة الوطنية للمكري (CIN)", type: "text", required: true },
      { id: "3", name: "tenantName", label: "اسم المكتري (المستأجر)", type: "text", required: true },
      { id: "4", name: "tenantCIN", label: "رقم البطاقة الوطنية للمكتري (CIN)", type: "text", required: true },
      { id: "5", name: "propertyAddress", label: "عنوان العقار (الكامل)", type: "textarea", required: true },
      { id: "6", name: "city", label: "المدينة/الجماعة", type: "text", required: true },
      { id: "7", name: "province", label: "العمالة/الإقليم", type: "text", required: false },
      { id: "8", name: "monthlyRent", label: "السومة الكرائية الشهرية (بالدرهم)", type: "number", required: true },
      { id: "9", name: "deposit", label: "واجب الضمان (شهر/شهران)", type: "number", required: false, placeholder: "مثال: 1" },
      { id: "10", name: "payDay", label: "يوم الأداء من كل شهر", type: "number", required: false, placeholder: "مثال: 5" },
      { id: "11", name: "startDate", label: "تاريخ بداية العقد", type: "date", required: true },
      { id: "12", name: "duration", label: "مدة العقد (بالأشهر)", type: "number", required: true },
      { id: "13", name: "utilities", label: "المصاريف (ماء/كهرباء/شركات التسيير)", type: "textarea", required: false },
      { id: "14", name: "witnesses", label: "الشهود (اختياري)", type: "textarea", required: false, placeholder: "الاسم الكامل + CIN" },
    ],
    content:
      "عقد كراء\n\nبين الموقعين أدناه:\nالمكري: {{landlordName}}\nرقم البطاقة الوطنية: {{landlordCIN}}\nالمكتري: {{tenantName}}\nرقم البطاقة الوطنية: {{tenantCIN}}\n\nعنوان المحل: {{propertyAddress}} - {{city}} ({{province}})\nالسومة الكرائية الشهرية: {{monthlyRent}} درهم مغربي (MAD)\nواجب الضمان: {{deposit}} شهر\nيوم الأداء: اليوم {{payDay}} من كل شهر\nتاريخ البداية: {{startDate}}\nمدة العقد: {{duration}} شهر\n\nالمصاريف: {{utilities}}\nالشهود: {{witnesses}}\n\nبنود عامة: احترام الاستعمال السكني، عدم التنازل إلا بإذن كتابي، إصلاحات الاستعمال على المكتري، وفواتير الماء والكهرباء على المكتري ما لم يتفق خلاف ذلك...\n\nحرر بــــ {{city}} في تاريخ: {{startDate}}.",
    createdAt: "2025-09-14",
    isActive: true,
  },
  {
    id: "2",
    name: "عقد بيع سيارة (المغرب)",
    description: "نموذج مبسط لبيع مركبة وفق الاستعمال الجاري (قبل إجراءات مركز تسجيل السيارات).",
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
      { id: "9", name: "immatriculation", label: "رقم التسجيل (الترقيم)", type: "text", required: true },
      { id: "10", name: "mileage", label: "عداد الكيلومترات", type: "number", required: false },
      { id: "11", name: "fuel", label: "نوع الوقود", type: "select", required: false, options: ["بنزين", "ديزل", "هجين", "كهربائي"] },
      { id: "12", name: "color", label: "اللون", type: "text", required: false },
      { id: "13", name: "salePrice", label: "ثمن البيع (بالدرهم)", type: "number", required: true },
      { id: "14", name: "city", label: "مكان التوقيع (المدينة)", type: "text", required: true },
      { id: "15", name: "date", label: "تاريخ التوقيع", type: "date", required: true },
    ],
    content:
      "عقد بيع سيارة\n\nالبائع: {{sellerName}} (CIN: {{sellerCIN}})\nالمشتري: {{buyerName}} (CIN: {{buyerCIN}})\n\nبيانات المركبة:\nالماركة/الموديل: {{carBrand}} {{carModel}}\nسنة الصنع: {{carYear}}\nرقم الهيكل (VIN): {{vin}}\nرقم التسجيل: {{immatriculation}}\nعداد الكيلومترات: {{mileage}}\nنوع الوقود: {{fuel}}\nاللون: {{color}}\n\nالثمن الإجمالي: {{salePrice}} درهم مغربي (MAD)\n\nيقر البائع بملكيته للمركبة وخلوها من أي نزاع أو رهن قدر الإمكان، ويقر المشتري بمعاينته للمركبة على حالتها.\n\nحرر بـ {{city}} بتاريخ {{date}}، والتوقيع من الطرفين والشهود إن وُجدوا.",
    createdAt: "2025-09-14",
    isActive: true,
  },
  {
    id: "3",
    name: "عقد بيع دراجة نارية (المغرب)",
    description: "نموذج لبيع دراجة نارية مع الحقول المتداولة محلياً.",
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
    content:
      "عقد بيع دراجة نارية\n\nالبائع: {{sellerName}} (CIN: {{sellerCIN}})\nالمشتري: {{buyerName}} (CIN: {{buyerCIN}})\n\nبيانات الدراجة:\nالماركة/الموديل: {{bikeBrand}} {{bikeModel}}\nسعة المحرك: {{engineSize}} سم³\nرقم الهيكل/الإطار: {{frameNumber}}\nرقم التسجيل: {{immatriculation}}\n\nالثمن: {{salePrice}} درهم مغربي (MAD)\n\nيقر الطرفان بصحة المعطيات وبإتمام البيع بالتراضي.\n\nحرر بـ {{city}} بتاريخ {{date}}.",
    createdAt: "2025-09-14",
    isActive: true,
  },
]

export function ContractTemplateManager() {
  const [templates, setTemplates] = useState<ContractTemplate[]>(mockTemplates)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null)
  const [newTemplate, setNewTemplate] = useState<Partial<ContractTemplate>>({
    name: "",
    description: "",
    category: "",
    fields: [],
    content: "",
    isActive: true,
  })

  const handleCreateTemplate = () => {
    if (newTemplate.name && newTemplate.description && newTemplate.category) {
      const template: ContractTemplate = {
        id: Date.now().toString(),
        name: newTemplate.name!,
        description: newTemplate.description!,
        category: newTemplate.category!,
        fields: newTemplate.fields || [],
        content: newTemplate.content || "",
        createdAt: new Date().toISOString().split("T")[0],
        isActive: true,
      }
      setTemplates([...templates, template])
      setNewTemplate({ name: "", description: "", category: "", fields: [], content: "", isActive: true })
      setIsCreateDialogOpen(false)
    }
  }

  const handleDeleteTemplate = (id: string) => {
    setTemplates(templates.filter((t) => t.id !== id))
  }

  const toggleTemplateStatus = (id: string) => {
    setTemplates(templates.map((t) => (t.id === id ? { ...t, isActive: !t.isActive } : t)))
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">إدارة النماذج</h2>
          <p className="text-muted-foreground">إنشاء وإدارة نماذج العقود (مهيأة للمغرب)</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-secondary hover:bg-secondary/90">
              <Plus className="h-4 w-4 ml-2" />
              نموذج جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>إنشاء نموذج جديد</DialogTitle>
              <DialogDescription>حدد المعلومات الأساسية لنموذج العقد</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">اسم النموذج</Label>
                  <Input
                    id="name"
                    value={newTemplate.name || ""}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    placeholder="مثال: عقد كراء منزل"
                  />
                </div>
                <div>
                  <Label htmlFor="category">الفئة</Label>
                  <Select
                    value={newTemplate.category || ""}
                    onValueChange={(value) => setNewTemplate({ ...newTemplate, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر فئة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="عقارات">عقارات</SelectItem>
                      <SelectItem value="مركبات">مركبات</SelectItem>
                      <SelectItem value="تجاري">تجاري</SelectItem>
                      <SelectItem value="خدمات">خدمات</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">الوصف</Label>
                <Textarea
                  id="description"
                  value={newTemplate.description || ""}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  placeholder="وصف نموذج العقد"
                />
              </div>
              <div>
                <Label htmlFor="content">محتوى النموذج</Label>
                <Textarea
                  id="content"
                  value={newTemplate.content || ""}
                  onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                  placeholder="استخدم {{اسم_الحقل}} للمتغيرات الديناميكية"
                  rows={6}
                />
              </div>
              <div className="flex justify-end space-x-2 rtl:space-x-reverse">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleCreateTemplate} className="bg-secondary hover:bg-secondary/90">
                  إنشاء النموذج
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="bg-card shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg text-foreground">{template.name}</CardTitle>
                  <CardDescription className="mt-1">{template.description}</CardDescription>
                </div>
                <Badge variant={template.isActive ? "default" : "secondary"}>
                  {template.isActive ? "نشط" : "غير نشط"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">الفئة:</span>
                  <Badge variant="outline">{template.category}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">الحقول:</span>
                  <span className="font-medium">{template.fields.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">تاريخ الإنشاء:</span>
                  <span>{template.createdAt}</span>
                </div>
                <div className="flex space-x-2 rtl:space-x-reverse pt-2">
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={() => setEditingTemplate(template)}>
                    <Edit className="h-4 w-4 ml-1" />
                    تعديل
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toggleTemplateStatus(template.id)}>
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* TODO: add an Edit dialog using `editingTemplate` if needed */}
    </div>
  )
}
