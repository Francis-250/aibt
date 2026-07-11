import type { GeographicLevel } from "@prisma/client";
import prisma from "@/lib/prisma";
import { predictOutbreakRisk } from "@/lib/ai";

export type PredictionLocationInput = {
  geographicLevel: GeographicLevel;
  province: string;
  district?: string | null;
  sector?: string | null;
  cell?: string | null;
  village?: string | null;
  requestedById?: string | null;
};

export async function runGeographicPrediction(input: PredictionLocationInput) {
  const { geographicLevel, province, district = null, sector = null, cell = null, village = null, requestedById = null } = input;
  const locationWhere = { province, ...(district ? { district } : {}), ...(sector ? { sector } : {}), ...(cell ? { cell } : {}), ...(village ? { village } : {}) };
  const now = new Date(); const recentStart = new Date(now); recentStart.setDate(now.getDate() - 30); const previousStart = new Date(now); previousStart.setDate(now.getDate() - 60);

  const findEnvironment = async () => {
    if (district && sector) { const exact = await prisma.environmentalData.findFirst({ where: { province, district, sector }, orderBy: { recordedAt: "desc" } }); if (exact) return exact; }
    if (district) { const districtRecord = await prisma.environmentalData.findFirst({ where: { province, district }, orderBy: { recordedAt: "desc" } }); if (districtRecord) return districtRecord; }
    return prisma.environmentalData.findFirst({ where: { province }, orderBy: { recordedAt: "desc" } });
  };

  const [recentCases, previousCases, environment, model] = await Promise.all([
    prisma.diseaseCase.count({ where: { ...locationWhere, validationStatus: "VALIDATED", symptomOnsetDate: { gte: recentStart } } }),
    prisma.diseaseCase.count({ where: { ...locationWhere, validationStatus: "VALIDATED", symptomOnsetDate: { gte: previousStart, lt: recentStart } } }),
    findEnvironment(),
    prisma.mLModel.findFirst({ where: { status: "ACTIVE" }, orderBy: { activatedAt: "desc" } }),
  ]);
  if (!model) return null;

  const result = predictOutbreakRisk({ recentCases, previousCases, rainfallMm: environment?.rainfallMm, temperatureCelsius: environment?.temperatureCelsius, humidityPercent: environment?.humidityPercent, waterQualityIndex: environment?.waterQualityIndex, sanitationCoverage: environment?.sanitationCoverage, floodingObserved: environment?.floodingObserved });
  const windowEnd = new Date(now); windowEnd.setDate(now.getDate() + 30);
  const prediction = await prisma.prediction.create({ data: { requestedById, modelId: model.id, geographicLevel, province, district, sector, cell, village, predictionDate: now, windowStart: now, windowEnd, predictedCaseCount: result.predictedCases, outbreakProbability: result.probability, confidenceScore: result.confidence, riskLevel: result.riskLevel, recommendation: result.recommendation, inputFeatures: { ...result.features, geographicLevel, province, district, sector, cell, village, automatic: requestedById === null } } });
  if (result.riskLevel === "HIGH" || result.riskLevel === "CRITICAL") await prisma.alert.create({ data: { predictionId: prediction.id, title: `${result.riskLevel} typhoid outbreak risk`, message: result.recommendation, riskLevel: result.riskLevel, province, district } });
  return prediction;
}

export async function runAutomaticPredictions(location: Omit<PredictionLocationInput, "geographicLevel" | "requestedById">) {
  const scopes: PredictionLocationInput[] = [
    { geographicLevel: "PROVINCE", province: location.province },
    ...(location.district ? [{ geographicLevel: "DISTRICT" as const, province: location.province, district: location.district }] : []),
    ...(location.district && location.sector ? [{ geographicLevel: "SECTOR" as const, province: location.province, district: location.district, sector: location.sector }] : []),
    ...(location.district && location.sector && location.cell ? [{ geographicLevel: "CELL" as const, province: location.province, district: location.district, sector: location.sector, cell: location.cell }] : []),
    ...(location.district && location.sector && location.cell && location.village ? [{ geographicLevel: "VILLAGE" as const, province: location.province, district: location.district, sector: location.sector, cell: location.cell, village: location.village }] : []),
  ];
  return Promise.all(scopes.map(scope => runGeographicPrediction(scope)));
}
