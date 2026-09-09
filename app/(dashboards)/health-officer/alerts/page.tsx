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
    take: 50,
    include: { prediction: true },
  });

  return (
    <>
      <PageHeader
        eyebrow="Response coordination"
        title="Outbreak alerts"
        description="Prioritized high-risk signals from geographic predictions."
      />
      <div className="space-y-4">
        {rows.map((alert) => (
          <article key={alert.id} className="rounded border bg-white p-6">
            <div className="flex justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="font-bold">{alert.title}</h2>
                  <RiskBadge risk={alert.riskLevel} />
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  {alert.prediction
                    ? predictionLocationPath(alert.prediction)
                    : [alert.province, alert.district]
                        .filter(Boolean)
                        .join(" / ")}{" "}
                  · {alert.issuedAt.toLocaleString()}
                </p>
                <p className="mt-4 text-sm leading-6">{alert.message}</p>
              </div>
              {alert.status === "ACTIVE" && (
                <form
                  action={async () => {
                    "use server";
                    await acknowledgeAlert(alert.id);
                  }}
                >
                  <button className="rounded bg-slate-900 px-4 py-2 text-sm font-bold text-white">
                    Acknowledge
                  </button>
                </form>
              )}
            </div>
          </article>
        ))}
        {!rows.length && (
          <EmptyState>No outbreak alerts have been generated.</EmptyState>
        )}
      </div>
    </>
  );
}
