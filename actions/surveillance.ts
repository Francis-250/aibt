"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { runAutomaticPredictions, runGeographicPrediction } from "@/lib/prediction-service";

const text = z.string().trim().min(1);
const numberOrNull = (value: FormDataEntryValue | null) =>
  value === null || value === "" ? null : Number(value);

export async function createDiseaseCase(formData: FormData) {
  const session = await requireSession(["health_officer", "admin"]);
  const data = z
    .object({
      province: text,
      district: text,
      sector: text,
      cell: text,
      village: text,
      symptoms: text,
      onsetDate: text,
      patientAge: z.coerce.number().int().min(0).max(120),
      patientSex: text,
      status: z.enum(["SUSPECTED", "PROBABLE", "CONFIRMED", "DISCARDED"]),
    })
    .parse(Object.fromEntries(formData));
  const count = await prisma.diseaseCase.count();
  const diseaseCase = await prisma.diseaseCase.create({
    data: {
      caseCode: `TYP-${new Date().getFullYear()}-${String(count + 1).padStart(6, "0")}`,
      submittedById: session.user.id,
      province: data.province,
      district: data.district,
      sector: data.sector,
      cell: data.cell,
      village: data.village,
      symptoms: data.symptoms
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      symptomOnsetDate: new Date(data.onsetDate),
      patientAge: data.patientAge,
      patientSex: data.patientSex,
      status: data.status,
    },
  });
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "DISEASE_CASE_CREATED",
      entity: "DiseaseCase",
      entityId: diseaseCase.id,
      description: `Submitted ${diseaseCase.caseCode}`,
    },
  });
  revalidatePath("/health-officer/cases");
  revalidatePath("/health-officer");
  revalidatePath("/admin");
}

export async function validateDiseaseCase(
  caseId: string,
  decision: "VALIDATED" | "REJECTED",
) {
  const session = await requireSession(["health_officer", "admin"]);
  const diseaseCase = await prisma.diseaseCase.update({
    where: { id: caseId },
    data: {
      validationStatus: decision,
      validatedById: session.user.id,
      validatedAt: new Date(),
    },
  });
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: `DISEASE_CASE_${decision}`,
      entity: "DiseaseCase",
      entityId: caseId,
    },
  });
  if (decision === "VALIDATED") {
    await runAutomaticPredictions({
      province: diseaseCase.province,
      district: diseaseCase.district,
      sector: diseaseCase.sector,
      cell: diseaseCase.cell,
      village: diseaseCase.village,
    });
  }
  revalidatePath("/health-officer/cases");
  revalidatePath("/health-officer/predictions");
  revalidatePath("/government-official");
  revalidatePath("/government-official/predictions");
}

export async function createEnvironmentalRecord(formData: FormData) {
  const session = await requireSession(["health_officer", "admin"]);
  const province = text.parse(formData.get("province"));
  const district = text.parse(formData.get("district"));
  const environmentalRecord = await prisma.environmentalData.create({
    data: {
      recordedById: session.user.id,
      province,
      district,
      sector: String(formData.get("sector") || "") || null,
      recordedAt: new Date(String(formData.get("recordedAt"))),
      temperatureCelsius: numberOrNull(formData.get("temperatureCelsius")),
      rainfallMm: numberOrNull(formData.get("rainfallMm")),
      humidityPercent: numberOrNull(formData.get("humidityPercent")),
      waterQualityIndex: numberOrNull(formData.get("waterQualityIndex")),
      sanitationCoverage: numberOrNull(formData.get("sanitationCoverage")),
      floodingObserved: formData.get("floodingObserved") === "on",
      isValidated: true,
    },
  });
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "ENVIRONMENTAL_DATA_CREATED",
      entity: "EnvironmentalData",
      description: `${district}, ${province}`,
    },
  });
  await runAutomaticPredictions({
    province: environmentalRecord.province,
    district: environmentalRecord.district,
    sector: environmentalRecord.sector,
  });
  revalidatePath("/health-officer/environment");
  revalidatePath("/health-officer");
  revalidatePath("/health-officer/predictions");
  revalidatePath("/government-official");
  revalidatePath("/government-official/predictions");
}

export async function generatePrediction(formData: FormData) {
  const session = await requireSession(["health_officer", "admin"]);
  const geographicLevel = z
    .enum(["PROVINCE", "DISTRICT", "SECTOR", "CELL", "VILLAGE"])
    .parse(formData.get("geographicLevel"));
  const province = text.parse(formData.get("province"));
  const optionalLocation = (key: string) => {
    const value = String(formData.get(key) ?? "").trim();
    return value || null;
  };
  const district = optionalLocation("district");
  const sector = optionalLocation("sector");
  const cell = optionalLocation("cell");
  const village = optionalLocation("village");
  if (geographicLevel !== "PROVINCE" && !district)
    throw new Error("District is required for this prediction level.");
  if (["SECTOR", "CELL", "VILLAGE"].includes(geographicLevel) && !sector)
    throw new Error("Sector is required for this prediction level.");
  if (["CELL", "VILLAGE"].includes(geographicLevel) && !cell)
    throw new Error("Cell is required for this prediction level.");
  if (geographicLevel === "VILLAGE" && !village)
    throw new Error("Village is required for village prediction.");

  const prediction = await runGeographicPrediction({
    geographicLevel,
    province,
    district,
    sector,
    cell,
    village,
    requestedById: session.user.id,
  });
  if (!prediction) throw new Error("No active prediction model is configured.");

  revalidatePath("/health-officer/predictions");
  revalidatePath("/health-officer");
  revalidatePath("/government-official");
  revalidatePath("/government-official/predictions");
  revalidatePath("/admin");
}
export async function acknowledgeAlert(alertId: string) {
  const session = await requireSession();
  await prisma.alertAcknowledgement.upsert({
    where: { alertId_userId: { alertId, userId: session.user.id } },
    create: { alertId, userId: session.user.id },
    update: { acknowledgedAt: new Date() },
  });
  await prisma.alert.update({
    where: { id: alertId },
    data: { status: "ACKNOWLEDGED" },
  });
  revalidatePath("/health-officer/alerts");
  revalidatePath("/government-official/alerts");
}
