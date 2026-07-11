import prisma from "@/lib/prisma";
import { predictionLocationName, predictionLocationPath } from "@/lib/location";
import { PageHeader, RiskBadge, EmptyState } from "@/components/dashboard-ui";
import { PredictionChart } from "@/components/prediction-chart";

export default async function Page() {
  const rows = await prisma.prediction.findMany({
    orderBy: { predictionDate: "desc" },
    take: 100,
    include: { model: true },
  });
  const chartData = rows
    .slice(0, 12)
    .reverse()
    .map((item) => ({
      location: predictionLocationName(item),
      probability: Math.round(item.outbreakProbability * 100),
      confidence: Math.round(item.confidenceScore * 100),
    }));
  return (
    <>
      <PageHeader
        eyebrow="National risk analysis"
        title="Geographic predictions"
        description="Compare outbreak risk from province level down to individual villages."
      />
      {chartData.length > 0 && (
        <section className="mb-6 rounded border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-medium">Risk and confidence</h2>
          <p className="mb-4 text-xs text-slate-400">
            Latest prediction results across all geographic levels
          </p>
          <PredictionChart data={chartData} />
        </section>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {rows.map((item) => (
          <article key={item.id} className="rounded border bg-white p-5">
            <div className="flex justify-between gap-3">
              <div>
                <h2 className="text-sm font-medium">
                  {predictionLocationName(item)}{" "}
                  <span className="text-xs font-normal text-slate-400">
                    · {item.geographicLevel.toLowerCase()}
                  </span>
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  {predictionLocationPath(item)}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {item.model.name} v{item.model.version}
                </p>
              </div>
              <RiskBadge risk={item.riskLevel} />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-4">
              <p>
                <strong className="block text-xl">
                  {Math.round(item.outbreakProbability * 100)}%
                </strong>
                <span className="text-xs text-slate-500">Probability</span>
              </p>
              <p>
                <strong className="block text-xl">
                  {item.predictedCaseCount}
                </strong>
                <span className="text-xs text-slate-500">Expected</span>
              </p>
              <p>
                <strong className="block text-xl">
                  {Math.round(item.confidenceScore * 100)}%
                </strong>
                <span className="text-xs text-slate-500">Confidence</span>
              </p>
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-600">
              {item.recommendation}
            </p>
          </article>
        ))}
        {!rows.length && (
          <EmptyState>No geographic predictions are available.</EmptyState>
        )}
      </div>
    </>
  );
}
