export type AuthApiResult = { ok: boolean; error?: string; message?: string; redirectTo?: string };

export async function authApiRequest(path: string, body?: Record<string, unknown>): Promise<AuthApiResult> {
  try {
    const response = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const text = await response.text();
    let data: AuthApiResult | null = null;
    if (text) { try { data = JSON.parse(text) as AuthApiResult; } catch { data = null; } }
    if (!response.ok) return { ok: false, error: data?.error || "The request could not be completed. Please try again." };
    return data && typeof data.ok === "boolean" ? data : { ok: true };
  } catch { return { ok: false, error: "Unable to connect to the server. Check your connection and try again." }; }
}
