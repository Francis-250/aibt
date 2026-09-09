"use client";
import { useState } from "react";
import rwanda from "@/lib/rwanda.json";
import { updateDiseaseCase } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

type RwandaData = Record<string, Record<string, Record<string, Record<string, string[]>>>>;
const locations = rwanda as RwandaData;

interface CaseEditDialogProps {
  caseId: string;
  initialData: {
    province: string;
    district: string;
    sector: string | null;
    cell: string | null;
    village: string | null;
    patientAge: number | null;
    patientSex: string | null;
    symptoms: string[];
    symptomOnsetDate: string;
    status: string;
    laboratoryResult: string | null;
    outcome: string;
    healthFacility: string | null;
    notes: string | null;
  };
}

function CaseEditContent({ caseId, initialData }: CaseEditDialogProps) {
  const [province, setProvince] = useState(initialData.province);
  const [district, setDistrict] = useState(initialData.district);
  const [sector, setSector] = useState(initialData.sector || "");
  const [cell, setCell] = useState(initialData.cell || "");
  const [village, setVillage] = useState(initialData.village || "");

  const provinces = Object.keys(locations).sort();
  const districts = province ? Object.keys(locations[province] ?? {}).sort() : [];
  const sectors = province && district ? Object.keys(locations[province]?.[district] ?? {}).sort() : [];
  const cells = province && district && sector ? Object.keys(locations[province]?.[district]?.[sector] ?? {}).sort() : [];
  const villages = province && district && sector && cell ? locations[province]?.[district]?.[sector]?.[cell] ?? [] : [];

  const input = "w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-400";

  async function submit(formData: FormData) {
    await updateDiseaseCase(formData);
  }

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto rounded sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>Edit Case: {caseId}</DialogTitle>
      </DialogHeader>
      <form action={submit} className="grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="caseId" value={caseId} />
        <label className="text-xs font-semibold">
          Province
          <select name="province" required value={province} onChange={e => { setProvince(e.target.value); setDistrict(""); setSector(""); setCell(""); setVillage(""); }} className={`mt-1 ${input}`}>
            <option value="">Select province</option>
            {provinces.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold">
          District
          <select name="district" required value={district} disabled={!province} onChange={e => { setDistrict(e.target.value); setSector(""); setCell(""); setVillage(""); }} className={`mt-1 ${input}`}>
            <option value="">Select district</option>
            {districts.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold">
          Sector
          <select name="sector" value={sector} disabled={!district} onChange={e => { setSector(e.target.value); setCell(""); setVillage(""); }} className={`mt-1 ${input}`}>
            <option value="">Select sector</option>
            {sectors.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold">
          Cell
          <select name="cell" value={cell} disabled={!sector} onChange={e => { setCell(e.target.value); setVillage(""); }} className={`mt-1 ${input}`}>
            <option value="">Select cell</option>
            {cells.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold">
          Village
          <select name="village" value={village} disabled={!cell} className={`mt-1 ${input}`}>
            <option value="">Select village</option>
            {villages.slice().sort().map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold">
          Patient Age
          <input name="patientAge" type="number" min="0" max="120" defaultValue={initialData.patientAge ?? ""} required className={`mt-1 ${input}`} />
        </label>
        <label className="text-xs font-semibold">
          Patient Sex
          <select name="patientSex" defaultValue={initialData.patientSex ?? ""} className={`mt-1 ${input}`}>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Other">Other</option>
          </select>
        </label>
        <label className="text-xs font-semibold">
          Classification
          <select name="status" defaultValue={initialData.status} className={`mt-1 ${input}`}>
            <option value="SUSPECTED">Suspected</option>
            <option value="PROBABLE">Probable</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="DISCARDED">Discarded</option>
          </select>
        </label>
        <label className="text-xs font-semibold">
          Symptom Onset Date
          <input name="onsetDate" type="date" defaultValue={initialData.symptomOnsetDate} required className={`mt-1 ${input}`} />
        </label>
        <label className="text-xs font-semibold sm:col-span-2">
          Symptoms
          <input name="symptoms" defaultValue={initialData.symptoms.join(", ")} required placeholder="Fever, headache, abdominal pain" className={`mt-1 ${input}`} />
        </label>
        <label className="text-xs font-semibold">
          Laboratory Result
          <input name="laboratoryResult" defaultValue={initialData.laboratoryResult ?? ""} placeholder="e.g., Culture positive" className={`mt-1 ${input}`} />
        </label>
        <label className="text-xs font-semibold">
          Outcome
          <select name="outcome" defaultValue={initialData.outcome} className={`mt-1 ${input}`}>
            <option value="UNDER_TREATMENT">Under Treatment</option>
            <option value="RECOVERED">Recovered</option>
            <option value="DECEASED">Deceased</option>
            <option value="UNKNOWN">Unknown</option>
          </select>
        </label>
        <label className="text-xs font-semibold">
          Health Facility
          <input name="healthFacility" defaultValue={initialData.healthFacility ?? ""} placeholder="Health center name" className={`mt-1 ${input}`} />
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

export function CaseEditDialog({ caseId, initialData }: CaseEditDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded">
          Edit
        </Button>
      </DialogTrigger>
      <CaseEditContent caseId={caseId} initialData={initialData} />
    </Dialog>
  );
}