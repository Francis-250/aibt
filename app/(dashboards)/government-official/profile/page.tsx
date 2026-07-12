import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { updateGovernmentOfficialProfile } from "@/actions/profile";
import { ProfilePage } from "@/components/profile-page";

export default async function Page() {
  const session = await requireSession(["government_official"]);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id }, select: { name:true,email:true,role:true,createdAt:true,governmentOfficialProfile:true } });
  const profile=user.governmentOfficialProfile;
  return <ProfilePage title="Government Official profile" description="Maintain your institution, position, and geographic responsibility." user={user} fields={[{name:"institution",label:"Institution",value:profile?.institution},{name:"position",label:"Position",value:profile?.position},{name:"province",label:"Responsible province",value:profile?.province},{name:"district",label:"Responsible district",value:profile?.district}]} action={updateGovernmentOfficialProfile}/>;
}
