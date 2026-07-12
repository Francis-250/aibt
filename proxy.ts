import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/jwt";
import { roleForPath, roleHome, roleMatches } from "@/lib/auth-routing";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const requiredRole = roleForPath(pathname);
  const authEntry = pathname === "/auth/login" || pathname === "/auth/register";
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  let claims: Awaited<ReturnType<typeof verifySessionToken>> | null = null;
  if (token) { try { claims = await verifySessionToken(token); } catch { claims = null; } }
  if (!claims && requiredRole) return NextResponse.redirect(new URL("/auth/login", request.url));
  if (!claims) return NextResponse.next();
  const home = roleHome(claims.role);
  if (authEntry) return NextResponse.redirect(new URL(home, request.url));
  if (requiredRole && !roleMatches(requiredRole, claims.role)) return NextResponse.redirect(new URL(home, request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/health-officer/:path*", "/government-official/:path*", "/auth/login", "/auth/register"] };
