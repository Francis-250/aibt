import { BrainCircuit } from "lucide-react";
import { PageHeader, RiskBadge, EmptyState } from "@/components/dashboard-ui";
import { PredictionChart } from "@/components/prediction-chart";
import { PredictionFormDialog } from "@/components/prediction-form-dialog";
import prisma from "@/lib/prisma";
import { predictionLocationName, predictionLocationPath } from "@/lib/location";

export default async function Page() {
  const [rows, activeModel] = await Promise.all([
    prisma.prediction.findMany({ orderBy: { createdAt: "desc" }, take: 30, include: { model: true } }),
    prisma.mLModel.findFirst({ where: { status: "ACTIVE" }, orderBy: { activatedAt: "desc" } }),
  ]);
  const chartData = rows.slice(0, 10).reverse().map(item=>({ location: predictionLocationName(item), probability: Math.round(item.outbreakProbability*100), confidence: Math.round(item.confidenceScore*100) }));
  return <><PageHeader eyebrow="AI prediction" title="Outbreak risk analysis" description="Estimate 30-day risk for a province, district, sector, cell, or village." action={<PredictionFormDialog/>}/>
    <div className="mb-6 flex items-center gap-3 rounded border border-slate-200 bg-white p-4"><span className="grid size-9 place-items-center rounded bg-blue-50 text-blue-700"><BrainCircuit size={18}/></span><div><p className="text-sm font-medium">{activeModel ? `${activeModel.name} v${activeModel.version}` : "No active AI model"}</p><p className="text-xs text-slate-500">{activeModel ? `Active ${activeModel.algorithm} model` : "Ask an Administrator to register an active model before generating predictions."}</p></div></div>
    {chartData.length > 0 && <section className="mb-6 rounded border border-slate-200 bg-white p-4"><div className="mb-4"><h2 className="text-sm font-medium">Recent geographic risk</h2><p className="text-xs text-slate-400">Probability and model confidence, shown as percentages</p></div><PredictionChart data={chartData}/></section>}
    <section className="rounded border border-slate-200 bg-white"><div className="border-b border-slate-200 px-4 py-3"><h2 className="text-sm font-medium">Prediction history</h2></div><div className="divide-y divide-slate-100">{rows.map(item=><article key={item.id} className="p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-medium">{predictionLocationName(item)} <span className="text-xs font-normal text-slate-400">· {item.geographicLevel.toLowerCase()}</span></p><p className="mt-1 text-xs text-slate-400">{predictionLocationPath(item)} · {item.model.name} v{item.model.version} · {item.predictionDate.toLocaleDateString()}</p></div><RiskBadge risk={item.riskLevel}/></div><div className="mt-4 grid grid-cols-3 gap-4"><p><strong className="block text-lg">{Math.round(item.outbreakProbability*100)}%</strong><span className="text-xs text-slate-400">Probability</span></p><p><strong className="block text-lg">{item.predictedCaseCount}</strong><span className="text-xs text-slate-400">Expected cases</span></p><p><strong className="block text-lg">{Math.round(item.confidenceScore*100)}%</strong><span className="text-xs text-slate-400">Confidence</span></p></div><p className="mt-4 rounded bg-slate-50 p-3 text-xs leading-5 text-slate-600">{item.recommendation}</p></article>)}{!rows.length&&<div className="p-4"><EmptyState>No predictions yet. Register an active model, add validated cases and environmental data, then run the AI prediction.</EmptyState></div>}</div></section>
  </>;
}
