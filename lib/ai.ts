export type OutbreakFeatures = {
  recentCases: number;
  previousCases: number;
  rainfallMm?: number | null;
  temperatureCelsius?: number | null;
  humidityPercent?: number | null;
  waterQualityIndex?: number | null;
  sanitationCoverage?: number | null;
  floodingObserved?: boolean;
};

export type OutbreakRiskResult = {
  probability: number;
  confidence: number;
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  predictedCases: number;
  recommendation: string;
  features: OutbreakFeatures;
};

// Transparent baseline scoring until a validated trained model artifact is connected.
export function predictOutbreakRisk(features: OutbreakFeatures): OutbreakRiskResult {
  const trend = features.previousCases > 0
    ? (features.recentCases - features.previousCases) / features.previousCases
    : features.recentCases > 0 ? 1 : 0;
  let score = Math.min(0.42, features.recentCases * 0.035);
  score += Math.max(0, Math.min(0.22, trend * 0.2));
  if ((features.rainfallMm ?? 0) > 100) score += 0.1;
  if ((features.humidityPercent ?? 0) > 75) score += 0.05;
  if ((features.waterQualityIndex ?? 100) < 50) score += 0.12;
  if ((features.sanitationCoverage ?? 100) < 60) score += 0.1;
  if (features.floodingObserved) score += 0.12;
  const probability = Math.max(0.02, Math.min(0.98, score));
  const riskLevel = probability >= 0.8 ? "CRITICAL" : probability >= 0.6 ? "HIGH" : probability >= 0.35 ? "MODERATE" : "LOW";
  const predictedCases = Math.max(0, Math.round(features.recentCases * (1 + Math.max(-0.25, trend) + probability * 0.35)));
  const availableEnvironmentalInputs = [features.rainfallMm, features.temperatureCelsius, features.humidityPercent, features.waterQualityIndex, features.sanitationCoverage].filter((value) => value != null).length;
  const confidence = Math.min(0.92, 0.52 + availableEnvironmentalInputs * 0.07 + (features.previousCases > 0 ? 0.05 : 0));
  const recommendation = riskLevel === "CRITICAL"
    ? "Activate the emergency outbreak response, verify cases immediately, inspect water sources, and notify national authorities."
    : riskLevel === "HIGH"
      ? "Increase active case finding, test water sources, reinforce sanitation controls, and prepare treatment capacity."
      : riskLevel === "MODERATE"
        ? "Intensify surveillance, validate incoming cases, and monitor environmental indicators daily."
        : "Maintain routine surveillance, safe-water messaging, and weekly environmental monitoring.";
  return { probability, confidence, riskLevel, predictedCases, recommendation, features };
}
