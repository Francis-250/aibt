import { AppShell } from "@/components/app-shell"; import { requireSession } from "@/lib/session";
export default async function Layout({children}:{children:React.ReactNode}){const s=await requireSession(["health_officer"]);return <AppShell role="health_officer" name={s.user.name}>{children}</AppShell>}
