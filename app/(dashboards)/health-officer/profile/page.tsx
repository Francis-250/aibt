import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { updateHealthOfficerProfile } from "@/actions/profile";
import { ProfilePage } from "@/components/profile-page";

export default async function Page() {
  const session = await requireSession(["health_officer"]);
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { name: true, email: true, role: true, createdAt: true, phone: true, healthOfficerProfile: true },
  });
  const profile = user.healthOfficerProfile;

  const statusLabel = {
    PENDING: "Pending verification",
    VERIFIED: "Verified",
    REJECTED: "Rejected",
    ACTIVE: "Active",
    SUSPENDED: "Suspended",
  };

  return (
    <ProfilePage
      title="Health Officer profile"
      description="Maintain your professional, facility, and assigned-location information."
      user={user}
      status={{ label: "Status", value: profile?.status ? statusLabel[profile.status as keyof typeof statusLabel] : "Not registered" }}
      fields={[
        { name: "name", label: "Full name", value: user.name },
        { name: "email", label: "Email address", value: user.email, readOnly: true },
        { name: "phone", label: "Phone number", value: user.phone ?? "" },
        { name: "employeeNumber", label: "Employee number", value: profile?.employeeNumber ?? "" },
        { name: "facilityName", label: "Health facility", value: profile?.facilityName ?? "" },
        { name: "specialization", label: "Specialization", value: profile?.specialization ?? "" },
        { name: "province", label: "Assigned province", value: profile?.province ?? "" },
        { name: "district", label: "Assigned district", value: profile?.district ?? "" },
        { name: "qualification", label: "Qualification", value: profile?.qualification ?? "", placeholder: "e.g., MPH, MBChB" },
        { name: "yearsExperience", label: "Years of experience", value: profile?.yearsExperience?.toString() ?? "", placeholder: "e.g., 5" },
      ]}
      action={updateHealthOfficerProfile}
    />
  );
}