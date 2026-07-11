import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { roleForPath, roleHome, roleMatches } from "@/lib/auth-routing";

export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  const requiredRole = roleForPath(request.nextUrl.pathname);
  const authEntry = request.nextUrl.pathname === "/auth/login" || request.nextUrl.pathname === "/auth/register";
  if (!session?.user && requiredRole) return NextResponse.redirect(new URL("/auth/login", request.url));
  if (!session?.user) return NextResponse.next();
  const home = roleHome(session.user.role);
  if (authEntry) return NextResponse.redirect(new URL(home, request.url));
  if (requiredRole && !roleMatches(requiredRole, session.user.role)) return NextResponse.redirect(new URL(home, request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/health-officer/:path*", "/government-official/:path*", "/auth/login", "/auth/register"] };
