import prisma from "@/lib/prisma";
import { approveGovernmentOfficial, suspendGovernmentOfficial } from "@/actions/admin";
import { PageHeader } from "@/components/dashboard-ui";

export default async function Page() {
  const profiles = await prisma.governmentOfficialProfile.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true, createdAt: true, isActive: true } },
      approvedBy: { select: { name: true } },
    },
  });

  function getStatusBadge(status: string) {
    const colors: Record<string, string> = {
      PENDING: "bg-amber-50 text-amber-700",
      APPROVED: "bg-blue-50 text-blue-700",
      REJECTED: "bg-rose-50 text-rose-700",
      ACTIVE: "bg-green-50 text-green-700",
      SUSPENDED: "bg-rose-50 text-rose-700",
    };
    return (
      <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium ${colors[status] ?? "bg-slate-100 text-slate-600"}`}>
        {status}
      </span>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Approval"
        title="Government Officials"
        description="Review and manage Government Official registration approvals and account status."
      />
      <div className="overflow-hidden rounded border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="p-4">Official</th>
              <th>Email</th>
              <th>Institution</th>
              <th>Position</th>
              <th>Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {profiles.map((p) => (
              <tr key={p.id}>
                <td className="p-4 font-semibold">{p.user.name}</td>
                <td>{p.user.email}</td>
                <td>{p.institution ?? "—"}</td>
                <td>{p.position ?? "—"}</td>
                <td className="p-4">{getStatusBadge(p.status)}</td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {p.status === "PENDING" && (
                      <>
                        <form action={approveGovernmentOfficial.bind(null, p.id, "APPROVE")} className="flex gap-2">
                          <button className="text-xs font-bold text-green-700">Approve</button>
                        </form>
                        <form
                          action={async (formData) => {
                            await approveGovernmentOfficial(p.id, "REJECT", String(formData.get("reason") ?? ""));
                          }}
                          className="flex gap-2"
                        >
                          <input name="reason" placeholder="Reason" className="rounded border px-2 py-1 text-xs" />
                          <button className="text-xs font-bold text-rose-600">Reject</button>
                        </form>
                      </>
                    )}
                    {(p.status === "APPROVED" || p.status === "ACTIVE") && (
                      <form
                        action={async (formData) => {
                          await suspendGovernmentOfficial(p.id, String(formData.get("reason") ?? ""));
                        }}
                        className="flex gap-2"
                      >
                        <input name="reason" placeholder="Reason" className="rounded border px-2 py-1 text-xs" />
                        <button className="text-xs font-bold text-amber-700">Suspend</button>
                      </form>
                    )}
                    {p.status === "REJECTED" && <span className="text-xs text-slate-500">Rejected</span>}
                    {p.status === "SUSPENDED" && <span className="text-xs text-slate-500">Suspended</span>}
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