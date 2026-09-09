import { requireSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import { exportDataset } from "@/actions/reports";
import { PageHeader } from "@/components/dashboard-ui";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText } from "lucide-react";

export default async function Page() {
  const session = await requireSession(["health_officer"]);
  const exports = await prisma.datasetExport.findMany({
    where: { requestedById: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <>
      <PageHeader
        eyebrow="Data exports"
        title="Dataset exports"
        description="Export collected data as complete datasets in CSV or Excel format with optional filters."
        action={
          <Button className="rounded bg-slate-950 text-white">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            New Export
          </Button>
        }
      />
      <div className="grid gap-4 md:grid-cols-3">
        <ExportCard
          type="disease_cases"
          title="Disease Cases"
          description="Export all typhoid case records with patient details, location, and clinical data."
          icon={FileText}
        />
        <ExportCard
          type="environmental_data"
          title="Environmental Data"
          description="Export environmental observations including weather, water quality, and sanitation data."
          icon={FileSpreadsheet}
        />
      </div>

      {exports.length > 0 && (
        <div className="mt-8 overflow-hidden rounded border bg-white">
          <div className="border-b p-4 font-bold">Recent exports</div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="p-4">Type</th>
                <th>Format</th>
                <th>Status</th>
                <th>Records</th>
                <th className="p-4">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {exports.map((e) => (
                <tr key={e.id}>
                  <td className="p-4 font-medium">{e.type.replace("_", " ")}</td>
                  <td className="p-4">{e.format}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium ${
                      e.status === "READY" ? "bg-green-50 text-green-700" :
                      e.status === "GENERATING" ? "bg-blue-50 text-blue-700" :
                      e.status === "FAILED" ? "bg-rose-50 text-rose-700" :
                      "bg-amber-50 text-amber-700"
                    }`}>
                      {e.status}
                    </span>
                  </td>
                  <td className="p-4">{e.recordCount ?? "—"}</td>
                  <td className="p-4 text-xs text-slate-500">{new Date(e.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function ExportCard({ type, title, description, icon: Icon }: { type: string; title: string; description: string; icon: React.FC<{ className?: string }> }) {
  return (
    <div className="rounded border border-slate-200 bg-white p-5 hover:border-blue-300 transition-colors">
      <div className="flex items-start gap-3">
        <div className="rounded bg-blue-50 p-2"><Icon className="h-5 w-5 text-blue-700" /></div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
      </div>
      <form action={async (formData) => { await exportDataset(formData); }} className="mt-4">
        <input type="hidden" name="type" value={type} />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold">
            Format
            <select name="format" className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100">
              <option value="CSV">CSV</option>
              <option value="EXCEL">Excel</option>
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
            Start Date (optional)
            <input name="startDate" type="date" className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
          </label>
          <label className="text-xs font-semibold">
            End Date (optional)
            <input name="endDate" type="date" className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
          </label>
        </div>
        <div className="mt-4">
          <Button type="submit" className="rounded bg-slate-950 text-white w-full sm:w-auto">
            Export {type.replace("_", " ")}
          </Button>
        </div>
      </form>
    </div>
  );
}