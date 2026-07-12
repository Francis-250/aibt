import { cookies } from "next/headers";
import { jsonOk, serverError } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/jwt";

export async function POST() {
  try { (await cookies()).delete(SESSION_COOKIE); return jsonOk(); }
  catch (error) { return serverError(error, "Logout failed"); }
}
