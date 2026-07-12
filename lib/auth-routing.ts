export type AppRole = "admin" | "health_officer" | "government_official";

export function normalizeRole(role?: string | null): AppRole | null {
  const value = role?.trim().toLowerCase().replaceAll("-", "_");
  if (value === "admin" || value === "health_officer" || value === "government_official") return value;
  return null;
}

export function roleHome(role?: string | null) {
  const normalized = normalizeRole(role);
  if (normalized === "admin") return "/admin";
  if (normalized === "government_official") return "/government-official";
  if (normalized === "health_officer") return "/health-officer";
  return "/auth/login";
}

export function roleForPath(pathname: string): AppRole | null {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "admin";
  if (pathname === "/health-officer" || pathname.startsWith("/health-officer/")) return "health_officer";
  if (pathname === "/government-official" || pathname.startsWith("/government-official/")) return "government_official";
  return null;
}

export function roleMatches(required: AppRole, actual?: string | null) { return required === normalizeRole(actual); }
