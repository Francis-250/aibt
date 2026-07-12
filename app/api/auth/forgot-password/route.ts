import { z } from "zod";
import prisma from "@/lib/prisma";
import { jsonOk, serverError } from "@/lib/api";
import { signPasswordResetToken } from "@/lib/jwt";
import { sendPasswordResetEmail } from "@/lib/email";

const schema = z.object({ email: z.string().email() });
const genericMessage = "If an account exists for that email, a password-reset link has been sent.";

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return jsonOk({ message: genericMessage });
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email.trim().toLowerCase() }, select: { id: true, email: true, tokenVersion: true, banned: true } });
    if (user && !user.banned) {
      const token = await signPasswordResetToken({ userId: user.id, tokenVersion: user.tokenVersion });
      const resetUrl = new URL("/auth/reset-password", request.url); resetUrl.searchParams.set("token", token);
      await sendPasswordResetEmail({ to: user.email, resetUrl: resetUrl.toString() });
    }
    return jsonOk({ message: genericMessage });
  } catch (error) { serverError(error, "Forgot-password request failed"); return jsonOk({ message: genericMessage }); }
}
