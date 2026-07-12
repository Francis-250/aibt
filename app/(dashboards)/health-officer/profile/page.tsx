import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { updateHealthOfficerProfile } from "@/actions/profile";
import { ProfilePage } from "@/components/profile-page";

export default async function Page() {
  const session = await requireSession(["health_officer"]);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id }, select: { name:true,email:true,role:true,createdAt:true,healthOfficerProfile:true } });
  const profile=user.healthOfficerProfile;
  return <ProfilePage title="Health Officer profile" description="Maintain your professional, facility, and assigned-location information." user={user} status={{label:"Approval",value:profile?.isApproved?"Approved":"Pending approval"}} fields={[{name:"employeeNumber",label:"Employee number",value:profile?.employeeNumber},{name:"facilityName",label:"Health facility",value:profile?.facilityName},{name:"specialization",label:"Specialization",value:profile?.specialization},{name:"province",label:"Assigned province",value:profile?.province},{name:"district",label:"Assigned district",value:profile?.district}]} action={updateHealthOfficerProfile}/>;
}
