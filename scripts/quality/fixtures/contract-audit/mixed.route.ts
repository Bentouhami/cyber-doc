import { z } from "zod";

const payloadSchema = z.object({ name: z.string() });

export async function POST(request: Request) {
  const parsed = payloadSchema.safeParse(await request.json());
  return Response.json(parsed);
}

export async function PATCH(request: Request) {
  const body = await request.json();
  payloadSchema.safeParse({ unrelated: true });
  return Response.json(body);
}
