"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, Bell, BrainCircuit, ClipboardPlus, Database, FileText, LayoutDashboard, LogOut, Settings, ShieldCheck, Users } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

const links = {
  admin: [["Overview", "/admin", LayoutDashboard], ["Users", "/admin/users", Users], ["Cases", "/admin/cases", ClipboardPlus], ["AI models", "/admin/models", BrainCircuit], ["Reports", "/admin/reports", FileText], ["Audit log", "/admin/audit", ShieldCheck], ["Settings", "/admin/settings", Settings]],
  health_officer: [["Overview", "/health-officer", LayoutDashboard], ["Disease cases", "/health-officer/cases", ClipboardPlus], ["Environment", "/health-officer/environment", Database], ["Predictions", "/health-officer/predictions", BrainCircuit], ["Alerts", "/health-officer/alerts", Bell], ["Reports", "/health-officer/reports", FileText]],
  government_official: [["National overview", "/government-official", LayoutDashboard], ["Predictions", "/government-official/predictions", BrainCircuit], ["Alerts", "/government-official/alerts", Bell], ["Reports", "/government-official/reports", FileText]],
} as const;

export function AppShell({ role, name, children }: { role: keyof typeof links; name: string; children: React.ReactNode }) {
  const path = usePathname(); const router = useRouter();
  const activeLabel = links[role].find(([, href]) => path === href)?.[0] ?? "Workspace";
  return <TooltipProvider><SidebarProvider>
    <Sidebar collapsible="icon" variant="sidebar" className="border-slate-200">
      <SidebarHeader className="border-b border-slate-200 p-3">
        <SidebarMenu><SidebarMenuItem><SidebarMenuButton asChild size="lg" tooltip="TyphoidWatch Rwanda"><Link href={links[role][0][1]}><span className="grid size-8 shrink-0 place-items-center rounded bg-slate-950 text-white"><Activity size={17}/></span><span className="min-w-0"><strong className="block truncate text-sm">TyphoidWatch</strong><small className="block truncate text-[10px] text-slate-500">Rwanda surveillance</small></span></Link></SidebarMenuButton></SidebarMenuItem></SidebarMenu>
      </SidebarHeader>
      <SidebarContent><SidebarGroup><SidebarGroupLabel>Workspace</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>{links[role].map(([label, href, Icon]) => <SidebarMenuItem key={href}><SidebarMenuButton asChild isActive={path === href} tooltip={label}><Link href={href}><Icon/><span>{label}</span></Link></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarGroupContent></SidebarGroup></SidebarContent>
      <SidebarFooter className="border-t border-slate-200"><SidebarMenu><SidebarMenuItem><SidebarMenuButton size="lg" tooltip={name}><div className="grid size-8 shrink-0 place-items-center rounded bg-slate-200 text-xs font-bold text-slate-700">{name.slice(0, 2).toUpperCase()}</div><span className="min-w-0"><strong className="block truncate text-xs">{name}</strong><small className="block truncate text-[10px] capitalize text-slate-500">{role.replaceAll("_", " ")}</small></span></SidebarMenuButton></SidebarMenuItem><SidebarMenuItem><SidebarMenuButton tooltip="Sign out" onClick={async()=>{await authClient.signOut();router.replace("/");router.refresh();}}><LogOut/><span>Sign out</span></SidebarMenuButton></SidebarMenuItem></SidebarMenu></SidebarFooter>
      <SidebarRail/>
    </Sidebar>
    <SidebarInset className="min-h-svh bg-slate-50">
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
        <div className="flex items-center gap-3"><SidebarTrigger className="text-slate-600"/><span className="h-5 w-px bg-slate-200"/><div><p className="text-sm font-semibold text-slate-900">{activeLabel}</p><p className="hidden text-[10px] uppercase tracking-wider text-slate-400 sm:block">{role.replaceAll("_", " ")}</p></div></div>
        <div className="flex items-center gap-3"><button className="relative grid size-8 place-items-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50" aria-label="Notifications"><Bell size={15}/></button><div className="hidden text-right sm:block"><p className="text-xs font-semibold">{name}</p><p className="text-[10px] text-slate-400">Authenticated session</p></div></div>
      </header>
      <div className="mx-auto w-full max-w-7xl p-5 sm:p-7">{children}</div>
    </SidebarInset>
  </SidebarProvider></TooltipProvider>;
}
