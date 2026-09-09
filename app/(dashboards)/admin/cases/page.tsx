import { requireSession } from "@/lib/session";
import { CaseDetailDialog } from "@/components/case-detail-dialog";
import { PageHeader, RiskBadge } from "@/components/dashboard-ui";
import prisma from "@/lib/prisma";

export default async function Page() {
  const session = await requireSession(["admin"]);
  const rows = await prisma.diseaseCase.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { submittedBy: { select: { name: true } }, validatedBy: { select: { name: true } } },
  });

  return (
    <>
      <PageHeader
        eyebrow="Data governance"
        title="Disease case records"
        description="Monitor submitted and validated surveillance records across all reporting regions."
      />
      <div className="overflow-hidden rounded border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="p-4">Case</th>
              <th>Location</th>
              <th>Classification</th>
              <th>Validation</th>
              <th>Officer</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((c) => (
              <tr key={c.id}>
                <td className="p-4 font-bold">{c.caseCode}</td>
                <td>{c.district}, {c.province}</td>
                <td>
                  <RiskBadge risk={c.status === "CONFIRMED" ? "HIGH" : "MODERATE"} />
                </td>
                <td>{c.validationStatus}</td>
                <td>{c.submittedBy.name}</td>
                <td className="p-4">
                  <CaseDetailDialog caseId={c.id} userRole={session.role} userId={session.user.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}