import { redirect } from "next/navigation";
import { getServerSession } from "@/hooks/get-server-session";
import { normalizeRole, type AppRole } from "./auth-routing";

export async function requireSession(allowed?: AppRole[]) {
  const session = await getServerSession();
  if (!session?.user) redirect("/auth/login");
  const role = normalizeRole(session.user.role);
  if (allowed && !allowed.includes(role)) redirect("/unauthorized");
  return { ...session, role };
}
