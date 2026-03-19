"use client"

import { Suspense, useEffect } from "react"
import { Shield, FileText, Lock } from "lucide-react"
import { useRouter } from "next/navigation"
import LoginForm from '@/components/auth/login';
import { EmployeeHeader } from "@/components/layout/employee-header"
import { EmployeeFooter } from "@/components/layout/employee-footer"
import { useLocale } from "@/hooks/use-locale"
import { useSession } from "@/lib/auth-client"
import { useUserProfile } from "@/components/providers/user-profile-provider"

function LoginFormWithSearchParams() {
  return <LoginForm />
}

export default function HomePage() {
  const { dir } = useLocale()
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const { user: profile, status: profileStatus } = useUserProfile()

  useEffect(() => {
    if (isPending || !session?.user?.email) {
      return
    }

    if (profileStatus === "loading" || profileStatus === "idle") {
      return
    }

    const isAdmin = profile?.roles?.some((role) => role.name === "admin")
    const target = isAdmin ? "/admin/templates" : "/documents"
    router.replace(target)
  }, [isPending, profile, profileStatus, router, session?.user?.email])

  return (
    <main className="flex min-h-dvh flex-col bg-background" dir={dir}>
      <EmployeeHeader />
      <div className="grid flex-1 lg:grid-cols-2">
        {/* Left side - Hero content */}
        <section className="relative flex items-center justify-center bg-primary px-6 py-12 text-primary-foreground lg:px-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.05),transparent_50%)]" />

          <div className="relative z-10 w-full max-w-xl space-y-8 text-right">
            {/* Logo/Brand */}
            <div className="flex items-center justify-end gap-3">
              <h2 className="text-2xl font-bold tracking-tight">سايبر دوك</h2>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-foreground/10 backdrop-blur-sm">
                <Shield className="h-6 w-6" />
              </div>
            </div>

            {/* Main heading */}
            <div className="space-y-4">
              <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                إدارة العقود القانونية بثقة وسهولة
              </h1>
              <p className="text-pretty text-lg leading-relaxed text-primary-foreground/80 sm:text-xl">
                منصة متكاملة لإنشاء وإدارة ومتابعة جميع عقودك القانونية في مكان واحد آمن
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold">إنشاء مستندات احترافية</h3>
                  <p className="text-sm text-primary-foreground/70">
                    قوالب قانونية متوافقة مع المعايير المحلية والدولية
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10">
                  <Lock className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold">أمان وخصوصية عالية</h3>
                  <p className="text-sm text-primary-foreground/70">تشفير متقدم وحماية كاملة لبياناتك الحساسة</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right side - Login form */}
        <section className="flex items-center justify-center bg-secondary/30 px-6 py-12">
          <div className="w-full max-w-md">
            <Suspense
              fallback={
                <div className="flex h-96 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              }
            >
              <LoginFormWithSearchParams />
            </Suspense>
          </div>
        </section>
      </div>
      <EmployeeFooter />
    </main>
  )
}
