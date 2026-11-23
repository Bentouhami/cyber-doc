import type React from "react"
import { Suspense } from "react"
import type { Metadata } from "next"
import { headers } from "next/headers"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"

import { ThemeProvider } from "@/components/theme-provider"
import { I18nProvider } from "@/components/providers/i18n-provider"
import { UserProfileProvider } from "@/components/providers/user-profile-provider"
import { getServerLocale } from "@/lib/server-locale"

import "./globals.css"

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLocale()
  return lang === "ar"
    ? {
        title: "سايبر دوك — إدارة الوثائق",
        description: "نظام لإدارة الوثائق الإدارية والقانونية وخدمات الزبائن.",
      }
    : {
        title: "CyberDoc — Gestion documentaire",
        description: "Système de gestion des documents administratifs, juridiques et des services clients.",
      }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const lang = await getServerLocale()
  const dir = lang === "ar" ? "rtl" : "ltr"
  const nonce = (await headers()).get("x-nonce") ?? undefined

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
        <I18nProvider initialLanguage={lang}>
          <UserProfileProvider>
            <ThemeProvider nonce={nonce} attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
              <Suspense fallback={null}>{children}</Suspense>
            </ThemeProvider>
          </UserProfileProvider>
        </I18nProvider>
        <Analytics />
      </body>
    </html>
  )
}
