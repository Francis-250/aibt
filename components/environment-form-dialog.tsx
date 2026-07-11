"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { createEnvironmentalRecord } from "@/actions/surveillance";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function EnvironmentFormDialog() {
  const [open, setOpen] = useState(false);
  const input = "w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";
  async function submit(formData: FormData) { await createEnvironmentalRecord(formData); setOpen(false); }
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button className="rounded bg-slate-950 text-white"><Plus/> Add observation</Button></DialogTrigger><DialogContent className="max-h-[90vh] overflow-y-auto rounded sm:max-w-2xl"><DialogHeader><DialogTitle>Add environmental observation</DialogTitle><DialogDescription>Record conditions that can influence water-borne disease transmission.</DialogDescription></DialogHeader><form action={submit} className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold">Province<input name="province" required className={`mt-1 ${input}`}/></label><label className="text-xs font-semibold">District<input name="district" required className={`mt-1 ${input}`}/></label><label className="text-xs font-semibold">Sector<input name="sector" className={`mt-1 ${input}`}/></label><label className="text-xs font-semibold">Observation date<input name="recordedAt" type="date" required className={`mt-1 ${input}`}/></label>{[["temperatureCelsius","Temperature °C"],["rainfallMm","Rainfall mm"],["humidityPercent","Humidity %"],["waterQualityIndex","Water quality index"],["sanitationCoverage","Sanitation coverage %"]].map(([name,label])=><label key={name} className="text-xs font-semibold">{label}<input name={name} type="number" step="0.1" className={`mt-1 ${input}`}/></label>)}<label className="flex items-center gap-2 rounded border border-slate-300 px-3 text-xs font-semibold"><input name="floodingObserved" type="checkbox"/> Flooding observed</label><DialogFooter className="mt-2 sm:col-span-2"><Button type="button" variant="outline" className="rounded" onClick={()=>setOpen(false)}>Cancel</Button><Button className="rounded bg-slate-950 text-white">Save observation</Button></DialogFooter></form></DialogContent></Dialog>;
}
