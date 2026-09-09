import { cookies } from "next/headers";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { jsonError, jsonOk, serverError } from "@/lib/api";
import { hashPassword } from "@/lib/password";
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  signSessionToken,
} from "@/lib/jwt";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(200),
  role: z.enum(["health_officer", "government_official"]).default("health_officer"),
});

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success)
      return jsonError(
        "Provide a valid name, email, and password of at least 8 characters.",
        400,
      );
    const email = parsed.data.email.trim().toLowerCase();
    if (
      await prisma.user.findUnique({ where: { email }, select: { id: true } })
    )
      return jsonError("An account with this email already exists.", 409);
    const role = parsed.data.role;
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        role,
        passwordHash: await hashPassword(parsed.data.password),
      },
    });
    const token = await signSessionToken({
      userId: user.id,
      role,
      tokenVersion: user.tokenVersion,
    });
    (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions);
    if (role === "government_official") {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "GOVERNMENT_OFFICIAL_REGISTERED",
          entity: "User",
          entityId: user.id,
          description: "Registered from shared registration form",
        },
      });
      return jsonOk({ redirectTo: "/government-official/profile" }, 201);
    }
    return jsonOk({ redirectTo: "/health-officer" }, 201);
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      error.code === "P2002"
    )
      return jsonError("An account with this email already exists.", 409);
    return serverError(error, "Registration failed");
  }
}
