export type AppRole = "admin" | "health_officer" | "government_official";

export function normalizeRole(role?: string | null): AppRole {
  const value = role?.trim().toLowerCase().replaceAll("-", "_");
  if (value === "admin") return "admin";
  if (value === "government_official") return "government_official";
  return "health_officer";
}

export function roleHome(role?: string | null) {
  const normalized = normalizeRole(role);
  if (normalized === "admin") return "/admin";
  if (normalized === "government_official") return "/government-official";
  return "/health-officer";
}

export function roleForPath(pathname: string): AppRole | null {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "admin";
  if (pathname === "/health-officer" || pathname.startsWith("/health-officer/")) return "health_officer";
  if (pathname === "/government-official" || pathname.startsWith("/government-official/")) return "government_official";
  return null;
}

export function roleMatches(required: AppRole, actual?: string | null) {
  return required === normalizeRole(actual);
}
