import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { updateGovernmentOfficialProfile } from "@/actions/profile";
import { ProfilePage } from "@/components/profile-page";

export default async function Page() {
  const session = await requireSession(["government_official"]);
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { name: true, email: true, role: true, createdAt: true, phone: true, governmentOfficialProfile: true },
  });
  const profile = user.governmentOfficialProfile;

  const statusLabel = {
    PENDING: "Pending approval",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    ACTIVE: "Active",
    SUSPENDED: "Suspended",
  };

  return (
    <ProfilePage
      title="Government Official profile"
      description="Maintain your institution, position, and geographic responsibility."
      user={user}
      status={{ label: "Status", value: profile?.status ? statusLabel[profile.status as keyof typeof statusLabel] : "Not registered" }}
      fields={[
        { name: "name", label: "Full name", value: user.name },
        { name: "email", label: "Email address", value: user.email, readOnly: true },
        { name: "phone", label: "Phone number", value: user.phone ?? "" },
        { name: "institution", label: "Institution", value: profile?.institution ?? "" },
        { name: "position", label: "Position", value: profile?.position ?? "" },
        { name: "department", label: "Department", value: profile?.department ?? "" },
        { name: "province", label: "Responsible province", value: profile?.province ?? "" },
        { name: "district", label: "Responsible district", value: profile?.district ?? "" },
      ]}
      action={updateGovernmentOfficialProfile}
    />
  );
}