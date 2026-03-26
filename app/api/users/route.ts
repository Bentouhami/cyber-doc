import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { hashPassword as betterAuthHashPassword } from "better-auth/crypto";

import { ensureAdminUser } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";
import { mapUserToEmployeeDTO } from "@/mappers/EmployeeMapper";
import { parseRoleNames } from "./utils";

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
    console.error("Error fetching users:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  const adminCheck = await ensureAdminUser(req.headers);
  if ("error" in adminCheck) {
    return adminCheck.error;
  }
  const { currentUser } = adminCheck;

  try {
    const body = await req.json();
    const { email, password, firstName, lastName, roleNames: rawRoleNames } = body;

    const roleNames = parseRoleNames(rawRoleNames);

    if (!email || !password || !firstName || !lastName || !roleNames) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return new NextResponse("User already exists", { status: 409 });
    }

    const passwordHash = await hash(password, 10);
    const credentialPassword = await betterAuthHashPassword(password);

    const roles = await prisma.role.findMany({
      where: { name: { in: roleNames } },
      select: { id: true, name: true },
    });

    if (roles.length !== roleNames.length) {
      return new NextResponse("Invalid roles payload", { status: 400 });
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
            accountId: email,
          },
        },
        update: {
          userId: createdUser.id,
          password: credentialPassword,
        },
        create: {
          providerId: "credential",
          accountId: email,
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
    console.error("Error creating user:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
