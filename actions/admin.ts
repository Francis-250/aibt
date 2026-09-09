"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { hashPassword } from "@/lib/password";

export async function updateUserRole(userId: string, formData: FormData) {
  const s = await requireSession(["admin"]);
  const role = z.enum(["admin", "health_officer", "government_official"]).parse(formData.get("role"));
  await prisma.user.update({ where: { id: userId }, data: { role, tokenVersion: { increment: 1 } } });
  await prisma.auditLog.create({ data: { userId: s.user.id, action: "USER_ROLE_UPDATED", entity: "User", entityId: userId, metadata: { role, sessionsInvalidated: true } } });
  revalidatePath("/admin/users");
}

export async function setUserSuspension(userId: string, suspended: boolean, reason?: string) {
  const s = await requireSession(["admin"]);
  await prisma.user.update({
    where: { id: userId },
    data: {
      banned: suspended,
      banReason: suspended ? (reason?.trim() || "Suspended by administrator") : null,
      banExpires: null,
      tokenVersion: { increment: 1 },
    },
  });
  await prisma.auditLog.create({ data: { userId: s.user.id, action: suspended ? "USER_SUSPENDED" : "USER_REACTIVATED", entity: "User", entityId: userId, metadata: { sessionsInvalidated: true } } });
  revalidatePath("/admin/users");
}

export async function createModel(formData: FormData) {
  const s = await requireSession(["admin"]);
  const name = z.string().min(2).parse(formData.get("name"));
  const version = z.string().min(1).parse(formData.get("version"));
  const algorithm = z.string().min(2).parse(formData.get("algorithm"));
  await prisma.mLModel.create({
    data: {
      name,
      version,
      algorithm,
      status: "ACTIVE",
      featureNames: ["recentCases", "previousCases", "rainfallMm", "temperatureCelsius", "humidityPercent", "waterQualityIndex", "sanitationCoverage", "floodingObserved"],
      activatedAt: new Date(),
      validationMetrics: { note: "Transparent baseline model; validate on epidemiological dataset before production decisions." },
    },
  });
  await prisma.auditLog.create({ data: { userId: s.user.id, action: "ML_MODEL_CREATED", entity: "MLModel", description: `${name} ${version}` } });
  revalidatePath("/admin/models");
}

export async function updateSetting(formData: FormData) {
  const s = await requireSession(["admin"]);
  const key = z.string().min(2).parse(formData.get("key"));
  const value = z.string().min(1).parse(formData.get("value"));
  await prisma.setting.upsert({ where: { key }, create: { key, value, category: "SYSTEM", updatedById: s.user.id }, update: { value, updatedById: s.user.id } });
  revalidatePath("/admin/settings");
}

export async function createUser(formData: FormData) {
  const s = await requireSession(["admin"]);
  const data = z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8).max(200),
    role: z.enum(["admin", "health_officer", "government_official"]),
  }).parse(Object.fromEntries(formData));

  const email = data.email.trim().toLowerCase();
  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    throw new Error("An account with this email already exists.");
  }

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email,
      role: data.role,
      passwordHash: await hashPassword(data.password),
      isActive: true,
    },
  });

  if (data.role === "health_officer") {
    await prisma.healthOfficerProfile.create({
      data: { userId: user.id, status: "PENDING" },
    });
  } else if (data.role === "government_official") {
    await prisma.governmentOfficialProfile.create({
      data: { userId: user.id, status: "PENDING" },
    });
  }

  await prisma.auditLog.create({ data: { userId: s.user.id, action: "USER_CREATED", entity: "User", entityId: user.id, metadata: { role: data.role } } });
  revalidatePath("/admin/users");
}

export async function toggleUserActive(userId: string, isActive: boolean) {
  const s = await requireSession(["admin"]);
  await prisma.user.update({
    where: { id: userId },
    data: { isActive, tokenVersion: { increment: 1 } },
  });
  await prisma.auditLog.create({ data: { userId: s.user.id, action: isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED", entity: "User", entityId: userId, metadata: { sessionsInvalidated: true } } });
  revalidatePath("/admin/users");
}

export async function verifyHealthOfficer(profileId: string, action: "VERIFY" | "REJECT", rejectionReason?: string) {
  const s = await requireSession(["admin"]);
  const profile = await prisma.healthOfficerProfile.findUnique({ where: { id: profileId }, include: { user: true } });
  if (!profile) throw new Error("Health officer profile not found");

  if (action === "VERIFY") {
    await prisma.$transaction([
      prisma.healthOfficerProfile.update({
        where: { id: profileId },
        data: {
          status: "VERIFIED",
          verifiedById: s.user.id,
          verifiedAt: new Date(),
          isApproved: true,
          approvedAt: new Date(),
        },
      }),
      prisma.user.update({
        where: { id: profile.userId },
        data: { isActive: true },
      }),
    ]);
    await prisma.auditLog.create({ data: { userId: s.user.id, action: "HEALTH_OFFICER_VERIFIED", entity: "HealthOfficerProfile", entityId: profileId, description: `Verified ${profile.user.name}` } });
  } else {
    await prisma.healthOfficerProfile.update({
      where: { id: profileId },
      data: {
        status: "REJECTED",
        rejectionReason: rejectionReason?.trim() || "Rejected by administrator",
        isApproved: false,
      },
    });
    await prisma.auditLog.create({ data: { userId: s.user.id, action: "HEALTH_OFFICER_REJECTED", entity: "HealthOfficerProfile", entityId: profileId, description: `Rejected ${profile.user.name}: ${rejectionReason}` } });
  }
  revalidatePath("/admin/health-officers");
}

export async function activateHealthOfficer(profileId: string) {
  const s = await requireSession(["admin"]);
  const profile = await prisma.healthOfficerProfile.findUnique({ where: { id: profileId }, include: { user: true } });
  if (!profile) throw new Error("Health officer profile not found");
  if (profile.status !== "VERIFIED") throw new Error("Health officer must be verified first");

  await prisma.$transaction([
    prisma.healthOfficerProfile.update({
      where: { id: profileId },
      data: { status: "ACTIVE" },
    }),
    prisma.user.update({
      where: { id: profile.userId },
      data: { isActive: true },
    }),
  ]);
  await prisma.auditLog.create({ data: { userId: s.user.id, action: "HEALTH_OFFICER_ACTIVATED", entity: "HealthOfficerProfile", entityId: profileId, description: `Activated ${profile.user.name}` } });
  revalidatePath("/admin/health-officers");
}

export async function suspendHealthOfficer(profileId: string, reason?: string) {
  const s = await requireSession(["admin"]);
  const profile = await prisma.healthOfficerProfile.findUnique({ where: { id: profileId }, include: { user: true } });
  if (!profile) throw new Error("Health officer profile not found");

  await prisma.$transaction([
    prisma.healthOfficerProfile.update({
      where: { id: profileId },
      data: { status: "SUSPENDED", rejectionReason: reason?.trim() || "Suspended by administrator" },
    }),
    prisma.user.update({
      where: { id: profile.userId },
      data: { isActive: false, tokenVersion: { increment: 1 } },
    }),
  ]);
  await prisma.auditLog.create({ data: { userId: s.user.id, action: "HEALTH_OFFICER_SUSPENDED", entity: "HealthOfficerProfile", entityId: profileId, description: `Suspended ${profile.user.name}: ${reason}` } });
  revalidatePath("/admin/health-officers");
}

export async function approveGovernmentOfficial(profileId: string, action: "APPROVE" | "REJECT", rejectionReason?: string) {
  const s = await requireSession(["admin"]);
  const profile = await prisma.governmentOfficialProfile.findUnique({ where: { id: profileId }, include: { user: true } });
  if (!profile) throw new Error("Government official profile not found");

  if (action === "APPROVE") {
    await prisma.$transaction([
      prisma.governmentOfficialProfile.update({
        where: { id: profileId },
        data: {
          status: "APPROVED",
          approvedById: s.user.id,
          approvedAt: new Date(),
        },
      }),
      prisma.user.update({
        where: { id: profile.userId },
        data: { isActive: true },
      }),
    ]);
    await prisma.auditLog.create({ data: { userId: s.user.id, action: "GOVERNMENT_OFFICIAL_APPROVED", entity: "GovernmentOfficialProfile", entityId: profileId, description: `Approved ${profile.user.name}` } });
  } else {
    await prisma.governmentOfficialProfile.update({
      where: { id: profileId },
      data: {
        status: "REJECTED",
        rejectionReason: rejectionReason?.trim() || "Rejected by administrator",
      },
    });
    await prisma.auditLog.create({ data: { userId: s.user.id, action: "GOVERNMENT_OFFICIAL_REJECTED", entity: "GovernmentOfficialProfile", entityId: profileId, description: `Rejected ${profile.user.name}: ${rejectionReason}` } });
  }
  revalidatePath("/admin/government-officials");
}

export async function suspendGovernmentOfficial(profileId: string, reason?: string) {
  const s = await requireSession(["admin"]);
  const profile = await prisma.governmentOfficialProfile.findUnique({ where: { id: profileId }, include: { user: true } });
  if (!profile) throw new Error("Government official profile not found");

  await prisma.$transaction([
    prisma.governmentOfficialProfile.update({
      where: { id: profileId },
      data: { status: "SUSPENDED", rejectionReason: reason?.trim() || "Suspended by administrator" },
    }),
    prisma.user.update({
      where: { id: profile.userId },
      data: { isActive: false, tokenVersion: { increment: 1 } },
    }),
  ]);
  await prisma.auditLog.create({ data: { userId: s.user.id, action: "GOVERNMENT_OFFICIAL_SUSPENDED", entity: "GovernmentOfficialProfile", entityId: profileId, description: `Suspended ${profile.user.name}: ${reason}` } });
  revalidatePath("/admin/government-officials");
}

export async function updateDiseaseCase(formData: FormData) {
  const s = await requireSession(["health_officer", "admin"]);
  const caseId = z.string().cuid().parse(formData.get("caseId"));
  const data = z.object({
    province: z.string().trim().min(1),
    district: z.string().trim().min(1),
    sector: z.string().trim().optional().nullable(),
    cell: z.string().trim().optional().nullable(),
    village: z.string().trim().optional().nullable(),
    patientAge: z.coerce.number().int().min(0).max(120),
    patientSex: z.string().trim().min(1),
    symptoms: z.string().trim().min(1),
    onsetDate: z.string().trim().min(1),
    status: z.enum(["SUSPECTED", "PROBABLE", "CONFIRMED", "DISCARDED"]),
    laboratoryResult: z.string().optional().nullable(),
    outcome: z.enum(["UNDER_TREATMENT", "RECOVERED", "DECEASED", "UNKNOWN"]),
    healthFacility: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  }).parse(Object.fromEntries(formData));

  const diseaseCase = await prisma.diseaseCase.update({
    where: { id: caseId },
    data: {
      province: data.province,
      district: data.district,
      sector: data.sector,
      cell: data.cell,
      village: data.village,
      patientAge: data.patientAge,
      patientSex: data.patientSex,
      symptoms: data.symptoms.split(",").map((item) => item.trim()).filter(Boolean),
      symptomOnsetDate: new Date(data.onsetDate),
      status: data.status,
      laboratoryResult: data.laboratoryResult,
      outcome: data.outcome,
      healthFacility: data.healthFacility,
      notes: data.notes,
    },
  });
  await prisma.auditLog.create({ data: { userId: s.user.id, action: "DISEASE_CASE_UPDATED", entity: "DiseaseCase", entityId: caseId, description: `Updated ${diseaseCase.caseCode}` } });
  revalidatePath("/health-officer/cases");
  revalidatePath("/admin/cases");
}

export async function deleteDiseaseCase(caseId: string) {
  const s = await requireSession(["admin"]);
  const diseaseCase = await prisma.diseaseCase.delete({ where: { id: caseId } });
  await prisma.auditLog.create({ data: { userId: s.user.id, action: "DISEASE_CASE_DELETED", entity: "DiseaseCase", entityId: caseId, description: `Deleted ${diseaseCase.caseCode}` } });
  revalidatePath("/health-officer/cases");
  revalidatePath("/admin/cases");
}

export async function updateEnvironmentalRecord(formData: FormData) {
  const s = await requireSession(["health_officer", "admin"]);
  const recordId = z.string().cuid().parse(formData.get("recordId"));
  const data = z.object({
    province: z.string().trim().min(1),
    district: z.string().trim().min(1),
    sector: z.string().trim().optional().nullable(),
    recordedAt: z.string().trim().min(1),
    temperatureCelsius: z.coerce.number().optional().nullable(),
    rainfallMm: z.coerce.number().optional().nullable(),
    humidityPercent: z.coerce.number().optional().nullable(),
    waterQualityIndex: z.coerce.number().optional().nullable(),
    sanitationCoverage: z.coerce.number().optional().nullable(),
    floodingObserved: z.boolean(),
    cleanWaterAccess: z.coerce.number().optional().nullable(),
    populationDensity: z.coerce.number().optional().nullable(),
    notes: z.string().optional().nullable(),
  }).parse(Object.fromEntries(formData));

  const record = await prisma.environmentalData.update({
    where: { id: recordId },
    data: {
      province: data.province,
      district: data.district,
      sector: data.sector,
      recordedAt: new Date(data.recordedAt),
      temperatureCelsius: data.temperatureCelsius,
      rainfallMm: data.rainfallMm,
      humidityPercent: data.humidityPercent,
      waterQualityIndex: data.waterQualityIndex,
      sanitationCoverage: data.sanitationCoverage,
      floodingObserved: data.floodingObserved,
      cleanWaterAccess: data.cleanWaterAccess,
      populationDensity: data.populationDensity,
      notes: data.notes,
    },
  });
  await prisma.auditLog.create({ data: { userId: s.user.id, action: "ENVIRONMENTAL_DATA_UPDATED", entity: "EnvironmentalData", entityId: recordId, description: `${record.district}, ${record.province}` } });
  revalidatePath("/health-officer/environment");
}

export async function deleteEnvironmentalRecord(recordId: string) {
  const s = await requireSession(["admin"]);
  await prisma.environmentalData.delete({ where: { id: recordId } });
  await prisma.auditLog.create({ data: { userId: s.user.id, action: "ENVIRONMENTAL_DATA_DELETED", entity: "EnvironmentalData", entityId: recordId } });
  revalidatePath("/health-officer/environment");
}