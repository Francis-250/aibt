"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import rwanda from "@/lib/rwanda.json";
import { createDiseaseCase } from "@/actions/surveillance";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type RwandaData = Record<string, Record<string, Record<string, Record<string, string[]>>>>;
const locations = rwanda as RwandaData;

export function CaseFormDialog() {
  const [open, setOpen] = useState(false);
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [sector, setSector] = useState("");
  const [cell, setCell] = useState("");
  const input = "w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-400";
  const provinces = Object.keys(locations).sort();
  const districts = province ? Object.keys(locations[province] ?? {}).sort() : [];
  const sectors = province && district ? Object.keys(locations[province]?.[district] ?? {}).sort() : [];
  const cells = province && district && sector ? Object.keys(locations[province]?.[district]?.[sector] ?? {}).sort() : [];
  const villages = province && district && sector && cell ? locations[province]?.[district]?.[sector]?.[cell] ?? [] : [];

  function resetLocation() { setProvince(""); setDistrict(""); setSector(""); setCell(""); }
  async function submit(formData: FormData) { await createDiseaseCase(formData); setOpen(false); resetLocation(); }
  function changeOpen(value: boolean) { setOpen(value); if (!value) resetLocation(); }

  return <Dialog open={open} onOpenChange={changeOpen}><DialogTrigger asChild><Button className="rounded bg-slate-950 text-white"><Plus/> Report case</Button></DialogTrigger><DialogContent className="max-h-[90vh] overflow-y-auto rounded sm:max-w-2xl"><DialogHeader><DialogTitle>Report a typhoid case</DialogTitle><DialogDescription>Select the complete Rwanda administrative location and enter the clinical details.</DialogDescription></DialogHeader><form action={submit} className="grid gap-3 sm:grid-cols-2">
    <label className="text-xs font-semibold">Province<select name="province" required value={province} onChange={event=>{setProvince(event.target.value);setDistrict("");setSector("");setCell("")}} className={`mt-1 ${input}`}><option value="">Select province</option>{provinces.map(item=><option key={item}>{item}</option>)}</select></label>
    <label className="text-xs font-semibold">District<select name="district" required value={district} disabled={!province} onChange={event=>{setDistrict(event.target.value);setSector("");setCell("")}} className={`mt-1 ${input}`}><option value="">Select district</option>{districts.map(item=><option key={item}>{item}</option>)}</select></label>
    <label className="text-xs font-semibold">Sector<select name="sector" required value={sector} disabled={!district} onChange={event=>{setSector(event.target.value);setCell("")}} className={`mt-1 ${input}`}><option value="">Select sector</option>{sectors.map(item=><option key={item}>{item}</option>)}</select></label>
    <label className="text-xs font-semibold">Cell<select name="cell" required value={cell} disabled={!sector} onChange={event=>setCell(event.target.value)} className={`mt-1 ${input}`}><option value="">Select cell</option>{cells.map(item=><option key={item}>{item}</option>)}</select></label>
    <label className="text-xs font-semibold">Village<select name="village" required disabled={!cell} className={`mt-1 ${input}`}><option value="">Select village</option>{villages.slice().sort().map(item=><option key={item}>{item}</option>)}</select></label>
    <label className="text-xs font-semibold">Patient age<input name="patientAge" type="number" min="0" max="120" required className={`mt-1 ${input}`}/></label>
    <label className="text-xs font-semibold">Patient sex<select name="patientSex" className={`mt-1 ${input}`}><option>Female</option><option>Male</option><option>Other</option></select></label>
    <label className="text-xs font-semibold">Classification<select name="status" className={`mt-1 ${input}`}><option value="SUSPECTED">Suspected</option><option value="PROBABLE">Probable</option><option value="CONFIRMED">Confirmed</option></select></label>
    <label className="text-xs font-semibold">Symptom onset<input name="onsetDate" type="date" required className={`mt-1 ${input}`}/></label>
    <label className="text-xs font-semibold">Symptoms<input name="symptoms" required placeholder="Fever, headache, abdominal pain" className={`mt-1 ${input}`}/></label>
    <DialogFooter className="mt-2 sm:col-span-2"><Button type="button" variant="outline" className="rounded" onClick={()=>changeOpen(false)}>Cancel</Button><Button className="rounded bg-slate-950 text-white">Save case record</Button></DialogFooter>
  </form></DialogContent></Dialog>;
}
