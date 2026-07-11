import Link from "next/link";
import { Activity, LockKeyhole } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="flex h-screen items-center justify-center overflow-hidden bg-slate-100 px-4 py-3">
    <div className="w-full max-w-[360px]">
      <Link href="/" className="mb-4 flex items-center justify-center gap-2.5 text-sm font-bold text-slate-950">
        <span className="grid size-8 place-items-center rounded bg-blue-900 text-white"><Activity size={18}/></span>
        <span>TyphoidWatch <span className="font-medium text-slate-400">Rwanda</span></span>
      </Link>
      <div className="rounded border border-slate-200 bg-white p-5 shadow-sm">{children}</div>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-slate-400"><LockKeyhole size={11}/> Protected health-surveillance access</p>
    </div>
  </main>;
}
