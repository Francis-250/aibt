"use client";

import { useState } from "react";
import { BrainCircuit } from "lucide-react";
import rwanda from "@/lib/rwanda.json";
import { generatePrediction } from "@/actions/surveillance";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type RwandaData = Record<string, Record<string, unknown>>;
const locations = rwanda as RwandaData;

export function PredictionFormDialog() {
  const [open,setOpen]=useState(false); const [province,setProvince]=useState("");
  const provinces=Object.keys(locations).sort(); const districts=province?Object.keys(locations[province]??{}).sort():[];
  const input="w-full rounded border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100";
  async function submit(formData:FormData){await generatePrediction(formData);setOpen(false);setProvince("")}
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button className="rounded bg-slate-950 text-white"><BrainCircuit/> Run AI prediction</Button></DialogTrigger><DialogContent className="rounded sm:max-w-md"><DialogHeader><DialogTitle>AI outbreak prediction</DialogTitle><DialogDescription>Select a district. The engine will combine validated case trends with the latest environmental observation.</DialogDescription></DialogHeader><form action={submit} className="space-y-3"><label className="block text-xs font-semibold">Province<select name="province" value={province} onChange={event=>setProvince(event.target.value)} required className={`mt-1 ${input}`}><option value="">Select province</option>{provinces.map(item=><option key={item}>{item}</option>)}</select></label><label className="block text-xs font-semibold">District<select name="district" required disabled={!province} className={`mt-1 ${input}`}><option value="">Select district</option>{districts.map(item=><option key={item}>{item}</option>)}</select></label><div className="rounded bg-blue-50 p-3 text-xs leading-5 text-blue-800">Uses validated cases from two 30-day periods plus rainfall, humidity, water quality, sanitation, temperature, and flooding data.</div><DialogFooter><Button type="button" variant="outline" className="rounded" onClick={()=>setOpen(false)}>Cancel</Button><Button className="rounded bg-slate-950 text-white">Generate result</Button></DialogFooter></form></DialogContent></Dialog>;
}
