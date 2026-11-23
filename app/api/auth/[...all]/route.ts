import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

const handlers = toNextJsHandler(auth);

export const GET = handlers.GET;

export function POST(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/auth/sign-up/")) {
    return NextResponse.json({ message: "Bad Request" }, { status: 400 });
  }
  return handlers.POST(request);
}
