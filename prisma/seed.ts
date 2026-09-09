import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { createPrismaPgConfig } from "../lib/prisma-pg";
import { hashPassword } from "../lib/password";
import { predictOutbreakRisk } from "../lib/ai";

config({ path: ".env" });
config({ path: ".env.local", override: true });
const prisma = new PrismaClient({
  adapter: new PrismaPg(createPrismaPgConfig()),
});
const password = process.env.SEED_USER_PASSWORD ?? "TyphoidWatch2026!";

const seedUsers = [
  {
    id: "seed-admin",
    name: "System Administrator",
    email: "admin@typhoidwatch.test",
    role: "admin",
  },
  {
    id: "seed-health-officer",
    name: "Dr. Aline Uwimana",
    email: "officer@typhoidwatch.test",
    role: "health_officer",
  },
  {
    id: "seed-government-official",
    name: "Jean Paul Niyonsenga",
    email: "official@typhoidwatch.test",
    role: "government_official",
  },
] as const;

async function main() {
  const passwordHash = await hashPassword(password);
  const users = new Map<string, { id: string; email: string }>();
  for (const item of seedUsers) {
    const user = await prisma.user.upsert({
      where: { email: item.email },
      create: {
        id: item.id,
        name: item.name,
        email: item.email,
        role: item.role,
        emailVerified: true,
        passwordHash,
      },
      update: {
        name: item.name,
        role: item.role,
        emailVerified: true,
        passwordHash,
        banned: false,
        banReason: null,
        banExpires: null,
        tokenVersion: { increment: 1 },
      },
      select: { id: true, email: true },
    });
    users.set(item.role, user);
  }

  const admin = users.get("admin")!;
  const officer = users.get("health_officer")!;
  const official = users.get("government_official")!;
  await prisma.healthOfficerProfile.upsert({
    where: { userId: officer.id },
    create: {
      userId: officer.id,
      employeeNumber: "RBC-HO-2026-001",
      facilityName: "Kigali City Health Unit",
      province: "Kigali City",
      district: "Gasabo",
      specialization: "Disease surveillance",
      isApproved: true,
      approvedAt: new Date(),
    },
    update: { isApproved: true, approvedAt: new Date() },
  });
  await prisma.governmentOfficialProfile.upsert({
    where: { userId: official.id },
    create: {
      userId: official.id,
      institution: "Ministry of Health",
      position: "Public Health Analyst",
    },
    update: {
      institution: "Ministry of Health",
      position: "Public Health Analyst",
    },
  });
  const model = await prisma.mLModel.upsert({
    where: {
      name_version: { name: "Typhoid Risk Baseline", version: "1.0.0" },
    },
    create: {
      id: "seed-model-baseline",
      name: "Typhoid Risk Baseline",
      version: "1.0.0",
      algorithm: "Transparent weighted epidemiological baseline",
      status: "ACTIVE",
      featureNames: [
        "recentCases",
        "previousCases",
        "rainfallMm",
        "temperatureCelsius",
        "humidityPercent",
        "waterQualityIndex",
        "sanitationCoverage",
        "floodingObserved",
      ],
      validationMetrics: {
        warning: "Development baseline requiring epidemiological validation.",
      },
      activatedAt: new Date(),
    },
    update: { status: "ACTIVE", activatedAt: new Date() },
  });
  await prisma.setting.upsert({
    where: { key: "alerts.highRiskThreshold" },
    create: {
      key: "alerts.highRiskThreshold",
      value: 0.6,
      category: "AI",
      description: "Probability threshold for high-risk alerts",
      updatedById: admin.id,
    },
    update: { value: 0.6, updatedById: admin.id },
  });

  const environment = await prisma.environmentalData.upsert({
    where: { id: "seed-environment-gasabo" },
    create: {
      id: "seed-environment-gasabo",
      recordedById: officer.id,
      province: "Kigali City",
      district: "Gasabo",
      sector: "Kimironko",
      recordedAt: new Date(),
      temperatureCelsius: 26,
      rainfallMm: 128,
      humidityPercent: 79,
      waterQualityIndex: 46,
      sanitationCoverage: 58,
      floodingObserved: true,
      isValidated: true,
    },
    update: {
      recordedById: officer.id,
      recordedAt: new Date(),
      isValidated: true,
    },
  });
  for (let index = 0; index < 8; index++) {
    const caseCode = `TYP-2026-${String(index + 1).padStart(6, "0")}`;
    await prisma.diseaseCase.upsert({
      where: { caseCode },
      create: {
        id: `seed-case-${index + 1}`,
        caseCode,
        submittedById: officer.id,
        validatedById: officer.id,
        status: index < 3 ? "CONFIRMED" : "SUSPECTED",
        validationStatus: "VALIDATED",
        patientAge: 18 + index * 4,
        patientSex: index % 2 ? "Male" : "Female",
        symptoms: ["fever", "headache", "abdominal pain"],
        symptomOnsetDate: new Date(Date.now() - index * 2 * 86400000),
        province: "Kigali City",
        district: "Gasabo",
        sector: "Kimironko",
        cell: "Bibare",
        village: "Abatuje",
        validatedAt: new Date(),
      },
      update: { validatedById: officer.id, validationStatus: "VALIDATED" },
    });
  }
  const result = predictOutbreakRisk({
    recentCases: 8,
    previousCases: 3,
    rainfallMm: environment.rainfallMm,
    temperatureCelsius: environment.temperatureCelsius,
    humidityPercent: environment.humidityPercent,
    waterQualityIndex: environment.waterQualityIndex,
    sanitationCoverage: environment.sanitationCoverage,
    floodingObserved: environment.floodingObserved,
  });
  const end = new Date();
  end.setDate(end.getDate() + 30);
  const prediction = await prisma.prediction.upsert({
    where: { id: "seed-prediction-gasabo" },
    create: {
      id: "seed-prediction-gasabo",
      requestedById: officer.id,
      modelId: model.id,
      geographicLevel: "DISTRICT",
      province: "Kigali City",
      district: "Gasabo",
      predictionDate: new Date(),
      windowStart: new Date(),
      windowEnd: end,
      predictedCaseCount: result.predictedCases,
      outbreakProbability: result.probability,
      confidenceScore: result.confidence,
      riskLevel: result.riskLevel,
      recommendation: result.recommendation,
      inputFeatures: result.features,
    },
    update: {
      requestedById: officer.id,
      modelId: model.id,
      predictionDate: new Date(),
      predictedCaseCount: result.predictedCases,
      outbreakProbability: result.probability,
      confidenceScore: result.confidence,
      riskLevel: result.riskLevel,
      recommendation: result.recommendation,
      inputFeatures: result.features,
    },
  });
  await prisma.alert.upsert({
    where: { id: "seed-alert-gasabo" },
    create: {
      id: "seed-alert-gasabo",
      predictionId: prediction.id,
      title: `${result.riskLevel} typhoid outbreak risk`,
      message: result.recommendation,
      riskLevel: result.riskLevel,
      province: "Kigali City",
      district: "Gasabo",
    },
    update: {
      predictionId: prediction.id,
      message: result.recommendation,
      riskLevel: result.riskLevel,
    },
  });

  console.log(
    "Seeded TyphoidWatch demo accounts for admin, health officer, and government official.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
