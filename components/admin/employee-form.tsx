"use client"

import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Eye, EyeOff, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import type { EmployeeDTO } from "@/types/employees"
import { translateRoleName } from "@/utils/roles"

type EmployeeFormMode = "create" | "edit"

const schemaShape = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  password: z.union([z.string(), z.literal("")]).optional(),
  roleName: z.string(),
})

type EmployeeFormValues = z.infer<typeof schemaShape>

interface EmployeeFormProps {
  onSuccess: () => void
  onCancel?: () => void
  mode?: EmployeeFormMode
  employee?: EmployeeDTO | null
  currentUserId?: string | null
}

const ROLE_OPTIONS = ["admin", "employee"]

export function EmployeeForm({ onSuccess, onCancel, mode = "create", employee, currentUserId = null }: EmployeeFormProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const isEditMode = mode === "edit"

  const mapEmployeeApiError = (message: string) => {
    if (message.includes("User already exists") || message.includes("Email already in use")) {
      return t("employeeForm.errors.emailAlreadyUsed")
    }
    if (message.includes("Missing required fields")) {
      return t("employeeForm.errors.missingFields")
    }
    if (message.includes("Invalid roles payload")) {
      return t("employeeForm.errors.invalidRole")
    }
    if (message.includes("No updates provided")) {
      return t("employeeForm.errors.noUpdates")
    }
    if (message.includes("User not found")) {
      return t("employeeForm.errors.userNotFound")
    }
    if (message.includes("cannot remove your own admin role")) {
      return t("employeeStatus.selfRoleBlocked")
    }
    if (message.includes("cannot deactivate your own account")) {
      return t("employeeStatus.selfDeactivateBlocked")
    }
    if (message.includes("cannot delete your own account")) {
      return t("employeeStatus.selfDeleteBlocked")
    }
    return message || t("employeeForm.errors.generic")
  }

  const schema = useMemo(() => {
    const passwordSchema = z
      .string()
      .min(8, t("employeeForm.validation.passwordMin"))
      .regex(/[A-Z]/, t("employeeForm.validation.passwordUppercase"))
      .regex(/[a-z]/, t("employeeForm.validation.passwordLowercase"))
      .regex(/[0-9]/, t("employeeForm.validation.passwordNumber"))

    const baseSchema = z.object({
      firstName: z.string().min(2, t("employeeForm.validation.firstNameMin")),
      lastName: z.string().min(2, t("employeeForm.validation.lastNameMin")),
      email: z.string().email(t("employeeForm.validation.email")),
      password: z.union([passwordSchema, z.literal("")]).optional(),
      roleName: z.string().min(1, t("employeeForm.validation.roleRequired")),
    })

    return baseSchema.superRefine((data, ctx) => {
      if (mode === "create" && (!data.password || data.password === "")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["password"],
          message: t("employeeForm.errors.passwordRequired"),
        })
      }
    })
  }, [mode, t])

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: employee?.firstName ?? "",
      lastName: employee?.lastName ?? "",
      email: employee?.email ?? "",
      password: "",
      roleName: employee?.roles?.[0]?.name ?? "",
    },
  })

  useEffect(() => {
    form.reset({
      firstName: employee?.firstName ?? "",
      lastName: employee?.lastName ?? "",
      email: employee?.email ?? "",
      password: "",
      roleName: employee?.roles?.[0]?.name ?? "",
    })
    setShowPassword(false)
  }, [employee, form, mode])

  async function onSubmit(values: EmployeeFormValues) {
    try {
      setIsSubmitting(true)
      if (!ROLE_OPTIONS.includes(values.roleName)) {
        throw new Error(t("employeeForm.errors.invalidRole"))
      }

      if (isEditMode && employee?.id === currentUserId && values.roleName !== "admin") {
        throw new Error(t("employeeStatus.selfRoleBlocked"))
      }

      const payload: Record<string, unknown> = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        roleNames: [values.roleName],
      }

      if (values.password && values.password.length > 0) {
        payload.password = values.password
      }

      const endpoint = isEditMode && employee ? `/api/users/${employee.id}` : "/api/users"
      const method = isEditMode ? "PATCH" : "POST"

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const error = await res.text()
        throw new Error(mapEmployeeApiError(error))
      }

      toast({
        title: t("common.success"),
        description: isEditMode ? t("employeeForm.success.update") : t("employeeForm.success.create"),
      })

      if (isEditMode) {
        onSuccess()
        onCancel?.()
      } else {
        form.reset({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          roleName: "",
        })
        onSuccess()
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("employeeForm.errors.generic"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("employeeForm.labels.firstName")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("employeeForm.placeholders.firstName")} {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("employeeForm.labels.lastName")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("employeeForm.placeholders.lastName")} {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("employeeForm.labels.email")}</FormLabel>
              <FormControl>
                <Input type="email" placeholder={t("employeeForm.placeholders.email")} {...field} disabled={isSubmitting} />
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
              <FormLabel>
                {t("employeeForm.labels.password")}{" "}
                {isEditMode && <span className="text-muted-foreground text-sm">{t("employeeForm.labels.passwordOptional")}</span>}
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder={isEditMode ? t("employeeForm.placeholders.passwordEdit") : t("employeeForm.placeholders.password")}
                    {...field}
                    disabled={isSubmitting}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="roleName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("employeeForm.labels.role")}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("employeeForm.placeholders.role")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ROLE_OPTIONS.map((roleName) => (
                    <SelectItem key={roleName} value={roleName}>
                      {translateRoleName(roleName, t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          {isEditMode && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              {t("common.cancel")}
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                {isEditMode ? t("employeeForm.submit.updating") : t("employeeForm.submit.creating")}
              </>
            ) : (
              isEditMode ? t("employeeForm.submit.update") : t("employeeForm.submit.create")
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
