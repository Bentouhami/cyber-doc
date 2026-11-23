"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { useLocale } from "@/hooks/use-locale"
import { signIn } from "@/lib/auth-client"
import { safeInternalRedirect } from "@/lib/safe-redirect"

type LoginValues = {
  identifier: string
  password: string
  rememberMe?: boolean
}

type LoginFormProps = {
  callbackUrl?: string
  onSuccess?: () => void
}

export function LoginForm({ callbackUrl, onSuccess }: LoginFormProps = {}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { t, dir } = useLocale()
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)

  const resolvedCallback = safeInternalRedirect(
    callbackUrl ??
      searchParams?.get("callbackUrl") ??
      searchParams?.get("redirectTo") ??
      searchParams?.get("from"),
  )

  const loginSchema = useMemo(
    () =>
      z.object({
        identifier: z
          .string()
          .trim()
          .min(1, t("auth.login.validation.identifierRequired"))
          .max(254, t("auth.login.validation.identifierMax")),
        password: z.string().min(1, t("auth.login.validation.passwordRequired")),
        rememberMe: z.boolean().optional(),
      }),
    [t],
  )

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
      rememberMe: false,
    },
  })

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null)
    startTransition(async () => {
      try {
        const credentials = {
          password: values.password,
          rememberMe: !!values.rememberMe,
        }
        const { data, error } = values.identifier.includes("@")
          ? await signIn.email({ email: values.identifier.toLowerCase(), ...credentials })
          : await signIn.username({ username: values.identifier.toLowerCase(), ...credentials })

        if (error) {
          const message = t("auth.login.errors.invalidCredentials")
          setFormError(message)
          toast({ title: t("auth.login.errors.title"), description: message, variant: "destructive" })
          return
        }

        const nextUrl = safeInternalRedirect(data?.url, resolvedCallback)
        router.replace(nextUrl)
        router.refresh()
        onSuccess?.()
      } catch {
        const fallbackMessage = t("auth.login.errors.generic")
        setFormError(fallbackMessage)
        toast({ title: t("auth.login.errors.title"), description: fallbackMessage, variant: "destructive" })
      }
    })
  })

  return (
    <Card className="border-border/50 shadow-lg" dir={dir}>
      <CardHeader className="space-y-3 text-center">
        <CardTitle className="text-3xl font-bold tracking-tight">{t("auth.login.title")}</CardTitle>
        <CardDescription className="text-base">{t("auth.login.description")}</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form className="space-y-5" onSubmit={onSubmit}>
            <FormField
              control={form.control}
              name="identifier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">{t("auth.login.identifier")}</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      autoComplete="username"
                      placeholder={t("auth.login.identifierPlaceholder")}
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">{t("auth.login.password")}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder={t("auth.login.passwordPlaceholder")}
                        className="h-11 pr-10"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                        aria-label={showPassword ? t("auth.login.hidePassword") : t("auth.login.showPassword")}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center">
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={Boolean(field.value)}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal">{t("auth.login.rememberMe")}</FormLabel>
                  </FormItem>
                )}
              />

            </div>

            {formError ? (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{formError}</div>
            ) : null}

            <Button type="submit" className="h-11 w-full text-base font-medium" disabled={isPending}>
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {t("auth.login.pending")}
                </span>
              ) : (
                t("auth.login.submit")
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default LoginForm
