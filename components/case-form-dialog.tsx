"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { createDiseaseCase } from "@/actions/surveillance";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function CaseFormDialog() {
  const [open, setOpen] = useState(false);
  const input = "w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";
  async function submit(formData: FormData) { await createDiseaseCase(formData); setOpen(false); }
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button className="rounded bg-slate-950 text-white"><Plus/> Report case</Button></DialogTrigger><DialogContent className="max-h-[90vh] overflow-y-auto rounded sm:max-w-2xl"><DialogHeader><DialogTitle>Report a typhoid case</DialogTitle><DialogDescription>Capture the patient, clinical, and geographic information required for surveillance validation.</DialogDescription></DialogHeader><form action={submit} className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold">Province<input name="province" required className={`mt-1 ${input}`}/></label><label className="text-xs font-semibold">District<input name="district" required className={`mt-1 ${input}`}/></label><label className="text-xs font-semibold">Sector<input name="sector" className={`mt-1 ${input}`}/></label><label className="text-xs font-semibold">Patient age<input name="patientAge" type="number" min="0" max="120" required className={`mt-1 ${input}`}/></label><label className="text-xs font-semibold">Patient sex<select name="patientSex" className={`mt-1 ${input}`}><option>Female</option><option>Male</option><option>Other</option></select></label><label className="text-xs font-semibold">Classification<select name="status" className={`mt-1 ${input}`}><option value="SUSPECTED">Suspected</option><option value="PROBABLE">Probable</option><option value="CONFIRMED">Confirmed</option></select></label><label className="text-xs font-semibold">Symptom onset<input name="onsetDate" type="date" required className={`mt-1 ${input}`}/></label><label className="text-xs font-semibold">Symptoms<input name="symptoms" required placeholder="Fever, headache, abdominal pain" className={`mt-1 ${input}`}/></label><DialogFooter className="mt-2 sm:col-span-2"><Button type="button" variant="outline" className="rounded" onClick={()=>setOpen(false)}>Cancel</Button><Button className="rounded bg-slate-950 text-white">Save case record</Button></DialogFooter></form></DialogContent></Dialog>;
}
