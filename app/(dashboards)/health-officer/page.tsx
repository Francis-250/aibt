import Link from "next/link";
import prisma from "@/lib/prisma";
import { PageHeader, RiskBadge, StatCard } from "@/components/dashboard-ui";

export default async function Page() {
  const since = new Date(); since.setDate(since.getDate() - 30);
  const [cases, pending, observations, alerts, predictions] = await Promise.all([
    prisma.diseaseCase.count({ where: { createdAt: { gte: since } } }),
    prisma.diseaseCase.count({ where: { validationStatus: "PENDING" } }),
    prisma.environmentalData.count({ where: { recordedAt: { gte: since } } }),
    prisma.alert.count({ where: { status: "ACTIVE" } }),
    prisma.prediction.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
  ]);
  return <><PageHeader eyebrow="Health Officer" title="Surveillance overview" description="Current reporting and outbreak risk." action={<Link href="/health-officer/cases" className="rounded bg-slate-950 px-4 py-2 text-sm font-medium text-white">Report case</Link>}/><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><StatCard label="Cases" value={cases} detail="Last 30 days"/><StatCard label="Pending validation" value={pending} detail="Needs review"/><StatCard label="Observations" value={observations} detail="Last 30 days"/><StatCard label="Active alerts" value={alerts} detail="Requires attention"/></div><section className="mt-6 rounded border border-slate-200 bg-white"><div className="flex items-center justify-between border-b border-slate-200 px-4 py-3"><h2 className="text-sm font-medium">Recent predictions</h2><Link href="/health-officer/predictions" className="text-xs text-blue-700">View all</Link></div><div className="divide-y divide-slate-100">{predictions.map(item=><div key={item.id} className="flex items-center justify-between px-4 py-3"><div><p className="text-sm font-medium">{item.district}, {item.province}</p><p className="mt-0.5 text-xs text-slate-400">{Math.round(item.outbreakProbability*100)}% probability · {item.predictedCaseCount} expected cases</p></div><RiskBadge risk={item.riskLevel}/></div>)}{!predictions.length && <p className="p-8 text-center text-sm text-slate-400">No predictions yet.</p>}</div></section></>;
}
