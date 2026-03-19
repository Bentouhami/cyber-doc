import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { nextCookies } from "better-auth/next-js";
import bcrypt from "bcryptjs";

import prisma from "./prisma";

const trustedOrigins = [
  "http://localhost:3000",
  "http://localhost:5000",
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.NEXTAUTH_URL,
].filter(Boolean) as string[];

export const auth = betterAuth({
  baseURL:
    process.env.BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
    transaction: true,
  }),
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    password: {
      hash: async (password: string) => hashPassword(password),
      verify: async ({
        hash,
        password,
      }: {
        hash: string;
        password: string;
      }) => {
        if (!hash.includes(":")) {
          const matches = await bcrypt.compare(password, hash);
          if (matches) {
            const upgraded = await hashPassword(password);
            await prisma.account.updateMany({
              where: {
                providerId: "credential",
                password: hash,
              },
              data: { password: upgraded },
            });
          }
          return matches;
        }

        try {
          return await verifyPassword({ hash, password });
        } catch (error) {
          if (error instanceof Error && error.message === "Invalid password hash") {
            return bcrypt.compare(password, hash);
          }
          throw error;
        }
      },
    },
  },
  plugins: [nextCookies()],
});
