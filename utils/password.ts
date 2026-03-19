import bcrypt from "bcryptjs";

export function saltAndHashPassword(plainTextPassword: string): string {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(plainTextPassword, salt);

  return hash;
}
