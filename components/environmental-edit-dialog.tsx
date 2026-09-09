"use client";
import { useState } from "react";
import rwanda from "@/lib/rwanda.json";
import { updateEnvironmentalRecord } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

type RwandaData = Record<string, Record<string, Record<string, unknown>>>;
const locations = rwanda as RwandaData;

interface EnvironmentalEditDialogProps {
  recordId: string;
  initialData: {
    province: string;
    district: string;
    sector: string | null;
    recordedAt: string;
    temperatureCelsius: number | null;
    rainfallMm: number | null;
    humidityPercent: number | null;
    waterQualityIndex: number | null;
    sanitationCoverage: number | null;
    floodingObserved: boolean;
    cleanWaterAccess: number | null;
    populationDensity: number | null;
    notes: string | null;
  };
}

function EnvironmentalEditContent({ recordId, initialData }: EnvironmentalEditDialogProps) {
  const [province, setProvince] = useState(initialData.province);
  const [district, setDistrict] = useState(initialData.district);
  const [sector, setSector] = useState(initialData.sector || "");

  const provinces = Object.keys(locations).sort();
  const districts = province ? Object.keys(locations[province] ?? {}).sort() : [];
  const sectors = province && district ? Object.keys(locations[province]?.[district] ?? {}).sort() : [];

  const input = "w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-400";

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto rounded sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>Edit Environmental Record</DialogTitle>
      </DialogHeader>
      <form action={async (formData) => { await updateEnvironmentalRecord(formData); }} className="grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="recordId" value={recordId} />
        <label className="text-xs font-semibold">
          Province
          <select name="province" required value={province} onChange={e => { setProvince(e.target.value); setDistrict(""); setSector(""); }} className={`mt-1 ${input}`}>
            <option value="">Select province</option>
            {provinces.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold">
          District
          <select name="district" required value={district} disabled={!province} onChange={e => { setDistrict(e.target.value); setSector(""); }} className={`mt-1 ${input}`}>
            <option value="">Select district</option>
            {districts.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold">
          Sector
          <select name="sector" value={sector} disabled={!district} onChange={e => setSector(e.target.value)} className={`mt-1 ${input}`}>
            <option value="">All district / no sector</option>
            {sectors.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold">
          Observation Date
          <input name="recordedAt" type="date" defaultValue={initialData.recordedAt} required className={`mt-1 ${input}`} />
        </label>
        {[
          ["temperatureCelsius", "Temperature °C"],
          ["rainfallMm", "Rainfall mm"],
          ["humidityPercent", "Humidity %"],
          ["waterQualityIndex", "Water quality index"],
          ["sanitationCoverage", "Sanitation coverage %"],
          ["cleanWaterAccess", "Clean water access %"],
          ["populationDensity", "Population density"],
        ].map(([name, label]) => (
          <label key={name} className="text-xs font-semibold">
            {label}
            <input name={name} type="number" step="0.1" defaultValue={initialData[name as keyof typeof initialData] ?? ""} className={`mt-1 ${input}`} />
          </label>
        ))}
        <label className="flex items-center gap-2 rounded border border-slate-300 px-3 text-xs font-semibold">
          <input name="floodingObserved" type="checkbox" defaultChecked={initialData.floodingObserved} /> Flooding observed
        </label>
        <label className="text-xs font-semibold sm:col-span-2">
          Notes
          <textarea name="notes" defaultValue={initialData.notes ?? ""} rows={3} className={`mt-1 ${input}`} />
        </label>
        <DialogFooter className="mt-2 sm:col-span-2">
          <Button type="button" variant="outline" className="rounded" onClick={() => {}}>Cancel</Button>
          <Button className="rounded bg-slate-950 text-white">Save changes</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

export function EnvironmentalEditDialog({ recordId, initialData }: EnvironmentalEditDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded">
          Edit
        </Button>
      </DialogTrigger>
      <EnvironmentalEditContent recordId={recordId} initialData={initialData} />
    </Dialog>
  );
}