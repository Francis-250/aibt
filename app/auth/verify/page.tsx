import { VerifyForm } from "@/components/verify-form";

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email = "" } = await searchParams;
  return <><p className="text-xs font-bold uppercase tracking-[.2em] text-blue-700">Email verification</p><h1 className="mt-3 text-3xl font-black">Enter your code</h1><p className="mb-8 mt-2 text-sm text-slate-500">We sent a six-digit verification code to {email}.</p><VerifyForm email={email}/></>;
}
