import { requireSession } from "@/lib/session";
import { validateDiseaseCase } from "@/actions/surveillance";
import { CaseFormDialog } from "@/components/case-form-dialog";
import { CaseDetailDialog } from "@/components/case-detail-dialog";
import { PageHeader, RiskBadge } from "@/components/dashboard-ui";
import prisma from "@/lib/prisma";

export default async function Page() {
  const session = await requireSession(["health_officer", "admin"]);
  const cases = await prisma.diseaseCase.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { submittedBy: { select: { name: true } }, validatedBy: { select: { name: true } } },
  });

  return (
    <>
      <PageHeader
        eyebrow="Disease surveillance"
        title="Typhoid case management"
        description="Review clinical records and validate case data before prediction analysis."
        action={<CaseFormDialog />}
      />
      <section className="overflow-hidden rounded border bg-white">
        <div className="border-b p-5 font-bold">Recent case records</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="p-4">Case</th>
                <th>Location</th>
                <th>Status</th>
                <th>Submitted by</th>
                <th>Validation</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {cases.map((item) => (
                <tr key={item.id}>
                  <td className="p-4 font-semibold">{item.caseCode}</td>
                  <td>{item.district}, {item.province}</td>
                  <td>
                    <RiskBadge risk={item.status === "CONFIRMED" ? "HIGH" : "MODERATE"} />
                  </td>
                  <td>{item.submittedBy.name}</td>
                  <td>{item.validationStatus}</td>
                  <td className="flex gap-3 p-4">
                    <CaseDetailDialog caseId={item.id} userRole={session.role} userId={session.user.id} />
                    {item.validationStatus === "PENDING" && (
                      <>
                        <form
                          action={async () => {
                            "use server";
                            await validateDiseaseCase(item.id, "VALIDATED");
                          }}
                        >
                          <button className="text-xs font-bold text-blue-700">Validate</button>
                        </form>
                        <form
                          action={async () => {
                            "use server";
                            await validateDiseaseCase(item.id, "REJECTED");
                          }}
                        >
                          <button className="text-xs font-bold text-rose-600">Reject</button>
                        </form>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
