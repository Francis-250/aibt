import prisma from "@/lib/prisma";
import { updateUserRole, setUserSuspension, toggleUserActive } from "@/actions/admin";
import { PageHeader } from "@/components/dashboard-ui";
import { CreateUserDialog } from "@/components/create-user-dialog";
import { UserDetailsDialog } from "@/components/user-details-dialog";

export default async function Page() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      healthOfficerProfile: { select: { status: true, employeeNumber: true, facilityName: true, province: true, district: true } },
      governmentOfficialProfile: { select: { status: true, institution: true, position: true, department: true, province: true, district: true } },
    },
  });

  function getStatusBadge(user: typeof users[0]) {
    if (user.banned && (!user.banExpires || user.banExpires > new Date())) {
      return <span className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium bg-rose-50 text-rose-700">Suspended</span>;
    }
    if (!user.isActive) {
      return <span className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium bg-amber-50 text-amber-700">Inactive</span>;
    }
    if (user.role === "health_officer" && user.healthOfficerProfile) {
      const status = user.healthOfficerProfile.status;
      const colors: Record<string, string> = {
        PENDING: "bg-amber-50 text-amber-700",
        VERIFIED: "bg-blue-50 text-blue-700",
        REJECTED: "bg-rose-50 text-rose-700",
        ACTIVE: "bg-green-50 text-green-700",
        SUSPENDED: "bg-rose-50 text-rose-700",
      };
      return <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium ${colors[status] ?? "bg-slate-100 text-slate-600"}`}>{status}</span>;
    }
    if (user.role === "government_official" && user.governmentOfficialProfile) {
      const status = user.governmentOfficialProfile.status;
      const colors: Record<string, string> = {
        PENDING: "bg-amber-50 text-amber-700",
        APPROVED: "bg-blue-50 text-blue-700",
        REJECTED: "bg-rose-50 text-rose-700",
        ACTIVE: "bg-green-50 text-green-700",
        SUSPENDED: "bg-rose-50 text-rose-700",
      };
      return <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium ${colors[status] ?? "bg-slate-100 text-slate-600"}`}>{status}</span>;
    }
    return <span className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium bg-green-50 text-green-700">Active</span>;
  }

  return (
    <>
      <PageHeader
        eyebrow="Access control"
        title="Users and roles"
        description="Manage Administrator, Health Officer, and Government Official access."
        action={<CreateUserDialog />}
      />
      <div className="overflow-hidden rounded border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="p-4">User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="p-4 font-semibold">{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role?.replaceAll("_", " ")}</td>
                <td className="p-4">{getStatusBadge(u)}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <UserDetailsDialog user={{ name: u.name, email: u.email, role: u.role ?? "", createdAt: u.createdAt.toISOString(), isActive: u.isActive, banned: u.banned, phone: u.phone, profile: u.role === "government_official" ? u.governmentOfficialProfile : u.healthOfficerProfile }} />
                    <div className="flex flex-wrap gap-2">
                    <form action={updateUserRole.bind(null, u.id)} className="flex gap-2">
                      <select
                        name="role"
                        defaultValue={u.role ?? "health_officer"}
                        className="rounded border px-2 py-1 text-xs"
                      >
                        <option value="health_officer">Health Officer</option>
                        <option value="government_official">Government Official</option>
                        <option value="admin">Administrator</option>
                      </select>
                      <button className="font-bold text-slate-900 text-xs">Save</button>
                    </form>
                    {u.banned && (!u.banExpires || u.banExpires > new Date()) ? (
                      <form
                        action={async () => {
                          "use server";
                          await setUserSuspension(u.id, false);
                        }}
                        className="flex gap-2"
                      >
                        <button className="text-xs font-bold text-green-700">Reactivate</button>
                      </form>
                    ) : (
                      <form
                        action={async (formData) => {
                          "use server";
                          await setUserSuspension(u.id, true, String(formData.get("reason") ?? ""));
                        }}
                        className="flex gap-2"
                      >
                        <input name="reason" placeholder="Reason" className="rounded border px-2 py-1 text-xs" />
                        <button className="text-xs font-bold text-rose-600">Suspend</button>
                      </form>
                    )}
                    {u.isActive ? (
                      <form
                        action={async () => {
                          "use server";
                          await toggleUserActive(u.id, false);
                        }}
                        className="flex gap-2"
                      >
                        <button className="text-xs font-bold text-amber-700">Deactivate</button>
                      </form>
                    ) : (
                      <form
                        action={async () => {
                          "use server";
                          await toggleUserActive(u.id, true);
                        }}
                        className="flex gap-2"
                      >
                        <button className="text-xs font-bold text-green-700">Activate</button>
                      </form>
                    )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
