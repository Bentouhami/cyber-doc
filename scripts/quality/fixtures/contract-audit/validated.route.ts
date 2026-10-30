import { z } from "zod";

const payloadSchema = z.object({ name: z.string() });

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ message: "Invalid payload" }, { status: 400 });
  }
  return Response.json(parsed.data);
}
