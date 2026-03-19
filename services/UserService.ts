import bcrypt from "bcryptjs";

import { mapUserToResponseDTO } from "@/mappers/UserMapper";
import { UserResponseDTO } from "../types/userValidations";
import prisma from "@/lib/prisma";

export async function getUserFromDb(
  email: string | undefined,
  plainPassword: string | undefined
): Promise<UserResponseDTO | null> {
  if (!email || !plainPassword) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.passwordHash) {
    return null;
  }

  const isPasswordValid = await bcrypt.compare(
    plainPassword,
    user.passwordHash
  );

  if (!isPasswordValid) {
    return null;
  }

  return mapUserToResponseDTO(user);
}
