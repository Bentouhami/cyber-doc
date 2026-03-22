import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { hashPassword as betterAuthHashPassword } from "better-auth/crypto";

import { ensureAdminUser } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";
import { mapUserToEmployeeDTO } from "@/mappers/EmployeeMapper";
import { parseRoleNames } from "../utils";

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
    console.error(`Error retrieving user ${userId}:`, error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { userId } = await params;
  const adminCheck = await ensureAdminUser(req.headers);
  if ("error" in adminCheck) {
    return adminCheck.error;
  }
  const { currentUser } = adminCheck;

  try {
    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      password,
      roleNames: rawRoleNames,
      isActive,
    } = body as Record<string, unknown>;

    if (
      typeof firstName === "undefined" &&
      typeof lastName === "undefined" &&
      typeof email === "undefined" &&
      typeof password === "undefined" &&
      typeof rawRoleNames === "undefined" &&
      typeof isActive === "undefined"
    ) {
      return new NextResponse("No updates provided", { status: 400 });
    }

    if (typeof isActive !== "undefined" && typeof isActive !== "boolean") {
      return new NextResponse("Invalid isActive value", { status: 400 });
    }

    if (currentUser.id === userId && isActive === false) {
      return new NextResponse("You cannot deactivate your own account", { status: 403 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    if (typeof email === "string" && email !== existingUser.email) {
      const emailInUse = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (emailInUse) {
        return new NextResponse("Email already in use", { status: 409 });
      }
    }

    const roleNames =
      typeof rawRoleNames === "undefined" ? undefined : parseRoleNames(rawRoleNames);

    if (typeof rawRoleNames !== "undefined" && !roleNames) {
      return new NextResponse("Invalid roles payload", { status: 400 });
    }

    if (
      currentUser.id === userId &&
      roleNames &&
      !roleNames.includes("admin")
    ) {
      return new NextResponse("You cannot remove your own admin role", { status: 403 });
    }

    const updatedFirstName =
      typeof firstName === "string" ? firstName : existingUser.firstName;
    const updatedLastName =
      typeof lastName === "string" ? lastName : existingUser.lastName;
    const updatedEmail =
      typeof email === "string" ? email : existingUser.email;

    const passwordHash =
      typeof password === "string" && password.length > 0
        ? await hash(password, 10)
        : undefined;
    const credentialPassword =
      typeof password === "string" && password.length > 0
        ? await betterAuthHashPassword(password)
        : undefined;

    const roles = roleNames
      ? await prisma.role.findMany({
          where: { name: { in: roleNames } },
          select: { id: true, name: true },
        })
      : [];

    if (roleNames && roles.length !== roleNames.length) {
      return new NextResponse("Invalid roles payload", { status: 400 });
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

      if (typeof email === "string" && email !== existingUser.email) {
        await tx.account.updateMany({
          where: {
            providerId: "credential",
            userId,
          },
          data: {
            accountId: updatedEmail,
          },
        });
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
    console.error(`Error updating user ${userId}:`, error);
    return new NextResponse("Internal Server Error", { status: 500 });
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
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        deactivatedAt: new Date(),
      },
      include: {
        roles: { include: { role: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        user: {
          connect: { id: currentUser.id },
        },
        resourceType: "User",
        resourceId: user.id,
        activityType: {
          connect: { name: "UPDATE_EMPLOYEE" },
        },
      },
    });

    return NextResponse.json(mapUserToEmployeeDTO(user));
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return new NextResponse("User not found", { status: 404 });
    }

    console.error(`Error deleting user ${userId}:`, error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
