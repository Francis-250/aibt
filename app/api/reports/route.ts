import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/session";

const schema = z.object({
  title: z.string().trim().min(3).max(200),
  type: z.enum(["DAILY", "WEEKLY", "MONTHLY", "ANNUAL", "PREDICTION", "REGIONAL", "NATIONAL", "SUMMARY"]),
  province: z.string().trim().optional().nullable(),
  district: z.string().trim().optional().nullable(),
  periodStart: z.string().trim().min(1),
  periodEnd: z.string().trim().min(1),
  filters: z.string().trim().optional().nullable(),
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

function removeKeys(row: object, keys: string[]) {
  const result = { ...row } as Record<string, unknown>;
  for (const key of keys) delete result[key];
  return result;
}

export async function POST(request: Request) {
  const session = await requireSession(["admin", "health_officer", "government_official"]);
  const formData = await request.formData();
  const parsed = schema.safeParse({
    title: formData.get("title"),
    type: formData.get("type"),
    province: formData.get("province"),
    district: formData.get("district"),
    periodStart: formData.get("periodStart"),
    periodEnd: formData.get("periodEnd"),
    filters: formData.get("filters"),
  });
  if (!parsed.success) return NextResponse.json({ error: "Complete the report fields." }, { status: 400 });

  const { title, type, province, district, periodStart, periodEnd, filters } = parsed.data;
  const start = new Date(periodStart);
  const end = new Date(`${periodEnd}T23:59:59.999Z`);
  const extra = filters ? JSON.parse(filters) as { status?: string; validationStatus?: string } : {};
  const location = {
    ...(province ? { province } : {}),
    ...(district ? { district } : {}),
  };
  const ownCases = session.role === "health_officer" ? { submittedById: session.user.id } : {};
  let rows: Record<string, unknown>[];

  if (type === "PREDICTION") {
    const predictions = await prisma.prediction.findMany({
      where: {
        ...location,
        predictionDate: { gte: start, lte: end },
        ...(session.role === "health_officer" ? { requestedById: session.user.id } : {}),
      },
      orderBy: { predictionDate: "desc" },
    });
    rows = predictions.map((row) => removeKeys(row, ["id", "requestedById", "modelId"]));
  } else {
    const cases = await prisma.diseaseCase.findMany({
      where: {
        ...location,
        symptomOnsetDate: { gte: start, lte: end },
        ...ownCases,
        ...(extra.status ? { status: extra.status as never } : {}),
        ...(extra.validationStatus ? { validationStatus: extra.validationStatus as never } : {}),
      },
      orderBy: { symptomOnsetDate: "desc" },
    });
    rows = cases.map((row) => removeKeys(row, ["id", "submittedById", "validatedById"]));
  }

  const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "report"}.csv`;
  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
