import { AppShell } from "@/components/app-shell"; import { requireSession } from "@/lib/session";
export default async function Layout({children}:{children:React.ReactNode}){const s=await requireSession(["admin"]);return <AppShell role="admin" name={s.user.name}>{children}</AppShell>}
