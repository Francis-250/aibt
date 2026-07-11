"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { predictOutbreakRisk } from "@/lib/ai";

const text = z.string().trim().min(1);
const numberOrNull = (value: FormDataEntryValue | null) => value === null || value === "" ? null : Number(value);

export async function createDiseaseCase(formData: FormData) {
  const session = await requireSession(["health_officer", "admin"]);
  const data = z.object({ province: text, district: text, sector: z.string(), symptoms: text, onsetDate: text, patientAge: z.coerce.number().int().min(0).max(120), patientSex: text, status: z.enum(["SUSPECTED", "PROBABLE", "CONFIRMED", "DISCARDED"]) }).parse(Object.fromEntries(formData));
  const count = await prisma.diseaseCase.count();
  const diseaseCase = await prisma.diseaseCase.create({ data: { caseCode: `TYP-${new Date().getFullYear()}-${String(count + 1).padStart(6, "0")}`, submittedById: session.user.id, province: data.province, district: data.district, sector: data.sector || null, symptoms: data.symptoms.split(",").map((item) => item.trim()).filter(Boolean), symptomOnsetDate: new Date(data.onsetDate), patientAge: data.patientAge, patientSex: data.patientSex, status: data.status } });
  await prisma.auditLog.create({ data: { userId: session.user.id, action: "DISEASE_CASE_CREATED", entity: "DiseaseCase", entityId: diseaseCase.id, description: `Submitted ${diseaseCase.caseCode}` } });
  revalidatePath("/health-officer/cases"); revalidatePath("/health-officer"); revalidatePath("/admin");
}

export async function validateDiseaseCase(caseId: string, decision: "VALIDATED" | "REJECTED") {
  const session = await requireSession(["health_officer", "admin"]);
  await prisma.diseaseCase.update({ where: { id: caseId }, data: { validationStatus: decision, validatedById: session.user.id, validatedAt: new Date() } });
  await prisma.auditLog.create({ data: { userId: session.user.id, action: `DISEASE_CASE_${decision}`, entity: "DiseaseCase", entityId: caseId } });
  revalidatePath("/health-officer/cases");
}

export async function createEnvironmentalRecord(formData: FormData) {
  const session = await requireSession(["health_officer", "admin"]);
  const province = text.parse(formData.get("province")); const district = text.parse(formData.get("district"));
  await prisma.environmentalData.create({ data: { recordedById: session.user.id, province, district, sector: String(formData.get("sector") || "") || null, recordedAt: new Date(String(formData.get("recordedAt"))), temperatureCelsius: numberOrNull(formData.get("temperatureCelsius")), rainfallMm: numberOrNull(formData.get("rainfallMm")), humidityPercent: numberOrNull(formData.get("humidityPercent")), waterQualityIndex: numberOrNull(formData.get("waterQualityIndex")), sanitationCoverage: numberOrNull(formData.get("sanitationCoverage")), floodingObserved: formData.get("floodingObserved") === "on", isValidated: true } });
  await prisma.auditLog.create({ data: { userId: session.user.id, action: "ENVIRONMENTAL_DATA_CREATED", entity: "EnvironmentalData", description: `${district}, ${province}` } });
  revalidatePath("/health-officer/environment"); revalidatePath("/health-officer");
}

export async function generatePrediction(formData: FormData) {
  const session = await requireSession(["health_officer", "admin"]);
  const province = text.parse(formData.get("province")); const district = text.parse(formData.get("district"));
  const now = new Date(); const recentStart = new Date(now); recentStart.setDate(now.getDate() - 30); const previousStart = new Date(now); previousStart.setDate(now.getDate() - 60);
  const [recentCases, previousCases, environment, model] = await Promise.all([
    prisma.diseaseCase.count({ where: { province, district, validationStatus: "VALIDATED", symptomOnsetDate: { gte: recentStart } } }),
    prisma.diseaseCase.count({ where: { province, district, validationStatus: "VALIDATED", symptomOnsetDate: { gte: previousStart, lt: recentStart } } }),
    prisma.environmentalData.findFirst({ where: { province, district }, orderBy: { recordedAt: "desc" } }),
    prisma.mLModel.findFirst({ where: { status: "ACTIVE" }, orderBy: { activatedAt: "desc" } }),
  ]);
  if (!model) throw new Error("No active prediction model is configured.");
  const result = predictOutbreakRisk({ recentCases, previousCases, rainfallMm: environment?.rainfallMm, temperatureCelsius: environment?.temperatureCelsius, humidityPercent: environment?.humidityPercent, waterQualityIndex: environment?.waterQualityIndex, sanitationCoverage: environment?.sanitationCoverage, floodingObserved: environment?.floodingObserved });
  const windowEnd = new Date(now); windowEnd.setDate(now.getDate() + 30);
  const prediction = await prisma.prediction.create({ data: { requestedById: session.user.id, modelId: model.id, province, district, predictionDate: now, windowStart: now, windowEnd, predictedCaseCount: result.predictedCases, outbreakProbability: result.probability, confidenceScore: result.confidence, riskLevel: result.riskLevel, recommendation: result.recommendation, inputFeatures: result.features } });
  if (result.riskLevel === "HIGH" || result.riskLevel === "CRITICAL") await prisma.alert.create({ data: { predictionId: prediction.id, title: `${result.riskLevel} typhoid outbreak risk`, message: result.recommendation, riskLevel: result.riskLevel, province, district } });
  revalidatePath("/health-officer/predictions"); revalidatePath("/health-officer"); revalidatePath("/government-official"); revalidatePath("/admin");
}

export async function acknowledgeAlert(alertId: string) {
  const session = await requireSession();
  await prisma.alertAcknowledgement.upsert({ where: { alertId_userId: { alertId, userId: session.user.id } }, create: { alertId, userId: session.user.id }, update: { acknowledgedAt: new Date() } });
  await prisma.alert.update({ where: { id: alertId }, data: { status: "ACKNOWLEDGED" } });
  revalidatePath("/health-officer/alerts"); revalidatePath("/government-official/alerts");
}
