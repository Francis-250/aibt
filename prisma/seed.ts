import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
import { createPrismaPgConfig } from "../lib/prisma-pg";
import { predictOutbreakRisk } from "../lib/ai";

config({ path: ".env" });
config({ path: ".env.local", override: true });
const prisma = new PrismaClient({
  adapter: new PrismaPg(createPrismaPgConfig()),
});
const password = process.env.SEED_USER_PASSWORD ?? "TyphoidWatch2026!";

const users = [
  {
    id: "seed-admin",
    name: "System Administrator",
    email: "admin@typhoidwatch.test",
    username: "admin",
    role: "admin",
  },
  {
    id: "seed-health-officer",
    name: "Dr. Aline Uwimana",
    email: "officer@typhoidwatch.test",
    username: "officer",
    role: "health_officer",
  },
  {
    id: "seed-government-official",
    name: "Jean Paul Niyonsenga",
    email: "official@typhoidwatch.test",
    username: "official",
    role: "government_official",
  },
] as const;

async function main() {
  const hashed = await hashPassword(password);
  for (const item of users) {
    await prisma.user.upsert({
      where: { id: item.id },
      create: { ...item, emailVerified: true },
      update: { ...item, emailVerified: true, banned: false },
    });
    const account = await prisma.account.findFirst({
      where: { userId: item.id, providerId: "credential" },
    });
    if (account)
      await prisma.account.update({
        where: { id: account.id },
        data: { password: hashed },
      });
    else
      await prisma.account.create({
        data: {
          id: `credential-${item.id}`,
          accountId: item.id,
          providerId: "credential",
          userId: item.id,
          password: hashed,
        },
      });
  }
  await prisma.healthOfficerProfile.upsert({
    where: { userId: "seed-health-officer" },
    create: {
      userId: "seed-health-officer",
      employeeNumber: "RBC-HO-2026-001",
      facilityName: "Kigali City Health Unit",
      province: "Kigali City",
      district: "Gasabo",
      specialization: "Disease surveillance",
      isApproved: true,
      approvedAt: new Date(),
    },
    update: { isApproved: true },
  });
  await prisma.governmentOfficialProfile.upsert({
    where: { userId: "seed-government-official" },
    create: {
      userId: "seed-government-official",
      institution: "Ministry of Health",
      position: "Public Health Analyst",
    },
    update: { institution: "Ministry of Health" },
  });
  const model = await prisma.mLModel.upsert({
    where: {
      name_version: { name: "Typhoid Risk Baseline", version: "1.0.0" },
    },
    create: {
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
        warning:
          "Demonstration baseline. Validate against an approved epidemiological dataset before clinical deployment.",
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
      description: "Probability threshold for high-risk outbreak alerts",
      updatedById: "seed-admin",
    },
    update: { value: 0.6 },
  });
  const env = await prisma.environmentalData.create({
    data: {
      recordedById: "seed-health-officer",
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
  });
  const caseRows = Array.from({ length: 8 }, (_, i) => ({
    caseCode: `TYP-2026-${String(i + 1).padStart(6, "0")}`,
    submittedById: "seed-health-officer",
    validatedById: "seed-health-officer",
    status: i < 3 ? ("CONFIRMED" as const) : ("SUSPECTED" as const),
    validationStatus: "VALIDATED" as const,
    patientAge: 18 + i * 4,
    patientSex: i % 2 ? "Male" : "Female",
    symptoms: ["fever", "headache", "abdominal pain"],
    symptomOnsetDate: new Date(Date.now() - i * 2 * 86400000),
    province: "Kigali City",
    district: "Gasabo",
    sector: "Kimironko",
    validatedAt: new Date(),
  }));
  for (const row of caseRows)
    await prisma.diseaseCase.upsert({
      where: { caseCode: row.caseCode },
      create: row,
      update: { status: row.status },
    });
  const result = predictOutbreakRisk({
    recentCases: 8,
    previousCases: 3,
    rainfallMm: env.rainfallMm,
    temperatureCelsius: env.temperatureCelsius,
    humidityPercent: env.humidityPercent,
    waterQualityIndex: env.waterQualityIndex,
    sanitationCoverage: env.sanitationCoverage,
    floodingObserved: env.floodingObserved,
  });
  const existing = await prisma.prediction.findFirst({
    where: { modelId: model.id, province: "Kigali City", district: "Gasabo" },
  });
  if (!existing) {
    const end = new Date();
    end.setDate(end.getDate() + 30);
    const p = await prisma.prediction.create({
      data: {
        requestedById: "seed-health-officer",
        modelId: model.id,
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
    });
    await prisma.alert.create({
      data: {
        predictionId: p.id,
        title: `${result.riskLevel} typhoid outbreak risk`,
        message: result.recommendation,
        riskLevel: result.riskLevel,
        province: "Kigali City",
        district: "Gasabo",
      },
    });
  }
  console.log("TyphoidWatch seed accounts");
  console.table(users.map((u) => ({ role: u.role, email: u.email, password })));
}
main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
