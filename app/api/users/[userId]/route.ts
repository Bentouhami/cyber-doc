import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { hashPassword as betterAuthHashPassword } from "better-auth/crypto";

import { ensureAdminUser } from "@/lib/admin-auth";
import { internalServerError, logApiError } from "@/lib/api-error";
import prisma from "@/lib/prisma";
import { updateUserSchema, userValidationIssues } from "@/lib/user-validation";
import { mapUserToEmployeeDTO } from "@/mappers/EmployeeMapper";

type RouteContext = {
  params: Promise<{ userId: string }>;
};

export async function GET(req: NextRequest, { params }: RouteContext) {
  const { userId } = await params;
  const adminCheck = await ensureAdminUser(req.headers);
  if ("error" in adminCheck) {
    return adminCheck.error;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: { include: { role: true } },
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json(mapUserToEmployeeDTO(user));
  } catch (error) {
    return internalServerError(
      { route: "/api/users/[userId]", operation: "get_user" },
      error,
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { userId } = await params;
  const adminCheck = await ensureAdminUser(req.headers);
  if ("error" in adminCheck) {
    return adminCheck.error;
  }
  const { currentUser } = adminCheck;

  const body: unknown = await req.json().catch((error: unknown) => {
    logApiError({ route: "/api/users/[userId]", operation: "parse_request" }, error);
    return undefined;
  });
  if (body === undefined) {
    return NextResponse.json(
      { message: "Unable to parse request body", code: "INVALID_JSON" },
      { status: 400 },
    );
  }

  const parsed = updateUserSchema.safeParse(body);
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
  const { firstName, lastName, email, password, roleNames, isActive } = parsed.data;

  try {
    if (currentUser.id === userId && isActive === false) {
      return new NextResponse("You cannot deactivate your own account", { status: 403 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    if (email && email.toLowerCase() !== existingUser.email.toLowerCase()) {
      const emailInUse = await prisma.user.findFirst({
        where: {
          email: { equals: email, mode: "insensitive" },
          id: { not: userId },
        },
        select: { id: true },
      });

      if (emailInUse) {
        return NextResponse.json(
          { message: "Email already in use", code: "EMAIL_ALREADY_IN_USE" },
          { status: 409 },
        );
      }
    }

    if (
      currentUser.id === userId &&
      roleNames &&
      !roleNames.includes("admin")
    ) {
      return new NextResponse("You cannot remove your own admin role", { status: 403 });
    }

    const updatedFirstName = firstName ?? existingUser.firstName;
    const updatedLastName = lastName ?? existingUser.lastName;
    const updatedEmail = email ?? existingUser.email;

    const passwordHash =
      password ? await hash(password, 10) : undefined;
    const credentialPassword =
      password ? await betterAuthHashPassword(password) : undefined;
    const shouldRevokeSessions = isActive === false || Boolean(credentialPassword);

    const roles = roleNames
      ? await prisma.role.findMany({
          where: { name: { in: roleNames } },
          select: { id: true, name: true },
        })
      : [];

    if (roleNames && roles.length !== roleNames.length) {
      return NextResponse.json(
        { message: "Invalid roles payload", code: "INVALID_ROLES" },
        { status: 400 },
      );
    }

    const user = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          firstName: updatedFirstName,
          lastName: updatedLastName,
          email: updatedEmail,
          name: `${updatedFirstName ?? ""} ${updatedLastName ?? ""}`.trim(),
          ...(passwordHash ? { passwordHash } : {}),
          ...(typeof isActive === "boolean"
            ? {
                activatedAt: isActive
                  ? existingUser.activatedAt ?? new Date()
                  : existingUser.activatedAt,
                deactivatedAt: isActive ? null : new Date(),
              }
            : {}),
          roles: roleNames
            ? {
                deleteMany: {},
                createMany: {
                  data: roles.map((role) => ({ roleId: role.id })),
                  skipDuplicates: true,
                },
              }
            : undefined,
        },
        include: {
          roles: { include: { role: true } },
        },
      });

      if (credentialPassword) {
        await tx.account.updateMany({
          where: {
            providerId: "credential",
            userId,
          },
          data: {
            password: credentialPassword,
          },
        });
      }

      if (shouldRevokeSessions) {
        await tx.session.deleteMany({ where: { userId } });
      }

      await tx.activityLog.create({
        data: {
          user: {
            connect: { id: currentUser.id },
          },
          resourceType: "User",
          resourceId: updatedUser.id,
          activityType: {
            connect: { name: "UPDATE_EMPLOYEE" },
          },
        },
      });

      return updatedUser;
    });

    return NextResponse.json(mapUserToEmployeeDTO(user));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { message: "Email already in use", code: "EMAIL_ALREADY_IN_USE" },
        { status: 409 },
      );
    }
    return internalServerError(
      { route: "/api/users/[userId]", operation: "update_user" },
      error,
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { userId } = await params;
  const adminCheck = await ensureAdminUser(req.headers);
  if ("error" in adminCheck) {
    return adminCheck.error;
  }
  const { currentUser } = adminCheck;

  if (currentUser.id === userId) {
    return new NextResponse("You cannot delete your own account", { status: 403 });
  }

  try {
    const user = await prisma.$transaction(async (tx) => {
      const deletedUser = await tx.user.update({
        where: { id: userId },
        data: {
          deletedAt: new Date(),
          deactivatedAt: new Date(),
        },
        include: {
          roles: { include: { role: true } },
        },
      });

      await tx.session.deleteMany({ where: { userId } });
      await tx.activityLog.create({
        data: {
          user: {
            connect: { id: currentUser.id },
          },
          resourceType: "User",
          resourceId: deletedUser.id,
          activityType: {
            connect: { name: "UPDATE_EMPLOYEE" },
          },
        },
      });

      return deletedUser;
    });

    return NextResponse.json(mapUserToEmployeeDTO(user));
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return new NextResponse("User not found", { status: 404 });
    }

    return internalServerError(
      { route: "/api/users/[userId]", operation: "delete_user" },
      error,
    );
  }
}
