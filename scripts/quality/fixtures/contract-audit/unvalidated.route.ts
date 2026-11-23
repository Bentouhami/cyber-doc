import { z } from "zod";

const unrelatedSchema = z.object({ safe: z.boolean() });
unrelatedSchema.safeParse({ safe: true });

export async function POST(request: Request) {
  const body = await request.json();
  return Response.json(body);
}
