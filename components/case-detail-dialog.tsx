"use client";
import { use } from "react";
import { Edit, Trash2, MapPin, Calendar, User, Building2, FileText } from "lucide-react";
import { getDiseaseCaseDetail } from "@/actions/reports";
import { deleteDiseaseCase } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { format } from "date-fns";

interface CaseDetailDialogProps {
  caseId: string;
  userRole: string;
  userId: string;
}

function CaseDetailContent({ caseId, userRole, userId }: CaseDetailDialogProps) {
  const caseData = use(getDiseaseCaseDetail(caseId));
  const canEdit = userRole === "admin" || (userRole === "health_officer" && caseData.submittedById === userId);
  const canDelete = userRole === "admin";

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto rounded sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle className="flex items-center justify-between">
          <span>Case Details: {caseData.caseCode}</span>
          <div className="flex gap-2">
            {canEdit && (
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="rounded">
                  <Edit className="mr-1 h-3 w-3" /> Edit
                </Button>
              </DialogTrigger>
            )}
            {canDelete && (
              <form action={async () => { await deleteDiseaseCase(caseId); }}>
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
            <p className="text-xs text-slate-500">Status</p>
            <p className="font-medium capitalize">{caseData.status.toLowerCase()}</p>
          </div>
          <div className="rounded border bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Validation</p>
            <p className="font-medium capitalize">{caseData.validationStatus.toLowerCase()}</p>
          </div>
          <div className="rounded border bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Patient Age</p>
            <p className="font-medium">{caseData.patientAge ?? "—"}</p>
          </div>
          <div className="rounded border bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Patient Sex</p>
            <p className="font-medium capitalize">{caseData.patientSex?.toLowerCase() ?? "—"}</p>
          </div>
          <div className="rounded border bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Outcome</p>
            <p className="font-medium capitalize">{caseData.outcome.toLowerCase().replace("_", " ")}</p>
          </div>
          {caseData.laboratoryResult && (
            <div className="rounded border bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Laboratory Result</p>
              <p className="font-medium">{caseData.laboratoryResult}</p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="rounded border bg-slate-50 p-3">
            <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="h-3 w-3" /> Location</p>
            <p className="font-medium">{caseData.village ? `${caseData.village}, ` : ""}{caseData.cell ? `${caseData.cell}, ` : ""}{caseData.sector ? `${caseData.sector}, ` : ""}{caseData.district}, {caseData.province}</p>
          </div>
          <div className="rounded border bg-slate-50 p-3">
            <p className="text-xs text-slate-500 flex items-center gap-1"><Calendar className="h-3 w-3" /> Symptom Onset</p>
            <p className="font-medium">{format(new Date(caseData.symptomOnsetDate), "PPP")}</p>
          </div>
          {caseData.diagnosisDate && (
            <div className="rounded border bg-slate-50 p-3">
              <p className="text-xs text-slate-500 flex items-center gap-1"><Calendar className="h-3 w-3" /> Diagnosis Date</p>
              <p className="font-medium">{format(new Date(caseData.diagnosisDate), "PPP")}</p>
            </div>
          )}
          {caseData.healthFacility && (
            <div className="rounded border bg-slate-50 p-3">
              <p className="text-xs text-slate-500 flex items-center gap-1"><Building2 className="h-3 w-3" /> Health Facility</p>
              <p className="font-medium">{caseData.healthFacility}</p>
            </div>
          )}
          <div className="rounded border bg-slate-50 p-3">
            <p className="text-xs text-slate-500 flex items-center gap-1"><User className="h-3 w-3" /> Submitted By</p>
            <p className="font-medium">{caseData.submittedBy.name}</p>
          </div>
          {caseData.validatedBy && (
            <div className="rounded border bg-slate-50 p-3">
              <p className="text-xs text-slate-500 flex items-center gap-1"><User className="h-3 w-3" /> Validated By</p>
              <p className="font-medium">{caseData.validatedBy.name}</p>
            </div>
          )}
        </div>

        <div className="sm:col-span-2">
          <p className="text-xs text-slate-500 mb-1">Symptoms</p>
          <div className="flex flex-wrap gap-2">
            {(caseData.symptoms as string[]).map((symptom, i) => (
              <span key={i} className="rounded bg-blue-50 text-blue-700 px-2 py-1 text-xs font-medium">
                {symptom}
              </span>
            ))}
          </div>
        </div>

        {caseData.notes && (
          <div className="sm:col-span-2 rounded border bg-slate-50 p-3">
            <p className="text-xs text-slate-500 mb-1">Notes</p>
            <p className="whitespace-pre-wrap">{caseData.notes}</p>
          </div>
        )}
      </div>

      <DialogFooter className="border-t pt-4">
        <Button variant="outline" className="rounded" onClick={() => {}}>Close</Button>
      </DialogFooter>
    </DialogContent>
  );
}

export function CaseDetailDialog({ caseId, userRole, userId }: CaseDetailDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="rounded text-blue-700 hover:bg-blue-50">
          <FileText className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <CaseDetailContent caseId={caseId} userRole={userRole} userId={userId} />
    </Dialog>
  );
}