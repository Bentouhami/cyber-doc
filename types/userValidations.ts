import * as z from "zod";

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(2).max(100),
  passwordHash: z.string().min(8).max(100),
});

export type UserResponseDTO = z.infer<typeof UserSchema>;
