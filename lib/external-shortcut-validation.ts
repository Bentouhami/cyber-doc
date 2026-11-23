import { z } from "zod";

const externalUrl = z
  .string()
  .trim()
  .min(1)
  .max(2048)
  .refine((value) => {
    try {
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password;
    } catch {
      return false;
    }
  }, "Only HTTP(S) links without embedded credentials are allowed");

const externalShortcutFields = z.object({
  title: z.string().trim().min(1).max(120),
  titleAr: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).nullable().optional(),
  descriptionAr: z.string().trim().max(500).nullable().optional(),
  url: externalUrl,
  displayOrder: z.number().int().min(0).max(10_000),
  isActive: z.boolean(),
});

export const externalShortcutCreateSchema = externalShortcutFields.extend({
  displayOrder: externalShortcutFields.shape.displayOrder.default(0),
  isActive: externalShortcutFields.shape.isActive.default(true),
});

export const externalShortcutUpdateSchema = externalShortcutFields
  .partial()
  .refine((value) => Object.keys(value).length > 0, "At least one field is required");
