"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function generateReport(formData: FormData) {
  const session = await requireSession(["admin", "health_officer", "government_official"]);
  const data = z.object({
    title: z.string().trim().min(3).max(200),
    type: z.enum(["DAILY", "WEEKLY", "MONTHLY", "ANNUAL", "PREDICTION", "REGIONAL", "NATIONAL", "SUMMARY"]),
    province: z.string().trim().optional().nullable(),
    district: z.string().trim().optional().nullable(),
    periodStart: z.string().trim().min(1),
    periodEnd: z.string().trim().min(1),
    format: z.enum(["CSV", "EXCEL", "PDF"]).default("CSV"),
    filters: z.string().optional().nullable(),
  }).parse(Object.fromEntries(formData));

  const report = await prisma.report.create({
    data: {
      generatedById: session.user.id,
      title: data.title,
      type: data.type,
      province: data.province,
      district: data.district,
      periodStart: new Date(data.periodStart),
      periodEnd: new Date(data.periodEnd),
      fileFormat: data.format,
      status: "PENDING",
      parameters: data.filters ? JSON.parse(data.filters) : null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "REPORT_GENERATED",
      entity: "Report",
      entityId: report.id,
      description: `Started ${data.type} report: ${data.title}`,
    },
  });

  revalidatePath("/admin/reports");
  revalidatePath("/health-officer/reports");
  revalidatePath("/government-official/reports");

  return { reportId: report.id };
}

export async function exportDataset(formData: FormData) {
  const session = await requireSession(["admin", "health_officer"]);
  const data = z.object({
    type: z.enum(["disease_cases", "environmental_data", "predictions", "all"]),
    format: z.enum(["CSV", "EXCEL"]),
    province: z.string().trim().optional().nullable(),
    district: z.string().trim().optional().nullable(),
    sector: z.string().trim().optional().nullable(),
    startDate: z.string().trim().optional().nullable(),
    endDate: z.string().trim().optional().nullable(),
  }).parse(Object.fromEntries(formData));

  const exportRecord = await prisma.datasetExport.create({
    data: {
      requestedById: session.user.id,
      type: data.type,
      format: data.format,
      filters: {
        province: data.province,
        district: data.district,
        sector: data.sector,
        startDate: data.startDate,
        endDate: data.endDate,
      },
      status: "PENDING",
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "DATASET_EXPORT_STARTED",
      entity: "DatasetExport",
      entityId: exportRecord.id,
      description: `Started ${data.type} export in ${data.format}`,
    },
  });

  revalidatePath("/admin/exports");
  revalidatePath("/health-officer/exports");

  return { exportId: exportRecord.id };
}

export async function getDiseaseCaseDetail(caseId: string) {
  const session = await requireSession(["admin", "health_officer", "government_official"]);
  const diseaseCase = await prisma.diseaseCase.findUnique({
    where: { id: caseId },
    include: {
      submittedBy: { select: { id: true, name: true, email: true } },
      validatedBy: { select: { id: true, name: true, email: true } },
    },
  });
  if (!diseaseCase) throw new Error("Case not found");

  if (session.role === "health_officer" && diseaseCase.submittedById !== session.user.id) {
    throw new Error("Unauthorized to view this case");
  }

  return diseaseCase;
}

export async function getEnvironmentalRecordDetail(recordId: string) {
  const session = await requireSession(["admin", "health_officer", "government_official"]);
  const record = await prisma.environmentalData.findUnique({
    where: { id: recordId },
    include: {
      recordedBy: { select: { id: true, name: true, email: true } },
    },
  });
  if (!record) throw new Error("Environmental record not found");

  if (session.role === "health_officer" && record.recordedById !== session.user.id) {
    throw new Error("Unauthorized to view this record");
  }

  return record;
}