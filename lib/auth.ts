import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import bcrypt from "bcryptjs";

import { resolveAuthNetworkConfig, resolveAuthSecret } from "./auth-network-config";
import { logApiError } from "./api-error";
import prisma from "./prisma";
import { PASSWORD_POLICY } from "./user-validation";
import { isUserActive, userAccessStateSelect } from "./user-access-policy";

const authNetworkConfig = resolveAuthNetworkConfig(process.env);
const authSecret = resolveAuthSecret(process.env);

export const auth = betterAuth({
  baseURL: authNetworkConfig.baseURL,
  secret: authSecret,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
    transaction: true,
  }),
  trustedOrigins: authNetworkConfig.trustedOrigins,
  advanced: {
    ipAddress: {
      ipAddressHeaders: authNetworkConfig.ipAddressHeaders,
      trustedProxies: authNetworkConfig.trustedProxies,
    },
  },
  rateLimit: {
    storage: "database",
  },
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
      if (!["/sign-in/email", "/sign-in/username"].includes(context.path)) {
        return;
      }

      const identifier =
        typeof context.body?.email === "string"
          ? context.body.email.trim().toLowerCase()
          : typeof context.body?.username === "string"
            ? context.body.username.trim().toLowerCase()
          : null;
      if (!identifier) {
        return;
      }

      const user = await prisma.user.findFirst({
        where:
          context.path === "/sign-in/email"
            ? { email: { equals: identifier, mode: "insensitive" } }
            : { username: identifier },
        select: userAccessStateSelect,
      });

      if (user && !isUserActive(user)) {
        throw new APIError("UNAUTHORIZED", {
          message: "Invalid email or password",
        });
      }
    }),
    after: createAuthMiddleware(async (context) => {
      if (
        !["/sign-in/email", "/sign-in/username"].includes(context.path) ||
        !context.context.newSession?.user.id
      ) {
        return;
      }

      try {
        const activityType = await prisma.activityType.findUnique({
          where: { name: "LOGIN" },
          select: { id: true },
        });
        if (!activityType) {
          throw new Error("Required LOGIN activity type is missing");
        }
        await prisma.activityLog.create({
          data: {
            userId: context.context.newSession.user.id,
            activityTypeId: activityType.id,
            resourceType: "Session",
            resourceId: context.context.newSession.session.id,
          },
        });
      } catch (error) {
        logApiError(
          { route: "/api/auth/sign-in", operation: "record_login_activity" },
          error,
        );
      }
    }),
  },
  plugins: [
    username({
      displayUsername: false,
      minUsernameLength: 3,
      maxUsernameLength: 30,
      immutableUsername: false,
    }),
    nextCookies(),
  ],
});
