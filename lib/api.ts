import { NextResponse } from "next/server";

export function jsonOk(data: Record<string, unknown> = {}, status = 200) {
  return NextResponse.json({ ok: true, ...data }, { status });
}
export function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}
export function serverError(error: unknown, context: string) {
  console.error(
    context,
    error instanceof Error
      ? { name: error.name, message: error.message }
      : { message: "Unknown server error" },
  );
  return jsonError(
    "The server could not complete this request. Please try again.",
    500,
  );
}
