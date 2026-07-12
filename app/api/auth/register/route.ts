import { cookies } from "next/headers";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { jsonError, jsonOk, serverError } from "@/lib/api";
import { hashPassword } from "@/lib/password";
import { SESSION_COOKIE, sessionCookieOptions, signSessionToken } from "@/lib/jwt";

const schema = z.object({ name: z.string().trim().min(2).max(100), email: z.string().email(), password: z.string().min(8).max(200) });

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return jsonError("Provide a valid name, email, and password of at least 8 characters.", 400);
    const email = parsed.data.email.trim().toLowerCase();
    if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) return jsonError("An account with this email already exists.", 409);
    const user = await prisma.user.create({ data: { name: parsed.data.name, email, role: "health_officer", passwordHash: await hashPassword(parsed.data.password) } });
    const token = await signSessionToken({ userId: user.id, role: "health_officer", tokenVersion: user.tokenVersion });
    (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions);
    return jsonOk({ redirectTo: "/health-officer" }, 201);
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") return jsonError("An account with this email already exists.", 409);
    return serverError(error, "Registration failed");
  }
}
