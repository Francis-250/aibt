import { redirect } from "next/navigation"; import { getServerSession } from "@/hooks/get-server-session"; import { roleHome } from "@/lib/auth-routing";
export default async function RedirectPage(){const session=await getServerSession();redirect(session?.user?roleHome(session.user.role):"/auth/login")}
