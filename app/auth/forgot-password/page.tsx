"use client";
import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState(""); const [pending, setPending] = useState(false); const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent) { event.preventDefault(); setPending(true); const { error } = await authClient.requestPasswordReset({ email, redirectTo: "/auth/reset-password" }); setPending(false); setMessage(error?.message ?? "Check your email for a secure reset link."); }
  return <><p className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-700">Account recovery</p><h1 className="mt-1.5 text-2xl font-black">Reset password</h1><p className="mb-4 mt-1 text-xs text-slate-500">Enter the email connected to your account.</p><form onSubmit={submit} className="space-y-3"><label className="block text-xs font-semibold text-slate-700">Work email<input value={email} onChange={event => setEmail(event.target.value)} type="email" required className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"/></label>{message && <p className="rounded bg-slate-50 px-3 py-2 text-xs text-slate-600">{message}</p>}<button disabled={pending} className="w-full rounded bg-blue-900 px-3 py-2.5 text-sm font-bold text-white disabled:opacity-60">{pending ? "Sending…" : "Send reset link"}</button><p className="text-center text-xs text-slate-500"><Link href="/auth/login" className="font-bold text-blue-700">Return to sign in</Link></p></form></>;
}
