import { z } from "zod";
import prisma from "@/lib/prisma";
import { jsonError, jsonOk, serverError } from "@/lib/api";
import { hashPassword } from "@/lib/password";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(200),
  institution: z.string().trim().min(2).max(200),
  position: z.string().trim().min(2).max(100),
  phone: z.string().trim().optional(),
  department: z.string().trim().optional(),
  province: z.string().trim().optional(),
  district: z.string().trim().optional(),
});

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success)
      return jsonError(
        "Provide valid name, email, password, institution, and position.",
        400,
      );
    const email = parsed.data.email.trim().toLowerCase();
    if (
      await prisma.user.findUnique({ where: { email }, select: { id: true } })
    )
      return jsonError("An account with this email already exists.", 409);

    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        role: "government_official",
        passwordHash: await hashPassword(parsed.data.password),
        isActive: false,
      },
    });

    await prisma.governmentOfficialProfile.create({
      data: {
        userId: user.id,
        institution: parsed.data.institution,
        position: parsed.data.position,
        phone: parsed.data.phone,
        department: parsed.data.department,
        province: parsed.data.province,
        district: parsed.data.district,
        status: "PENDING",
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "GOVERNMENT_OFFICIAL_REGISTERED",
        entity: "User",
        entityId: user.id,
        description: `${parsed.data.institution} - ${parsed.data.position}`,
      },
    });

    return jsonOk({ redirectTo: "/auth/login?registered=gov" }, 201);
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      error.code === "P2002"
    )
      return jsonError("An account with this email already exists.", 409);
    return serverError(error, "Registration failed");
  }
}