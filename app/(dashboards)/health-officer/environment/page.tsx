import { EnvironmentFormDialog } from "@/components/environment-form-dialog";
import { PageHeader } from "@/components/dashboard-ui";
import prisma from "@/lib/prisma";

export default async function Page() {
  const rows = await prisma.environmentalData.findMany({ orderBy: { recordedAt: "desc" }, take: 30 });
  return <><PageHeader eyebrow="Environmental monitoring" title="Environmental data" description="Review local conditions influencing typhoid transmission and prediction context." action={<EnvironmentFormDialog/>}/><section className="overflow-hidden rounded border bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Location</th><th>Date</th><th>Rainfall</th><th>Water quality</th><th>Sanitation</th><th>Flooding</th></tr></thead><tbody className="divide-y">{rows.map(row=><tr key={row.id}><td className="p-4 font-semibold">{row.district}, {row.province}</td><td>{row.recordedAt.toLocaleDateString()}</td><td>{row.rainfallMm ?? "—"} mm</td><td>{row.waterQualityIndex ?? "—"}</td><td>{row.sanitationCoverage ?? "—"}%</td><td>{row.floodingObserved ? "Observed" : "No"}</td></tr>)}</tbody></table></section></>;
}
