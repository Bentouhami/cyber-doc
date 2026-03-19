import { User as PrismaUser } from "@prisma/client";
import { UserResponseDTO } from "../types/userValidations";

export function mapUserToResponseDTO(user: PrismaUser): UserResponseDTO | null {
  return user
    ? {
        id: user.id,
        email: user.email || "",
        name: user.name || "",
        passwordHash: user.passwordHash || "",
      }
    : null;
}
