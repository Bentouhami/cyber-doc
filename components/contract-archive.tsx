"use client"

import { useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, Eye, Filter, Calendar, FileText } from "lucide-react"

interface ArchivedContract {
  id: string
  name: string
  type: string
  client: string
  createdAt: string // ISO (yyyy-mm-dd) or date-like string
  status: "مُنشأ" | "مُرسل" | "موقع" | "مؤرشف"
  createdBy: string
}

// 🇲🇦 Mock data (dates kept as ISO for proper formatting)
const mockArchivedContracts: ArchivedContract[] = [
  { id: "1", name: "عقد كراء منزل - فاطمة أحمد", type: "عقد كراء منزل/شقة", client: "فاطمة أحمد", createdAt: "2025-01-15", status: "موقع", createdBy: "أحمد محمد" },
  { id: "2", name: "عقد بيع سيارة - محمد علي", type: "عقد بيع سيارة", client: "محمد علي", createdAt: "2025-01-14", status: "مُرسل", createdBy: "أحمد محمد" },
  { id: "3", name: "عقد بيع دراجة نارية - سارة محمود", type: "عقد بيع دراجة نارية", client: "سارة محمود", createdAt: "2025-01-13", status: "موقع", createdBy: "فاطمة علي" },
  { id: "4", name: "عقد بيع دراجة هوائية - خالد حسن", type: "عقد بيع دراجة هوائية", client: "خالد حسن", createdAt: "2025-01-12", status: "مؤرشف", createdBy: "أحمد محمد" },
  { id: "5", name: "عقد كراء شقة - نور الدين", type: "عقد كراء منزل/شقة", client: "نور الدين", createdAt: "2025-01-10", status: "مُنشأ", createdBy: "فاطمة علي" },
  { id: "6", name: "عقد بيع سيارة - رامي قاسم", type: "عقد بيع سيارة", client: "رامي قاسم", createdAt: "2025-01-08", status: "موقع", createdBy: "أحمد محمد" },
]

// Helpers (RTL/Arabic-Morocco)
const toArabicIndic = (text: string): string => {
  const map: Record<string, string> = { "0": "٠", "1": "١", "2": "٢", "3": "٣", "4": "٤", "5": "٥", "6": "٦", "7": "٧", "8": "٨", "9": "٩" }
  return text.replace(/[0-9]/g, (d) => map[d] || d)
}

const formatDateArMA = (value: string): string => {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat("ar-MA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(d)
}

const statusClass = (status: ArchivedContract["status"]) => {
  switch (status) {
    case "موقع":
      return "bg-chart-3/20 text-chart-3"
    case "مُرسل":
      return "bg-chart-2/20 text-chart-2"
    case "مُنشأ":
      return "bg-chart-4/20 text-chart-4"
    case "مؤرشف":
    default:
      return "bg-muted text-muted-foreground"
  }
}

export function ContractArchive() {
  const [contracts] = useState<ArchivedContract[]>(mockArchivedContracts)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const uniqueTypes = useMemo(() => Array.from(new Set(contracts.map((c) => c.type))), [contracts])

  const filteredContracts = useMemo(() => {
    const term = searchTerm.trim()
    return contracts.filter((c) => {
      const matchesSearch = !term || c.name.includes(term) || c.client.includes(term)
      const matchesStatus = statusFilter === "all" || c.status === (statusFilter as ArchivedContract["status"]) 
      const matchesType = typeFilter === "all" || c.type === typeFilter
      return matchesSearch && matchesStatus && matchesType
    })
  }, [contracts, searchTerm, statusFilter, typeFilter])

  const handleDownload = (contract: ArchivedContract) => {
    const payload = JSON.stringify(contract, null, 2)
    const blob = new Blob([payload], { type: "application/json;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${contract.name.replace(/\s+/g, "-")}-${contract.id}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-2xl font-bold text-foreground">أرشيف العقود (المغرب)</h2>
        <p className="text-muted-foreground">استعرض وأدر جميع العقود المُنشأة والمحفوظة</p>
      </div>

      {/* Filters */}
      <Card className="bg-card shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="البحث بالاسم أو العميل..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pr-10" />
              </div>
            </div>
            <div className="flex gap-2 rtl:space-x-reverse">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="مُنشأ">مُنشأ</SelectItem>
                  <SelectItem value="مُرسل">مُرسل</SelectItem>
                  <SelectItem value="موقع">موقع</SelectItem>
                  <SelectItem value="مؤرشف">مؤرشف</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  {uniqueTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          تم العثور على {toArabicIndic(String(filteredContracts.length))} عقد
        </p>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">المرشحات النشطة</span>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {filteredContracts.map((contract) => (
          <Card key={contract.id} className="bg-card shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                  <div className="p-2 bg-secondary/20 rounded-lg">
                    <FileText className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{contract.name}</h3>
                    <p className="text-sm text-muted-foreground">{contract.type}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDateArMA(contract.createdAt)}
                      </span>
                      <span>بواسطة {contract.createdBy}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                  <Badge className={statusClass(contract.status)}>{contract.status}</Badge>
                  <div className="flex space-x-2 rtl:space-x-reverse">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 ml-1" />
                      عرض
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownload(contract)}>
                      <Download className="h-4 w-4 ml-1" />
                      تحميل JSON
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredContracts.length === 0 && (
        <Card className="bg-card shadow-sm">
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium text-foreground mb-2">لم يتم العثور على عقود</h3>
            <p className="text-muted-foreground">لا توجد عقود تطابق معايير البحث الخاصة بك.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
