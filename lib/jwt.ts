import "server-only";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { AppRole } from "@/lib/auth-routing";

export const SESSION_COOKIE = "typhoidwatch_session";
const ISSUER = "typhoidwatch-rwanda";
const AUDIENCE = "typhoidwatch-web";

function secretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error("JWT_SECRET must contain at least 32 characters.");
  return new TextEncoder().encode(secret);
}

type SessionClaims = JWTPayload & { sub: string; role: AppRole; tokenVersion: number; purpose: "session" };
type ResetClaims = JWTPayload & { sub: string; tokenVersion: number; purpose: "password-reset" };

export async function signSessionToken(input: { userId: string; role: AppRole; tokenVersion: number }) {
  return new SignJWT({ role: input.role, tokenVersion: input.tokenVersion, purpose: "session" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" }).setSubject(input.userId).setIssuer(ISSUER).setAudience(AUDIENCE).setIssuedAt().setExpirationTime("7d").sign(secretKey());
}

export async function verifySessionToken(token: string) {
  const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"], issuer: ISSUER, audience: AUDIENCE });
  if (payload.purpose !== "session" || !payload.sub || typeof payload.role !== "string" || typeof payload.tokenVersion !== "number") throw new Error("Invalid session token.");
  return payload as SessionClaims;
}

export async function signPasswordResetToken(input: { userId: string; tokenVersion: number }) {
  return new SignJWT({ tokenVersion: input.tokenVersion, purpose: "password-reset" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" }).setSubject(input.userId).setIssuer(ISSUER).setAudience(AUDIENCE).setIssuedAt().setExpirationTime("20m").sign(secretKey());
}

export async function verifyPasswordResetToken(token: string) {
  const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"], issuer: ISSUER, audience: AUDIENCE });
  if (payload.purpose !== "password-reset" || !payload.sub || typeof payload.tokenVersion !== "number") throw new Error("Invalid password-reset token.");
  return payload as ResetClaims;
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};
