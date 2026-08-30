"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

const chartConfig = {
    count: { label: "Roles", color: "var(--chart-3)" },
} satisfies ChartConfig;

export function MatchFitChart({ scores }: { scores: number[] }) {
    if (scores.length === 0) return null;

    const data = [
        { label: "Stretch", count: scores.filter((s) => s < 45).length },
        { label: "Possible", count: scores.filter((s) => s >= 45 && s < 65).length },
        { label: "Strong", count: scores.filter((s) => s >= 65 && s < 80).length },
        { label: "Tight", count: scores.filter((s) => s >= 80).length },
    ];
    const avg = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);

    return (
        <Card>
            <CardHeader>
                <CardDescription>This page · your matching resume</CardDescription>
                <CardTitle>Fit distribution</CardTitle>
                <CardAction>
                    <div className="text-right">
                        <div className="font-mono text-2xl font-medium tabular-nums leading-none">{avg}</div>
                        <div className="text-[10px] tracking-wide text-muted-foreground uppercase">avg match</div>
                    </div>
                </CardAction>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="aspect-[16/7] w-full">
                    <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} />
                        <YAxis hide allowDecimals={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
