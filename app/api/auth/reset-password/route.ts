import { cookies } from "next/headers";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { jsonError, jsonOk, serverError } from "@/lib/api";
import { verifyPasswordResetToken, SESSION_COOKIE } from "@/lib/jwt";
import { hashPassword } from "@/lib/password";

const schema = z.object({ token: z.string().min(1), password: z.string().min(8).max(200) });

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return jsonError("The reset link or new password is invalid.", 400);
    let claims;
    try { claims = await verifyPasswordResetToken(parsed.data.token); }
    catch { return jsonError("This password-reset link is invalid or has expired.", 400); }
    const user = await prisma.user.findUnique({ where: { id: claims.sub }, select: { id: true, tokenVersion: true, banned: true } });
    if (!user || user.banned || user.tokenVersion !== claims.tokenVersion) return jsonError("This password-reset link is invalid or has expired.", 400);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.password), tokenVersion: { increment: 1 } } });
    (await cookies()).delete(SESSION_COOKIE);
    return jsonOk({ message: "Password updated. Sign in with your new password." });
  } catch (error) { return serverError(error, "Password reset failed"); }
}
