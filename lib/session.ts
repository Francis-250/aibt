import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/jwt";
import { normalizeRole, type AppRole } from "@/lib/auth-routing";

export async function getServerSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const claims = await verifySessionToken(token);
    const user = await prisma.user.findUnique({
      where: { id: claims.sub },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        banned: true,
        banExpires: true,
        tokenVersion: true,
      },
    });
    if (
      !user ||
      user.tokenVersion !== claims.tokenVersion ||
      user.role !== claims.role
    )
      return null;
    const suspensionActive =
      user.banned && (!user.banExpires || user.banExpires > new Date());
    if (suspensionActive || !normalizeRole(user.role)) return null;
    return { user, expiresAt: claims.exp ? new Date(claims.exp * 1000) : null };
  } catch {
    return null;
  }
}

export async function requireSession(allowed?: AppRole[]) {
  const session = await getServerSession();
  if (!session) redirect("/auth/login");
  const role = normalizeRole(session.user.role);
  if (!role || (allowed && !allowed.includes(role))) redirect("/unauthorized");
  return { ...session, role };
}
