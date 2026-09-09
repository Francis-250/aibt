"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { authApiRequest } from "@/lib/auth-api-client";
import Link from "next/link";

export function GovRegisterForm() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputClass = "mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const result = await authApiRequest("/api/auth/gov-register", {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      institution: String(form.get("institution") ?? ""),
      position: String(form.get("position") ?? ""),
      phone: String(form.get("phone") ?? ""),
      department: String(form.get("department") ?? ""),
      province: String(form.get("province") ?? ""),
      district: String(form.get("district") ?? ""),
    });
    if (!result.ok) {
      setError(result.error || "Registration failed.");
      setPending(false);
      return;
    }
    setSuccess(true);
    setPending(false);
  }

  if (success) {
    return (
      <div className="rounded border border-green-200 bg-green-50 p-5 text-center">
        <p className="text-green-800 font-semibold">Account created successfully!</p>
        <p className="mt-1 text-sm text-green-700">Your account is pending administrator approval. You will be able to sign in once approved.</p>
        <Link href="/auth/login" className="mt-3 inline-block text-sm font-semibold text-blue-700 underline">
          Go to Sign In
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block text-xs font-semibold text-slate-700">
        Full name
        <input name="name" required autoComplete="name" className={inputClass} />
      </label>
      <label className="block text-xs font-semibold text-slate-700">
        Work email
        <input name="email" type="email" required autoComplete="email" className={inputClass} />
      </label>
      <label className="block text-xs font-semibold text-slate-700">
        Password
        <input name="password" type="password" minLength={8} required autoComplete="new-password" className={inputClass} />
      </label>
      <label className="block text-xs font-semibold text-slate-700">
        Institution
        <input name="institution" required placeholder="e.g., Ministry of Health, WHO Rwanda" className={inputClass} />
      </label>
      <label className="block text-xs font-semibold text-slate-700">
        Position
        <input name="position" required placeholder="e.g., Epidemiologist, Director" className={inputClass} />
      </label>
      <label className="block text-xs font-semibold text-slate-700">
        Phone (optional)
        <input name="phone" type="tel" autoComplete="tel" className={inputClass} />
      </label>
      <label className="block text-xs font-semibold text-slate-700">
        Department (optional)
        <input name="department" placeholder="e.g., Disease Surveillance" className={inputClass} />
      </label>
      <label className="block text-xs font-semibold text-slate-700">
        Province (optional)
        <input name="province" placeholder="e.g., Kigali City" className={inputClass} />
      </label>
      <label className="block text-xs font-semibold text-slate-700">
        District (optional)
        <input name="district" placeholder="e.g., Gasabo" className={inputClass} />
      </label>
      {error && (
        <p className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
      )}
      <button disabled={pending} className="flex w-full items-center justify-center rounded bg-slate-950 px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
        {pending && <Loader2 className="mr-2 animate-spin" size={14} />}
        Create Government Official account
      </button>
      <p className="pt-1 text-center text-xs text-slate-500">
        Already registered?{" "}
        <Link href="/auth/login" className="font-semibold text-blue-700">
          Sign in
        </Link>
      </p>
    </form>
  );
}