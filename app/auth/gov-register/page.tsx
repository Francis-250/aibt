import { GovRegisterForm } from "@/components/gov-register-form";

export default function GovRegisterPage() {
  return (
    <>
      <p className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-700">Government registration</p>
      <h1 className="mt-1.5 text-2xl font-black">Create Government Official account</h1>
      <p className="mb-4 mt-1 text-xs text-slate-500">Accounts require administrator approval before access is granted.</p>
      <GovRegisterForm />
    </>
  );
}