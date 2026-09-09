import prisma from "@/lib/prisma";
import { verifyHealthOfficer, activateHealthOfficer, suspendHealthOfficer } from "@/actions/admin";
import { PageHeader } from "@/components/dashboard-ui";

export default async function Page() {
  const profiles = await prisma.healthOfficerProfile.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true, createdAt: true, isActive: true } },
      verifiedBy: { select: { name: true } },
    },
  });

  function getStatusBadge(status: string) {
    const colors: Record<string, string> = {
      PENDING: "bg-amber-50 text-amber-700",
      VERIFIED: "bg-blue-50 text-blue-700",
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
        eyebrow="Verification"
        title="Health Officers"
        description="Review and manage Health Officer verification status and account activation."
      />
      <div className="overflow-hidden rounded border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="p-4">Officer</th>
              <th>Email</th>
              <th>Facility</th>
              <th>Location</th>
              <th>Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {profiles.map((p) => (
              <tr key={p.id}>
                <td className="p-4 font-semibold">{p.user.name}</td>
                <td>{p.user.email}</td>
                <td>{p.facilityName ?? "—"}</td>
                <td>{p.district ? `${p.district}, ${p.province}` : "—"}</td>
                <td className="p-4">{getStatusBadge(p.status)}</td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {p.status === "PENDING" && (
                      <>
                        <form action={verifyHealthOfficer.bind(null, p.id, "VERIFY")} className="flex gap-2">
                          <button className="text-xs font-bold text-green-700">Verify</button>
                        </form>
                        <form
                          action={async (formData) => {
                            await verifyHealthOfficer(p.id, "REJECT", String(formData.get("reason") ?? ""));
                          }}
                          className="flex gap-2"
                        >
                          <input name="reason" placeholder="Reason" className="rounded border px-2 py-1 text-xs" />
                          <button className="text-xs font-bold text-rose-600">Reject</button>
                        </form>
                      </>
                    )}
                    {p.status === "VERIFIED" && (
                      <form action={activateHealthOfficer.bind(null, p.id)} className="flex gap-2">
                        <button className="text-xs font-bold text-blue-700">Activate</button>
                      </form>
                    )}
                    {(p.status === "ACTIVE" || p.status === "VERIFIED") && (
                      <form
                        action={async (formData) => {
                          await suspendHealthOfficer(p.id, String(formData.get("reason") ?? ""));
                        }}
                        className="flex gap-2"
                      >
                        <input name="reason" placeholder="Reason" className="rounded border px-2 py-1 text-xs" />
                        <button className="text-xs font-bold text-amber-700">Suspend</button>
                      </form>
                    )}
                    {p.status === "REJECTED" && (
                      <span className="text-xs text-slate-500">Rejected</span>
                    )}
                    {p.status === "SUSPENDED" && (
                      <span className="text-xs text-slate-500">Suspended</span>
                    )}
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