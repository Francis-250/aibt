"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const chartConfig = { probability: { label: "Outbreak probability", color: "#2563eb" }, confidence: { label: "Confidence", color: "#64748b" } } satisfies ChartConfig;

export function PredictionChart({ data }: { data: Array<{ location: string; probability: number; confidence: number }> }) {
  return <ChartContainer config={chartConfig} className="h-64 w-full"><BarChart accessibilityLayer data={data} margin={{ left: 0, right: 8, top: 8 }}><CartesianGrid vertical={false}/><XAxis dataKey="location" tickLine={false} axisLine={false} tickMargin={8}/><YAxis domain={[0,100]} tickLine={false} axisLine={false} tickFormatter={value=>`${value}%`}/><ChartTooltip cursor={false} content={<ChartTooltipContent/>}/><Bar dataKey="probability" fill={chartConfig.probability.color} radius={0}/><Bar dataKey="confidence" fill={chartConfig.confidence.color} radius={0}/></BarChart></ChartContainer>;
}
