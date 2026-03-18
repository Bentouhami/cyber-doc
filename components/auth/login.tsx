"use client"

import { useState, useTransition } from "react"
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
import { signIn } from "@/lib/auth-client"

const loginSchema = z.object({
  email: z
    .string({ required_error: "L'adresse e-mail est obligatoire." })
    .email("Veuillez saisir une adresse e-mail valide."),
  password: z.string({ required_error: "Le mot de passe est obligatoire." }).min(1, "Le mot de passe est obligatoire."),
  rememberMe: z.boolean().optional(),
})

type LoginValues = z.infer<typeof loginSchema>

type LoginFormProps = {
  callbackUrl?: string
  onSuccess?: () => void
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
  "Invalid credentials.": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
  Configuration: "خطأ في إعدادات المصادقة. تأكد من تكوين الخادم بشكل صحيح.",
}

export function LoginForm({ callbackUrl, onSuccess }: LoginFormProps = {}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)

  const resolvedCallback =
    callbackUrl ??
    searchParams?.get("callbackUrl") ??
    searchParams?.get("redirectTo") ??
    searchParams?.get("from") ??
    "/documents"

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  })

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null)
    startTransition(async () => {
      try {
        const { data, error } = await signIn.email({
          email: values.email,
          password: values.password,
          rememberMe: !!values.rememberMe,
        })

        if (error) {
          const message =
            (error.code && AUTH_ERROR_MESSAGES[error.code as keyof typeof AUTH_ERROR_MESSAGES]) ??
            error.message ??
            "تعذر تسجيل الدخول، يرجى التحقق من البيانات المدخلة."
          setFormError(message)
          toast({ title: "تعذر تسجيل الدخول", description: message, variant: "destructive" })
          return
        }

        const nextUrl = data?.url ?? resolvedCallback ?? "/"
        router.replace(nextUrl)
        router.refresh()
        onSuccess?.()
      } catch (error) {
        const fallbackMessage =
          error instanceof Error
            ? error.message
            : "حدث خطأ غير متوقع أثناء محاولة تسجيل الدخول."
        setFormError(fallbackMessage)
        toast({ title: "تعذر تسجيل الدخول", description: fallbackMessage, variant: "destructive" })
      }
    })
  })

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader className="space-y-3 text-center">
        <CardTitle className="text-3xl font-bold tracking-tight">Connexion</CardTitle>
        <CardDescription className="text-base">Accédez à votre espace CyberDoc</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form className="space-y-5" onSubmit={onSubmit}>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Adresse e-mail</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="vous@exemple.com"
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
                  <FormLabel className="text-sm font-medium">Mot de passe</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="Votre mot de passe"
                        className="h-11 pr-10"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between">
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
                    <FormLabel className="text-sm font-normal">Se souvenir de moi</FormLabel>
                  </FormItem>
                )}
              />

              <Button type="button" variant="link" className="h-auto p-0 text-sm font-normal">
                Mot de passe oublié ?
              </Button>
            </div>

            {formError ? (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{formError}</div>
            ) : null}

            <Button type="submit" className="h-11 w-full text-base font-medium" disabled={isPending}>
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Connexion en cours...
                </span>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Vous n&apos;avez pas de compte ?{" "}
          <Button variant="link" className="h-auto p-0 font-medium">
            Créer un compte
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default LoginForm
