import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono, Tajawal } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { I18nProvider } from "@/components/providers/i18n-provider"
import { UserProfileProvider } from "@/components/providers/user-profile-provider"
import "./globals.css"
import { Suspense } from "react"

const geist = Geist({ subsets: ["latin"] })
const geistMono = Geist_Mono({ subsets: ["latin"] })
const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  variable: "--font-tajawal",
})

export const metadata: Metadata = {
  title: "CyberDoc - نظام إدارة الوثائق",
  description: "نظام متكامل لإدارة الوثائق الإلكترونية للمقاهي الإلكترونية في المغرب",
  generator: "v0.app",
}

import { cookies } from "next/headers"

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const lang = cookieStore.get("cyberdoc_lang")?.value || "fr"
  const dir = lang === "ar" ? "rtl" : "ltr"

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <body className={`${geist.className} ${tajawal.variable} font-sans antialiased`}>
        <I18nProvider initialLanguage={lang}>
          <UserProfileProvider>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
              <Suspense fallback={null}>{children}</Suspense>
            </ThemeProvider>
          </UserProfileProvider>
        </I18nProvider>
        <Analytics />
      </body>
    </html>
  )
}
