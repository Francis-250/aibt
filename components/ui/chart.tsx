"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"
import { cn } from "@/lib/utils"

export type ChartConfig = Record<string, { label?: React.ReactNode; color?: string }>

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) throw new Error("useChart must be used within ChartContainer")
  return context
}

function ChartContainer({ config, className, children, ...props }: React.ComponentProps<"div"> & { config: ChartConfig; children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"] }) {
  return <ChartContext.Provider value={{ config }}><div data-slot="chart" className={cn("flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-slate-500 [&_.recharts-cartesian-grid_line]:stroke-slate-200 [&_.recharts-tooltip-cursor]:fill-slate-100", className)} {...props}><RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer></div></ChartContext.Provider>
}

const ChartTooltip = RechartsPrimitive.Tooltip

function ChartTooltipContent({ active, payload, label, className }: { active?: boolean; payload?: ReadonlyArray<{ name?: string; value?: string | number; color?: string; dataKey?: string | number }>; label?: React.ReactNode; className?: string }) {
  const { config } = useChart()
  if (!active || !payload?.length) return null
  return <div className={cn("min-w-32 rounded border border-slate-200 bg-white px-3 py-2 text-xs shadow", className)}><p className="mb-1 font-medium">{label}</p>{payload.map((item,index)=>{const key=String(item.dataKey ?? item.name ?? "value");return <div key={`${key}-${index}`} className="flex items-center justify-between gap-4 py-0.5"><span className="flex items-center gap-1.5 text-slate-500"><span className="size-2 rounded" style={{ backgroundColor: item.color }}/>{config[key]?.label ?? item.name}</span><span className="font-mono font-medium">{item.value}</span></div>})}</div>
}

export { ChartContainer, ChartTooltip, ChartTooltipContent }
