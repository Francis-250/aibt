"use client";

import { useState } from "react";
import { Eye, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type UserDetails = {
  name: string;
  email: string;
  role: string;
  createdAt: string;
  isActive: boolean;
  banned: boolean;
  phone: string | null;
  profile: Record<string, string | null> | null;
};

export function UserDetailsDialog({ user }: { user: UserDetails }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const status = user.banned ? "Suspended" : user.isActive ? "Active" : "Inactive";
  return <>
    <div className="relative">
      <Button type="button" variant="outline" size="icon-sm" aria-label={`Actions for ${user.name}`} onClick={() => setMenuOpen((value) => !value)}>
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      {menuOpen && <div className="absolute right-0 z-20 mt-1 w-36 rounded border bg-white p-1 shadow-lg">
        <button type="button" className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-slate-50" onClick={() => { setOpen(true); setMenuOpen(false); }}>
          <Eye className="h-3.5 w-3.5" /> View details
        </button>
      </div>}
    </div>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded sm:max-w-xl">
        <DialogHeader><DialogTitle>{user.name}</DialogTitle><DialogDescription>{user.email}</DialogDescription></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Detail label="Role" value={user.role.replaceAll("_", " ")} />
          <Detail label="Status" value={status} />
          <Detail label="Phone" value={user.phone ?? "—"} />
          <Detail label="Registered" value={new Date(user.createdAt).toLocaleString()} />
          {user.profile && Object.entries(user.profile).map(([key, value]) => <Detail key={key} label={key.replaceAll(/([A-Z])/g, " $1")} value={value ?? "—"} />)}
        </div>
      </DialogContent>
    </Dialog>
  </>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="rounded border bg-slate-50 p-3"><p className="text-xs capitalize text-slate-500">{label}</p><p className="mt-1 text-sm font-medium capitalize">{value}</p></div>;
}
