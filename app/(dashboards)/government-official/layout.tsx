import { AppShell } from "@/components/app-shell"; import { requireSession } from "@/lib/session";
export default async function Layout({children}:{children:React.ReactNode}){const s=await requireSession(["government_official"]);return <AppShell role="government_official" name={s.user.name}>{children}</AppShell>}
