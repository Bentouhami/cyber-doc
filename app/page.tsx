"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Users, Settings, Archive, Plus, Moon, Sun, LogOut } from "lucide-react"
import { useTheme } from "next-themes"
import { ContractTemplateManager } from "@/components/contract-template-manager"
import { ContractGenerator } from "@/components/contract-generator"
import { ContractArchive } from "@/components/contract-archive"
import { AuthProvider, useAuth } from "@/components/auth-provider"

const mockUser = {
  id: "1",
  name: "أحمد محمد",
  email: "ahmed.mohamed@cybercafe.com",
  role: "admin" as "admin" | "user",
}

function Dashboard() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState("dashboard")

  const stats = [
    { title: "العقود المُنشأة", value: "24", icon: FileText, color: "text-secondary" },
    { title: "النماذج النشطة", value: "5", icon: Settings, color: "text-chart-3" },
    { title: "قيد المراجعة", value: "3", icon: Users, color: "text-chart-4" },
    { title: "الأرشيف", value: "156", icon: Archive, color: "text-muted-foreground" },
  ]

  const recentActivity = [
    { type: "عقد إيجار منزل", client: "فاطمة أحمد", date: "2024-01-15", status: "مُنشأ" },
    { type: "عقد بيع سيارة", client: "محمد علي", date: "2024-01-14", status: "قيد المراجعة" },
    { type: "عقد بيع دراجة نارية", client: "سارة محمود", date: "2024-01-13", status: "مكتمل" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <FileText className="h-8 w-8 text-secondary" />
                <h1 className="text-xl font-bold text-foreground">سايبر صيدا - إدارة العقود</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
              <Badge variant="outline" className="text-sm">
                {user?.role === "admin" ? "مدير" : "مستخدم"}
              </Badge>
              <div className="text-sm text-muted-foreground">{user?.name}</div>
              <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-fit lg:grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              لوحة التحكم
            </TabsTrigger>
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              إنشاء عقد
            </TabsTrigger>
            {user?.role === "admin" && (
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                إدارة النماذج
              </TabsTrigger>
            )}
            <TabsTrigger value="archive" className="flex items-center gap-2">
              <Archive className="h-4 w-4" />
              الأرشيف
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <Card key={index} className="bg-card shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                        <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                      </div>
                      <stat.icon className={`h-8 w-8 ${stat.color}`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground">النشاط الأخير</CardTitle>
                <CardDescription>آخر العقود المُنشأة والإجراءات المتخذة</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center space-x-4 rtl:space-x-reverse">
                        <FileText className="h-5 w-5 text-secondary" />
                        <div>
                          <p className="font-medium text-foreground">{activity.type}</p>
                          <p className="text-sm text-muted-foreground">{activity.client}</p>
                        </div>
                      </div>
                      <div className="text-right rtl:text-left">
                        <Badge variant={activity.status === "مكتمل" ? "default" : "secondary"}>{activity.status}</Badge>
                        <p className="text-sm text-muted-foreground mt-1">{activity.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="generate">
            <ContractGenerator userRole={user?.role || "user"} />
          </TabsContent>

          {user?.role === "admin" && (
            <TabsContent value="templates">
              <ContractTemplateManager />
            </TabsContent>
          )}

          <TabsContent value="archive">
            <ContractArchive />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default function ContractManagementApp() {
  return (
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  )
}
