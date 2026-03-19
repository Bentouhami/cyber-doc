import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/admin-auth";
import { hasAnyRole } from "@/lib/permissions";

const personaSchema = z.object({
  fullName: z.string().min(1).optional(),
  fullNameAr: z.string().optional(),
  nationalId: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  birthDate: z.string().datetime().optional(),
  birthPlace: z.string().optional(),
  addressLine1: z.string().optional(),
  city: z.string().optional(),
  locale: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: Request) {
  const authResult = await getAuthenticatedUser(request.headers);
  if ("error" in authResult) {
    return authResult.error;
  }
  const { currentUser } = authResult;
  if (!hasAnyRole(currentUser, ["employee", "admin"])) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim();
  const take = Math.min(Number(url.searchParams.get("limit") ?? 20), 50);
  const skip = Math.max(Number(url.searchParams.get("skip") ?? 0), 0);

  try {
    const personas = await prisma.persona.findMany({
      where: query
        ? {
            OR: [
              { fullName: { contains: query, mode: "insensitive" } },
              { fullNameAr: { contains: query, mode: "insensitive" } },
              { nationalId: { contains: query, mode: "insensitive" } },
              { phone: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { updatedAt: "desc" },
      take,
      skip,
    });

    return NextResponse.json(
      personas.map((persona) => ({
        id: persona.id,
        fullName: persona.fullName,
        fullNameAr: persona.fullNameAr,
        nationalId: persona.nationalId,
        phone: persona.phone,
        email: persona.email,
        birthDate: persona.birthDate ? persona.birthDate.toISOString().slice(0, 10) : null,
        birthPlace: persona.birthPlace,
        addressLine1: persona.addressLine1,
        city: persona.city,
        gender: persona.gender,
        occupation: persona.occupation,
        employer: persona.employer,
        locale: persona.locale,
        updatedAt: persona.updatedAt.toISOString(),
      })),
    );
  } catch (error) {
    console.error("Error fetching personas:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  const authResult = await getAuthenticatedUser(request.headers);
  if ("error" in authResult) {
    return authResult.error;
  }
  const { currentUser } = authResult;
  if (!hasAnyRole(currentUser, ["employee", "admin"])) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  let data: z.infer<typeof personaSchema>;
  try {
    const body = await request.json();
    const parsed = personaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid payload", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    data = parsed.data;
  } catch (error) {
    console.error("Invalid JSON payload:", error);
    return NextResponse.json({ message: "Unable to parse request body" }, { status: 400 });
  }

  if (!data.fullName && !data.fullNameAr && !data.nationalId) {
    return NextResponse.json(
      { message: "fullName, fullNameAr, or nationalId is required" },
      { status: 400 },
    );
  }

  try {
    const persona = await prisma.persona.create({
      data: {
        fullName: data.fullName ?? null,
        fullNameAr: data.fullNameAr ?? null,
        nationalId: data.nationalId ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        birthPlace: data.birthPlace ?? null,
        addressLine1: data.addressLine1 ?? null,
        city: data.city ?? null,
        locale: data.locale ?? null,
        notes: data.notes ?? null,
        createdById: currentUser.id,
      },
    });

    return NextResponse.json(
      {
        id: persona.id,
        fullName: persona.fullName,
        fullNameAr: persona.fullNameAr,
        nationalId: persona.nationalId,
        phone: persona.phone,
        email: persona.email,
        city: persona.city,
        locale: persona.locale,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating persona:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
