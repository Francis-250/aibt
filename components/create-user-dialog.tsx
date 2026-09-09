"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { createUser } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState("health_officer");
  const input = "w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-400";

  async function submit(formData: FormData) {
    await createUser(formData);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded bg-slate-950 text-white">
          <Plus /> Add user
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create new user</DialogTitle>
          <DialogDescription>Enter user details and assign a role. Health Officer and Government Official accounts require admin verification.</DialogDescription>
        </DialogHeader>
        <form action={submit} className="grid gap-3">
          <label className="text-xs font-semibold">
            Full name
            <input name="name" required autoComplete="name" className={`mt-1 ${input}`} />
          </label>
          <label className="text-xs font-semibold">
            Email address
            <input name="email" type="email" required autoComplete="email" className={`mt-1 ${input}`} />
          </label>
          <label className="text-xs font-semibold">
            Password
            <input name="password" type="password" minLength={8} required autoComplete="new-password" className={`mt-1 ${input}`} />
          </label>
          <label className="text-xs font-semibold">
            Role
            <select name="role" value={role} onChange={(e) => setRole(e.target.value)} className={`mt-1 ${input}`}>
              <option value="health_officer">Health Officer</option>
              <option value="government_official">Government Official</option>
              <option value="admin">Administrator</option>
            </select>
          </label>
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" className="rounded" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded bg-slate-950 text-white">Create account</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}