"use client";
import { use } from "react";
import { Edit, Trash2, MapPin, Calendar, User, Thermometer, Droplets, Droplet, FlaskConical, Shield, Waves, Building2 } from "lucide-react";
import { getEnvironmentalRecordDetail } from "@/actions/reports";
import { deleteEnvironmentalRecord } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { format } from "date-fns";

interface EnvironmentalDetailDialogProps {
  recordId: string;
  userRole: string;
  userId: string;
}

function EnvironmentalDetailContent({ recordId, userRole, userId }: EnvironmentalDetailDialogProps) {
  const record = use(getEnvironmentalRecordDetail(recordId));
  const canEdit = userRole === "admin" || (userRole === "health_officer" && record.recordedById === userId);
  const canDelete = userRole === "admin";

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto rounded sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle className="flex items-center justify-between">
          <span>Environmental Record Details</span>
          <div className="flex gap-2">
            {canEdit && (
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="rounded">
                  <Edit className="mr-1 h-3 w-3" /> Edit
                </Button>
              </DialogTrigger>
            )}
            {canDelete && (
              <form action={async () => { await deleteEnvironmentalRecord(recordId); }}>
                <Button type="submit" variant="destructive" size="sm" className="rounded">
                  <Trash2 className="mr-1 h-3 w-3" /> Delete
                </Button>
              </form>
            )}
          </div>
        </DialogTitle>
      </DialogHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          <div className="rounded border bg-slate-50 p-3">
            <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="h-3 w-3" /> Location</p>
            <p className="font-medium">{record.sector ? `${record.sector}, ` : ""}{record.district}, {record.province}</p>
          </div>
          <div className="rounded border bg-slate-50 p-3">
            <p className="text-xs text-slate-500 flex items-center gap-1"><Calendar className="h-3 w-3" /> Recorded</p>
            <p className="font-medium">{format(new Date(record.recordedAt), "PPP")}</p>
          </div>
          <div className="rounded border bg-slate-50 p-3">
            <p className="text-xs text-slate-500 flex items-center gap-1"><Thermometer className="h-3 w-3" /> Temperature</p>
            <p className="font-medium">{record.temperatureCelsius ?? "—"} °C</p>
          </div>
          <div className="rounded border bg-slate-50 p-3">
            <p className="text-xs text-slate-500 flex items-center gap-1"><Droplets className="h-3 w-3" /> Rainfall</p>
            <p className="font-medium">{record.rainfallMm ?? "—"} mm</p>
          </div>
          <div className="rounded border bg-slate-50 p-3">
            <p className="text-xs text-slate-500 flex items-center gap-1"><Droplet className="h-3 w-3" /> Humidity</p>
            <p className="font-medium">{record.humidityPercent ?? "—"}%</p>
          </div>
          <div className="rounded border bg-slate-50 p-3">
            <p className="text-xs text-slate-500 flex items-center gap-1"><FlaskConical className="h-3 w-3" /> Water Quality Index</p>
            <p className="font-medium">{record.waterQualityIndex ?? "—"}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded border bg-slate-50 p-3">
            <p className="text-xs text-slate-500 flex items-center gap-1"><Shield className="h-3 w-3" /> Sanitation Coverage</p>
            <p className="font-medium">{record.sanitationCoverage ?? "—"}%</p>
          </div>
          <div className="rounded border bg-slate-50 p-3">
            <p className="text-xs text-slate-500 flex items-center gap-1"><Waves className="h-3 w-3" /> Flooding</p>
            <p className="font-medium">{record.floodingObserved ? "Observed" : "Not observed"}</p>
          </div>
          <div className="rounded border bg-slate-50 p-3">
            <p className="text-xs text-slate-500 flex items-center gap-1"><Building2 className="h-3 w-3" /> Clean Water Access</p>
            <p className="font-medium">{record.cleanWaterAccess ?? "—"}%</p>
          </div>
          <div className="rounded border bg-slate-50 p-3">
            <p className="text-xs text-slate-500 flex items-center gap-1"><Building2 className="h-3 w-3" /> Population Density</p>
            <p className="font-medium">{record.populationDensity ?? "—"}</p>
          </div>
          <div className="rounded border bg-slate-50 p-3">
            <p className="text-xs text-slate-500 flex items-center gap-1"><User className="h-3 w-3" /> Recorded By</p>
            <p className="font-medium">{record.recordedBy.name}</p>
          </div>
          <div className="rounded border bg-slate-50 p-3">
            <p className="text-xs text-slate-500 flex items-center gap-1">Validation</p>
            <p className="font-medium">{record.isValidated ? "Validated" : "Not validated"}</p>
          </div>
        </div>

        {record.notes && (
          <div className="sm:col-span-2 rounded border bg-slate-50 p-3">
            <p className="text-xs text-slate-500 mb-1">Notes</p>
            <p className="whitespace-pre-wrap">{record.notes}</p>
          </div>
        )}
      </div>

      <DialogFooter className="border-t pt-4">
        <Button variant="outline" className="rounded" onClick={() => {}}>Close</Button>
      </DialogFooter>
    </DialogContent>
  );
}

export function EnvironmentalDetailDialog({ recordId, userRole, userId }: EnvironmentalDetailDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="rounded text-blue-700 hover:bg-blue-50">
          View details
        </Button>
      </DialogTrigger>
      <EnvironmentalDetailContent recordId={recordId} userRole={userRole} userId={userId} />
    </Dialog>
  );
}