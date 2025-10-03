import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  console.log(" ===> Creating a new employee");

  // get conencted user from request headers
  const userEmail = req.headers.get("x-user-email");
  if (!userEmail) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: { roles: true },
  });

  // get roles by id from join table useRoles
  const roles = await prisma.role.findMany({
    where: {
      id: {
        in: user?.roles.map((role) => role.roleId),
      },
    },
    include: {
      users: true,
    },
  });

  // Check if user has admin role
  const isAdmin = roles.some((role) => role.name === "admin");
  if (!isAdmin) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const body = await req.json();
    const { email, password, firstName, lastName, roleId } = body;

    console.log("Received employee data:", body);

    if (!email || !password || !firstName || !lastName || !roleId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return new NextResponse("User already exists", { status: 409 });
    }

    // Hash the password
    const passwordHash = await hash(password, 10);

    // Create the employee with associated role
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        roles: {
          create: {
            roleId: parseInt(roleId, 10),
          },
        },
      },
    });

    if (!user) {
      return new NextResponse("Failed to create user", { status: 500 });
    }

    // create activity log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "Created new employee",
        timestamp: new Date(),
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Employee creation error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
