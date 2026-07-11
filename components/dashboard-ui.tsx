import { AlertTriangle, ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="mb-7 flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-medium text-blue-700">{eyebrow}</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h1><p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p></div>{action}</div>;
}

export function StatCard({ label, value, detail, trend }: { label: string; value: string | number; detail: string; trend?: "up" | "down" }) {
  return <div className="rounded border border-slate-200 bg-white p-4"><div className="flex items-center justify-between"><p className="text-xs text-slate-500">{label}</p>{trend === "up" ? <ArrowUp size={14} className="text-rose-500"/> : trend === "down" ? <ArrowDown size={14} className="text-blue-600"/> : null}</div><p className="mt-3 text-2xl font-semibold">{value}</p><p className="mt-1 text-xs text-slate-400">{detail}</p></div>;
}

export function RiskBadge({ risk }: { risk: string }) {
  const styles: Record<string,string> = { LOW:"bg-blue-50 text-blue-700", MODERATE:"bg-amber-50 text-amber-700", HIGH:"bg-orange-50 text-orange-700", CRITICAL:"bg-rose-50 text-rose-700" };
  return <span className={cn("inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium", styles[risk] ?? "bg-slate-100 text-slate-600")}><AlertTriangle size={11}/>{risk}</span>;
}

export function EmptyState({ children }: { children: React.ReactNode }) { return <div className="rounded border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">{children}</div> }
