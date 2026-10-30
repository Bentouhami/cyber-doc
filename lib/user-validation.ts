import { z } from "zod";

export const PASSWORD_POLICY = {
  minLength: 8,
  maxLength: 128,
} as const;

const personNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[^\u0000-\u001f\u007f]+$/, "Name contains unsupported control characters");

const emailSchema = z
  .string()
  .trim()
  .max(254)
  .email()
  .transform((value) => value.toLowerCase());

export const employeePasswordSchema = z
  .string()
  .min(PASSWORD_POLICY.minLength)
  .max(PASSWORD_POLICY.maxLength)
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[0-9]/, "Password must contain a number");

const roleNamesSchema = z
  .array(
    z
      .string()
      .trim()
      .min(1)
      .max(64)
      .regex(/^[a-z][a-z0-9_-]*$/, "Role name has an invalid format"),
  )
  .min(1)
  .max(10)
  .transform((values) => Array.from(new Set(values)));

const optionalPasswordSchema = z.preprocess(
  (value) => (value === "" ? undefined : value),
  employeePasswordSchema.optional(),
);

export const createUserSchema = z
  .object({
    email: emailSchema,
    password: employeePasswordSchema,
    firstName: personNameSchema,
    lastName: personNameSchema,
    roleNames: roleNamesSchema,
  })
  .strict();

export const updateUserSchema = z
  .object({
    email: emailSchema.optional(),
    password: optionalPasswordSchema,
    firstName: personNameSchema.optional(),
    lastName: personNameSchema.optional(),
    roleNames: roleNamesSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.values(value).some((entry) => entry !== undefined), {
    message: "At least one update is required",
  });

export function userValidationIssues(error: z.ZodError) {
  return error.flatten().fieldErrors;
}
