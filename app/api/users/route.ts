import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { hashPassword as betterAuthHashPassword } from "better-auth/crypto";

import { ensureAdminUser } from "@/lib/admin-auth";
import { internalServerError, logApiError } from "@/lib/api-error";
import prisma from "@/lib/prisma";
import { createUserSchema, userValidationIssues } from "@/lib/user-validation";
import { mapUserToEmployeeDTO } from "@/mappers/EmployeeMapper";

export async function GET(req: Request) {
  const adminCheck = await ensureAdminUser(req.headers);
  if ("error" in adminCheck) {
    return adminCheck.error;
  }
  try {
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    return NextResponse.json(users.map(mapUserToEmployeeDTO));
  } catch (error) {
    return internalServerError({ route: "/api/users", operation: "list_users" }, error);
  }
}

export async function POST(req: Request) {
  const adminCheck = await ensureAdminUser(req.headers);
  if ("error" in adminCheck) {
    return adminCheck.error;
  }
  const { currentUser } = adminCheck;

  const body: unknown = await req.json().catch((error: unknown) => {
    logApiError({ route: "/api/users", operation: "parse_request" }, error);
    return undefined;
  });
  if (body === undefined) {
    return NextResponse.json(
      { message: "Unable to parse request body", code: "INVALID_JSON" },
      { status: 400 },
    );
  }

  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid user payload",
        code: "INVALID_USER_PAYLOAD",
        issues: userValidationIssues(parsed.error),
      },
      { status: 400 },
    );
  }
  const { email, password, firstName, lastName, roleNames } = parsed.data;

  try {
    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists", code: "USER_ALREADY_EXISTS" },
        { status: 409 },
      );
    }

    const passwordHash = await hash(password, 10);
    const credentialPassword = await betterAuthHashPassword(password);

    const roles = await prisma.role.findMany({
      where: { name: { in: roleNames } },
      select: { id: true, name: true },
    });

    if (roles.length !== roleNames.length) {
      return NextResponse.json(
        { message: "Invalid roles payload", code: "INVALID_ROLES" },
        { status: 400 },
      );
    }

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          name: `${firstName} ${lastName}`.trim(),
          activatedAt: new Date(),
          deactivatedAt: null,
          roles: {
            createMany: {
              data: roles.map((role) => ({ roleId: role.id })),
              skipDuplicates: true,
            },
          },
        },
        include: {
          roles: {
            include: { role: true },
          },
        },
      });

      await tx.account.upsert({
        where: {
          providerId_accountId: {
            providerId: "credential",
            accountId: createdUser.id,
          },
        },
        update: {
          userId: createdUser.id,
          password: credentialPassword,
        },
        create: {
          providerId: "credential",
          accountId: createdUser.id,
          userId: createdUser.id,
          password: credentialPassword,
        },
      });

      await tx.activityLog.create({
        data: {
          user: {
            connect: { id: currentUser.id },
          },
          resourceType: "User",
          resourceId: createdUser.id,
          activityType: {
            connect: { name: "CREATE_EMPLOYEE" },
          },
        },
      });

      return createdUser;
    });

    return NextResponse.json(mapUserToEmployeeDTO(user), { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { message: "User already exists", code: "USER_ALREADY_EXISTS" },
        { status: 409 },
      );
    }
    return internalServerError({ route: "/api/users", operation: "create_user" }, error);
  }
}
