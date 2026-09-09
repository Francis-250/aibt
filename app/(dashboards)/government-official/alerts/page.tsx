import { acknowledgeAlert } from "@/actions/surveillance";
import {
  EmptyState,
  PageHeader,
  RiskBadge,
} from "@/components/dashboard-ui";
import { predictionLocationPath } from "@/lib/location";
import prisma from "@/lib/prisma";

export default async function Page() {
  const rows = await prisma.alert.findMany({
    orderBy: { issuedAt: "desc" },
    include: { prediction: true },
  });

  return (
    <>
      <PageHeader
        eyebrow="National response"
        title="Priority alerts"
        description="Monitor and acknowledge outbreak warnings requiring government awareness or coordination."
      />
      <div className="space-y-4">
        {rows.map((alert) => (
          <article key={alert.id} className="rounded border bg-white p-6">
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <div className="flex gap-3">
                  <h2 className="font-bold">{alert.title}</h2>
                  <RiskBadge risk={alert.riskLevel} />
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  {alert.prediction
                    ? predictionLocationPath(alert.prediction)
                    : [alert.province, alert.district]
                        .filter(Boolean)
                        .join(" / ")}
                </p>
                <p className="mt-4 text-sm">{alert.message}</p>
              </div>
              {alert.status === "ACTIVE" && (
                <form
                  action={async () => {
                    "use server";
                    await acknowledgeAlert(alert.id);
                  }}
                >
                  <button className="rounded border border-slate-900 px-4 py-2 text-sm font-bold text-slate-900">
                    Acknowledge
                  </button>
                </form>
              )}
            </div>
          </article>
        ))}
        {!rows.length && (
          <EmptyState>No national alerts currently require attention.</EmptyState>
        )}
      </div>
    </>
  );
}
