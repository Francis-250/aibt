"use client";

import { useState } from "react";
import { BrainCircuit } from "lucide-react";
import rwanda from "@/lib/rwanda.json";
import { generatePrediction } from "@/actions/surveillance";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Level = "PROVINCE" | "DISTRICT" | "SECTOR" | "CELL" | "VILLAGE";
type RwandaData = Record<
  string,
  Record<string, Record<string, Record<string, string[]>>>
>;
const locations = rwanda as RwandaData;
const rank: Record<Level, number> = {
  PROVINCE: 0,
  DISTRICT: 1,
  SECTOR: 2,
  CELL: 3,
  VILLAGE: 4,
};

export function PredictionFormDialog() {
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState<Level>("DISTRICT");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [sector, setSector] = useState("");
  const [cell, setCell] = useState("");
  const provinces = Object.keys(locations).sort();
  const districts = province
    ? Object.keys(locations[province] ?? {}).sort()
    : [];
  const sectors =
    province && district
      ? Object.keys(locations[province]?.[district] ?? {}).sort()
      : [];
  const cells =
    province && district && sector
      ? Object.keys(locations[province]?.[district]?.[sector] ?? {}).sort()
      : [];
  const villages =
    province && district && sector && cell
      ? (locations[province]?.[district]?.[sector]?.[cell] ?? [])
      : [];
  const input =
    "w-full rounded border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-400";
  function reset() {
    setProvince("");
    setDistrict("");
    setSector("");
    setCell("");
  }
  function changeOpen(value: boolean) {
    setOpen(value);
    if (!value) reset();
  }
  async function submit(formData: FormData) {
    await generatePrediction(formData);
    changeOpen(false);
  }
  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button className="rounded bg-slate-950 text-white">
          <BrainCircuit /> Run AI prediction
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded sm:max-w-md">
        <DialogHeader>
          <DialogTitle>AI outbreak prediction</DialogTitle>
          <DialogDescription>
            Choose the exact geographic level to analyze. The engine aggregates
            only validated cases inside that selected area.
          </DialogDescription>
        </DialogHeader>
        <form action={submit} className="space-y-3">
          <label className="block text-xs font-semibold">
            Prediction level
            <select
              name="geographicLevel"
              value={level}
              onChange={(event) => {
                setLevel(event.target.value as Level);
                reset();
              }}
              className={`mt-1 ${input}`}
            >
              <option value="PROVINCE">Province</option>
              <option value="DISTRICT">District</option>
              <option value="SECTOR">Sector</option>
              <option value="CELL">Cell</option>
              <option value="VILLAGE">Village</option>
            </select>
          </label>
          <label className="block text-xs font-semibold">
            Province
            <select
              name="province"
              value={province}
              onChange={(event) => {
                setProvince(event.target.value);
                setDistrict("");
                setSector("");
                setCell("");
              }}
              required
              className={`mt-1 ${input}`}
            >
              <option value="">Select province</option>
              {provinces.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          {rank[level] >= 1 && (
            <label className="block text-xs font-semibold">
              District
              <select
                name="district"
                value={district}
                onChange={(event) => {
                  setDistrict(event.target.value);
                  setSector("");
                  setCell("");
                }}
                required
                disabled={!province}
                className={`mt-1 ${input}`}
              >
                <option value="">Select district</option>
                {districts.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          )}
          {rank[level] >= 2 && (
            <label className="block text-xs font-semibold">
              Sector
              <select
                name="sector"
                value={sector}
                onChange={(event) => {
                  setSector(event.target.value);
                  setCell("");
                }}
                required
                disabled={!district}
                className={`mt-1 ${input}`}
              >
                <option value="">Select sector</option>
                {sectors.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          )}
          {rank[level] >= 3 && (
            <label className="block text-xs font-semibold">
              Cell
              <select
                name="cell"
                value={cell}
                onChange={(event) => setCell(event.target.value)}
                required
                disabled={!sector}
                className={`mt-1 ${input}`}
              >
                <option value="">Select cell</option>
                {cells.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          )}
          {rank[level] >= 4 && (
            <label className="block text-xs font-semibold">
              Village
              <select
                name="village"
                required
                disabled={!cell}
                className={`mt-1 ${input}`}
              >
                <option value="">Select village</option>
                {villages
                  .slice()
                  .sort()
                  .map((item) => (
                    <option key={item}>{item}</option>
                  ))}
              </select>
            </label>
          )}
          <div className="rounded bg-blue-50 p-3 text-xs leading-5 text-blue-800">
            Case totals are filtered at the selected level. Environmental data
            uses the closest available matching province, district, or sector
            observation.
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded"
              onClick={() => changeOpen(false)}
            >
              Cancel
            </Button>
            <Button className="rounded bg-slate-950 text-white">
              Generate result
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
