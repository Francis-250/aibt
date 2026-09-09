"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/session";

const optional = (formData: FormData, key: string) => {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
};

const optionalNumber = (formData: FormData, key: string) => {
  const value = String(formData.get(key) ?? "").trim();
  return value ? Number(value) : null;
};

export async function updateAdminProfile(formData: FormData) {
  const session = await requireSession(["admin"]);
  const name = z.string().trim().min(2).max(100).parse(formData.get("name"));
  const phone = optional(formData, "phone");
  await prisma.user.update({ where: { id: session.user.id }, data: { name, phone } });
  await prisma.auditLog.create({ data: { userId: session.user.id, action: "PROFILE_UPDATED", entity: "User", entityId: session.user.id } });
  revalidatePath("/admin/profile");
}

export async function updateHealthOfficerProfile(formData: FormData) {
  const session = await requireSession(["health_officer"]);
  const name = z.string().trim().min(2).max(100).parse(formData.get("name"));
  const phone = optional(formData, "phone");
  const yearsExperience = optionalNumber(formData, "yearsExperience");

  await prisma.$transaction([
    prisma.user.update({ where: { id: session.user.id }, data: { name, phone } }),
    prisma.healthOfficerProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        employeeNumber: optional(formData, "employeeNumber"),
        facilityName: optional(formData, "facilityName"),
        specialization: optional(formData, "specialization"),
        province: optional(formData, "province"),
        district: optional(formData, "district"),
        qualification: optional(formData, "qualification"),
        yearsExperience,
      },
      update: {
        employeeNumber: optional(formData, "employeeNumber"),
        facilityName: optional(formData, "facilityName"),
        specialization: optional(formData, "specialization"),
        province: optional(formData, "province"),
        district: optional(formData, "district"),
        qualification: optional(formData, "qualification"),
        yearsExperience,
      },
    }),
    prisma.auditLog.create({ data: { userId: session.user.id, action: "PROFILE_UPDATED", entity: "HealthOfficerProfile", entityId: session.user.id } }),
  ]);
  revalidatePath("/health-officer/profile");
}

export async function updateGovernmentOfficialProfile(formData: FormData) {
  const session = await requireSession(["government_official"]);
  const name = z.string().trim().min(2).max(100).parse(formData.get("name"));
  const phone = optional(formData, "phone");

  await prisma.$transaction([
    prisma.user.update({ where: { id: session.user.id }, data: { name, phone } }),
    prisma.governmentOfficialProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        institution: optional(formData, "institution"),
        position: optional(formData, "position"),
        department: optional(formData, "department"),
        province: optional(formData, "province"),
        district: optional(formData, "district"),
      },
      update: {
        institution: optional(formData, "institution"),
        position: optional(formData, "position"),
        department: optional(formData, "department"),
        province: optional(formData, "province"),
        district: optional(formData, "district"),
      },
    }),
    prisma.auditLog.create({ data: { userId: session.user.id, action: "PROFILE_UPDATED", entity: "GovernmentOfficialProfile", entityId: session.user.id } }),
  ]);
  revalidatePath("/government-official/profile");
}