"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { authApiRequest } from "@/lib/auth-api-client";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter(); const [error,setError]=useState(""); const [pending,setPending]=useState(false);
  const inputClass="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";
  async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();setPending(true);setError("");const form=new FormData(event.currentTarget);const result=await authApiRequest(`/api/auth/${mode}`,{name:String(form.get("name")??""),email:String(form.get("email")??""),password:String(form.get("password")??"")});if(!result.ok){setError(result.error||"Authentication failed.");setPending(false);return}router.replace(result.redirectTo||"/auth/redirect");router.refresh()}
  return <form onSubmit={submit} className="space-y-3">{mode==="register"&&<label className="block text-xs font-semibold text-slate-700">Full name<input name="name" required autoComplete="name" className={inputClass}/></label>}<label className="block text-xs font-semibold text-slate-700">Work email<input name="email" type="email" required autoComplete="email" className={inputClass}/></label><label className="block text-xs font-semibold text-slate-700">Password<input name="password" type="password" minLength={8} required autoComplete={mode==="login"?"current-password":"new-password"} className={inputClass}/></label>{mode==="login"&&<div className="text-right"><Link href="/auth/forgot-password" className="text-xs font-semibold text-blue-700">Forgot password?</Link></div>}{error&&<p className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}<button disabled={pending} className="flex w-full items-center justify-center rounded bg-slate-950 px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{pending&&<Loader2 className="mr-2 animate-spin" size={14}/>} {mode==="login"?"Sign in":"Create Health Officer account"}</button><p className="pt-1 text-center text-xs text-slate-500">{mode==="login"?"New to TyphoidWatch?":"Already registered?"} <Link className="font-semibold text-blue-700" href={mode==="login"?"/auth/register":"/auth/login"}>{mode==="login"?"Create account":"Sign in"}</Link></p></form>;
}
