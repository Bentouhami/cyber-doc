import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { nextCookies } from "better-auth/next-js";
import bcrypt from "bcryptjs";

import { resolveAuthNetworkConfig } from "./auth-network-config";
import prisma from "./prisma";
import { PASSWORD_POLICY } from "./user-validation";
import { isUserActive, userAccessStateSelect } from "./user-access-policy";

const authNetworkConfig = resolveAuthNetworkConfig(process.env);

export const auth = betterAuth({
  baseURL: authNetworkConfig.baseURL,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
    transaction: true,
  }),
  trustedOrigins: authNetworkConfig.trustedOrigins,
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: PASSWORD_POLICY.minLength,
    maxPasswordLength: PASSWORD_POLICY.maxLength,
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
  hooks: {
    before: createAuthMiddleware(async (context) => {
      if (context.path !== "/sign-in/email") {
        return;
      }

      const email =
        typeof context.body?.email === "string"
          ? context.body.email.trim().toLowerCase()
          : null;
      if (!email) {
        return;
      }

      const user = await prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        select: userAccessStateSelect,
      });

      if (user && !isUserActive(user)) {
        throw new APIError("UNAUTHORIZED", {
          message: "Invalid email or password",
        });
      }
    }),
  },
  plugins: [nextCookies()],
});
