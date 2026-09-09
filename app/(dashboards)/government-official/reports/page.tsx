import { requireSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import { generateReport } from "@/actions/reports";
import { PageHeader, EmptyState } from "@/components/dashboard-ui";
import { Button } from "@/components/ui/button";
import { FileText, Filter } from "lucide-react";

export default async function Page() {
  const session = await requireSession(["government_official"]);
  const reports = await prisma.report.findMany({
    where: { generatedById: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <>
      <PageHeader
        eyebrow="Reports"
        title="My reports"
        description="Generate customizable reports based on collected data with filters, date ranges, and export formats."
        action={
          <Button className="rounded bg-slate-950 text-white">
            <FileText className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        }
      />

      <ReportGeneratorForm />

      {reports.length > 0 ? (
        <div className="mt-8 overflow-hidden rounded border bg-white">
          <div className="border-b p-4 font-bold">Recent reports</div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="p-4">Title</th>
                <th>Type</th>
                <th>Period</th>
                <th>Format</th>
                <th>Status</th>
                <th className="p-4">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {reports.map((r) => (
                <tr key={r.id}>
                  <td className="p-4 font-medium">{r.title}</td>
                  <td className="p-4 text-xs">{r.type}</td>
                  <td className="p-4 text-xs">
                    {new Date(r.periodStart).toLocaleDateString()} - {new Date(r.periodEnd).toLocaleDateString()}
                  </td>
                  <td className="p-4">{r.fileFormat ?? "—"}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium ${
                      r.status === "READY" ? "bg-green-50 text-green-700" :
                      r.status === "GENERATING" ? "bg-blue-50 text-blue-700" :
                      r.status === "FAILED" ? "bg-rose-50 text-rose-700" :
                      "bg-amber-50 text-amber-700"
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-slate-500">{new Date(r.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState>No reports have been generated yet.</EmptyState>
      )}
    </>
  );
}

function ReportGeneratorForm() {
  return (
    <div className="mt-6 rounded border border-slate-200 bg-white p-5">
      <h3 className="font-semibold mb-4">Generate New Report</h3>
      <form action={async (formData) => { await generateReport(formData); }} className="grid gap-4 md:grid-cols-3">
        <label className="text-xs font-semibold">
          Title
          <input name="title" required placeholder="e.g., Weekly Typhoid Summary - Gasabo" className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
        </label>
        <label className="text-xs font-semibold">
          Report Type
          <select name="type" required className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100">
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
            <option value="ANNUAL">Annual</option>
            <option value="PREDICTION">Prediction</option>
            <option value="REGIONAL">Regional</option>
            <option value="NATIONAL">National</option>
            <option value="SUMMARY">Summary</option>
          </select>
        </label>
        <label className="text-xs font-semibold">
          Export Format
          <select name="format" required className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100">
            <option value="CSV">CSV</option>
            <option value="EXCEL">Excel</option>
            <option value="PDF">PDF</option>
          </select>
        </label>
        <label className="text-xs font-semibold">
          Province (optional)
          <input name="province" type="text" placeholder="e.g., Kigali City" className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
        </label>
        <label className="text-xs font-semibold">
          District (optional)
          <input name="district" type="text" placeholder="e.g., Gasabo" className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
        </label>
        <label className="text-xs font-semibold">
          Period Start
          <input name="periodStart" type="date" required className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
        </label>
        <label className="text-xs font-semibold">
          Period End
          <input name="periodEnd" type="date" required className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
        </label>
        <label className="text-xs font-semibold md:col-span-2">
          Filters (JSON, optional)
          <textarea name="filters" rows={3} placeholder='{"status": "CONFIRMED", "validationStatus": "VALIDATED"}' className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-mono text-xs" />
        </label>
        <div className="md:col-span-3">
          <Button type="submit" className="rounded bg-slate-950 text-white">
            <Filter className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </form>
    </div>
  );
}