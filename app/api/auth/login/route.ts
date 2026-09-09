import { cookies } from "next/headers";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { jsonError, jsonOk, serverError } from "@/lib/api";
import { verifyPassword } from "@/lib/password";
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  signSessionToken,
} from "@/lib/jwt";
import { normalizeRole, roleHome } from "@/lib/auth-routing";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success)
      return jsonError("Enter a valid email address and password.", 400);
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email.trim().toLowerCase() },
    });
    const role = normalizeRole(user?.role);
    const passwordValid = user?.passwordHash
      ? await verifyPassword(parsed.data.password, user.passwordHash)
      : false;
    const suspended = Boolean(
      user?.banned && (!user.banExpires || user.banExpires > new Date()),
    );
    if (!user || !role || !passwordValid || suspended)
      return jsonError(
        "Email or password is incorrect, or the account is unavailable.",
        401,
      );
    const token = await signSessionToken({
      userId: user.id,
      role,
      tokenVersion: user.tokenVersion,
    });
    (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions);
    return jsonOk({ redirectTo: roleHome(role) });
  } catch (error) {
    return serverError(error, "Login failed");
  }
}
