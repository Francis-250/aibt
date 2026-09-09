import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/session";

const schema = z.object({
  type: z.enum(["disease_cases", "environmental_data", "predictions"]),
  province: z.string().trim().optional().nullable(),
  district: z.string().trim().optional().nullable(),
  startDate: z.string().trim().optional().nullable(),
  endDate: z.string().trim().optional().nullable(),
});

function csvValue(value: unknown) {
  if (value === null || value === undefined) return "";
  const text = value instanceof Date ? value.toISOString() : typeof value === "object" ? JSON.stringify(value) : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "No records found\n";
  const columns = Object.keys(rows[0]);
  return `${columns.map(csvValue).join(",")}\n${rows.map((row) => columns.map((column) => csvValue(row[column])).join(",")).join("\n")}\n`;
}

function withoutKeys(row: object, keys: string[]) {
  const result = { ...row } as Record<string, unknown>;
  for (const key of keys) delete result[key];
  return result;
}

export async function POST(request: Request) {
  const session = await requireSession(["admin", "health_officer"]);
  const formData = await request.formData();
  const parsed = schema.safeParse({
    type: formData.get("type"),
    province: formData.get("province"),
    district: formData.get("district"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });

  if (!parsed.success) return NextResponse.json({ error: "Invalid export filters." }, { status: 400 });

  const { type, province, district, startDate, endDate } = parsed.data;
  const dateFilter = startDate || endDate ? {
    gte: startDate ? new Date(startDate) : undefined,
    lte: endDate ? new Date(`${endDate}T23:59:59.999Z`) : undefined,
  } : undefined;
  const locationFilter = {
    ...(province ? { province } : {}),
    ...(district ? { district } : {}),
  };

  let rows: Record<string, unknown>[];
  if (type === "disease_cases") {
    const data = await prisma.diseaseCase.findMany({
      where: {
        ...locationFilter,
        ...(dateFilter ? { symptomOnsetDate: dateFilter } : {}),
        ...(session.role === "health_officer" ? { submittedById: session.user.id } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
    rows = data.map((row) => withoutKeys(row, ["id", "submittedById", "validatedById"]));
  } else if (type === "environmental_data") {
    const data = await prisma.environmentalData.findMany({
      where: {
        ...locationFilter,
        ...(dateFilter ? { recordedAt: dateFilter } : {}),
        ...(session.role === "health_officer" ? { recordedById: session.user.id } : {}),
      },
      orderBy: { recordedAt: "desc" },
    });
    rows = data.map((row) => withoutKeys(row, ["id", "recordedById"]));
  } else {
    const data = await prisma.prediction.findMany({
      where: {
        ...locationFilter,
        ...(dateFilter ? { predictionDate: dateFilter } : {}),
        ...(session.role === "health_officer" ? { requestedById: session.user.id } : {}),
      },
      orderBy: { predictionDate: "desc" },
    });
    rows = data.map((row) => withoutKeys(row, ["id", "requestedById", "modelId"]));
  }

  const filename = `${type}-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
