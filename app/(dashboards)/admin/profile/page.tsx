import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { updateAdminProfile } from "@/actions/profile";
import { ProfilePage } from "@/components/profile-page";

export default async function Page() {
  const session = await requireSession(["admin"]);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id }, select: { name:true,email:true,role:true,createdAt:true } });
  return <ProfilePage title="Administrator profile" description="Manage your account identity and review access information." user={user} action={updateAdminProfile}/>;
}
