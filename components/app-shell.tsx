"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, Bell, BrainCircuit, ClipboardList, Database, FileText, LayoutDashboard, LogOut, Settings, ShieldCheck, Users } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

const links = {
  admin: [["Overview", "/admin", LayoutDashboard], ["Users", "/admin/users", Users], ["Cases", "/admin/cases", ClipboardList], ["Models", "/admin/models", BrainCircuit], ["Reports", "/admin/reports", FileText], ["Audit", "/admin/audit", ShieldCheck], ["Settings", "/admin/settings", Settings]],
  health_officer: [["Overview", "/health-officer", LayoutDashboard], ["Cases", "/health-officer/cases", ClipboardList], ["Environment", "/health-officer/environment", Database], ["Predictions", "/health-officer/predictions", BrainCircuit], ["Alerts", "/health-officer/alerts", Bell], ["Reports", "/health-officer/reports", FileText]],
  government_official: [["Overview", "/government-official", LayoutDashboard], ["Predictions", "/government-official/predictions", BrainCircuit], ["Alerts", "/government-official/alerts", Bell], ["Reports", "/government-official/reports", FileText]],
} as const;

export function AppShell({ role, name, children }: { role: keyof typeof links; name: string; children: React.ReactNode }) {
  const path = usePathname(); const router = useRouter();
  const current = links[role].find(([,href]) => path === href)?.[0] ?? "Dashboard";
  return <TooltipProvider><SidebarProvider><Sidebar collapsible="icon">
    <SidebarHeader className="h-14 justify-center border-b border-slate-200 px-2"><SidebarMenu><SidebarMenuItem><SidebarMenuButton asChild tooltip="TyphoidWatch"><Link href={links[role][0][1]}><Activity className="text-blue-700"/><span className="font-semibold">TyphoidWatch</span></Link></SidebarMenuButton></SidebarMenuItem></SidebarMenu></SidebarHeader>
    <SidebarContent><SidebarGroup><SidebarGroupContent><SidebarMenu>{links[role].map(([label,href,Icon])=><SidebarMenuItem key={href}><SidebarMenuButton asChild isActive={path === href} tooltip={label}><Link href={href}><Icon/><span>{label}</span></Link></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarGroupContent></SidebarGroup></SidebarContent>
    <SidebarFooter className="border-t border-slate-200"><SidebarMenu><SidebarMenuItem><SidebarMenuButton tooltip={name}><span className="grid size-5 place-items-center rounded bg-slate-200 text-[9px] font-semibold">{name.slice(0,2).toUpperCase()}</span><span className="truncate">{name}</span></SidebarMenuButton></SidebarMenuItem><SidebarMenuItem><SidebarMenuButton tooltip="Sign out" onClick={async()=>{await authClient.signOut();router.replace("/");router.refresh();}}><LogOut/><span>Sign out</span></SidebarMenuButton></SidebarMenuItem></SidebarMenu></SidebarFooter><SidebarRail/>
  </Sidebar><SidebarInset className="bg-slate-50"><header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4"><div className="flex items-center gap-3"><SidebarTrigger/><span className="text-sm font-medium">{current}</span></div><div className="flex items-center gap-3"><button aria-label="Notifications" className="text-slate-500"><Bell size={16}/></button><span className="hidden text-xs text-slate-500 sm:block">{name}</span></div></header><div className="mx-auto w-full max-w-7xl p-5 sm:p-6">{children}</div></SidebarInset>
  </SidebarProvider></TooltipProvider>;
}
