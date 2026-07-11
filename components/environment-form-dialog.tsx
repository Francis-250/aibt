"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import rwanda from "@/lib/rwanda.json";
import { createEnvironmentalRecord } from "@/actions/surveillance";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type RwandaData = Record<string, Record<string, Record<string, unknown>>>;
const locations = rwanda as RwandaData;

export function EnvironmentFormDialog() {
  const [open,setOpen]=useState(false); const [province,setProvince]=useState(""); const [district,setDistrict]=useState("");
  const provinces=Object.keys(locations).sort(); const districts=province?Object.keys(locations[province]??{}).sort():[]; const sectors=province&&district?Object.keys(locations[province]?.[district]??{}).sort():[];
  const input="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100";
  function reset(){setProvince("");setDistrict("")}
  function changeOpen(value:boolean){setOpen(value);if(!value)reset()}
  async function submit(formData:FormData){await createEnvironmentalRecord(formData);changeOpen(false)}
  return <Dialog open={open} onOpenChange={changeOpen}><DialogTrigger asChild><Button className="rounded bg-slate-950 text-white"><Plus/> Add observation</Button></DialogTrigger><DialogContent className="max-h-[90vh] overflow-y-auto rounded sm:max-w-2xl"><DialogHeader><DialogTitle>Add environmental observation</DialogTitle><DialogDescription>Select a Rwanda location and record conditions influencing water-borne disease transmission.</DialogDescription></DialogHeader><form action={submit} className="grid gap-3 sm:grid-cols-2">
    <label className="text-xs font-semibold">Province<select name="province" required value={province} onChange={event=>{setProvince(event.target.value);setDistrict("")}} className={`mt-1 ${input}`}><option value="">Select province</option>{provinces.map(item=><option key={item}>{item}</option>)}</select></label>
    <label className="text-xs font-semibold">District<select name="district" required value={district} disabled={!province} onChange={event=>setDistrict(event.target.value)} className={`mt-1 ${input}`}><option value="">Select district</option>{districts.map(item=><option key={item}>{item}</option>)}</select></label>
    <label className="text-xs font-semibold">Sector<select name="sector" disabled={!district} className={`mt-1 ${input}`}><option value="">All district / no sector</option>{sectors.map(item=><option key={item}>{item}</option>)}</select></label>
    <label className="text-xs font-semibold">Observation date<input name="recordedAt" type="date" required className={`mt-1 ${input}`}/></label>
    {[["temperatureCelsius","Temperature °C"],["rainfallMm","Rainfall mm"],["humidityPercent","Humidity %"],["waterQualityIndex","Water quality index"],["sanitationCoverage","Sanitation coverage %"]].map(([name,label])=><label key={name} className="text-xs font-semibold">{label}<input name={name} type="number" step="0.1" className={`mt-1 ${input}`}/></label>)}
    <label className="flex items-center gap-2 rounded border border-slate-300 px-3 text-xs font-semibold"><input name="floodingObserved" type="checkbox"/> Flooding observed</label>
    <DialogFooter className="mt-2 sm:col-span-2"><Button type="button" variant="outline" className="rounded" onClick={()=>changeOpen(false)}>Cancel</Button><Button className="rounded bg-slate-950 text-white">Save observation</Button></DialogFooter>
  </form></DialogContent></Dialog>;
}
