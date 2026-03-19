"use client"

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText } from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  role: "admin" | "employee"
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const mockUsers: User[] = [
  { id: "1", name: "أحمد محمد", email: "admin@cybercafe.com", role: "admin" },
  { id: "2", name: "فاطمة علي", email: "employee@cybercafe.com", role: "employee" },
]

function readStoredUser(): User | null {
  if (typeof window === "undefined") {
    return null
  }

  const storedUser = window.localStorage.getItem("user")
  if (!storedUser) {
    return null
  }

  try {
    return JSON.parse(storedUser) as User
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readStoredUser())
  const isClientReady = typeof window !== "undefined"

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const foundUser = mockUsers.find((u) => u.email === email)
    if (foundUser && password === "123456") {
      setUser(foundUser)
      if (typeof window !== "undefined") {
        window.localStorage.setItem("user", JSON.stringify(foundUser))
      }
      return true
    }
    return false
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("user")
    }
  }, [])

  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      login,
      logout,
      isLoading: !isClientReady,
    }),
    [isClientReady, login, logout, user],
  )

  if (!isClientReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-secondary mx-auto mb-4" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm onLogin={login} />
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

function LoginForm({ onLogin }: { onLogin: (email: string, password: string) => Promise<boolean> }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const success = await onLogin(email, password)
    if (!success) {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة")
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <FileText className="h-12 w-12 text-secondary" />
          </div>
          <CardTitle className="text-2xl">سايبر صيدا</CardTitle>
          <CardDescription>نظام إدارة العقود</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@cybercafe.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="123456"
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>
          </form>
          <div className="mt-4 text-sm text-muted-foreground text-center">
            <p>حسابات تجريبية:</p>
            <p>مدير: admin@cybercafe.com / 123456</p>
            <p>موظف: employee@cybercafe.com / 123456</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
