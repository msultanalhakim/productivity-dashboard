"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { GlassCard } from "./glass-card"
import { EmptyState } from "./empty-state"
import type { Expense } from "@/lib/store"

interface ExpenseChartProps {
  expenses: Expense[]
}

function groupByWeek(expenses: Expense[]): { name: string; masuk: number; keluar: number }[] {
  const weeks: Record<string, { masuk: number; keluar: number; weekNum: number }> = {}
  
  for (const e of expenses) {
    const d = new Date(e.date)
    const weekNum = Math.ceil(d.getDate() / 7)
    const key = `Minggu ${weekNum}`
    
    if (!weeks[key]) {
      weeks[key] = { masuk: 0, keluar: 0, weekNum }
    }
    
    if (e.type === "in") weeks[key].masuk += e.amount
    else weeks[key].keluar += e.amount
  }
  
  // ⭐ FIX: Sort by week number to ensure correct order (earliest week on left)
  return Object.entries(weeks)
    .map(([name, data]) => ({ 
      name, 
      masuk: data.masuk, 
      keluar: data.keluar,
      weekNum: data.weekNum 
    }))
    .sort((a, b) => a.weekNum - b.weekNum)
}

export function ExpenseChart({ expenses }: ExpenseChartProps) {
  const data = groupByWeek(expenses)

  if (data.length === 0) {
    return (
      <GlassCard className="flex h-full w-full flex-col gap-3">
        <span className="text-sm font-medium text-muted-foreground">Tren Cashflow</span>
        <EmptyState variant="chart" />
      </GlassCard>
    )
  }

  return (
    <GlassCard className="flex h-full w-full flex-col gap-3">
      <span className="text-sm font-medium text-muted-foreground">
        Tren Cashflow
      </span>
      <div className="h-48 w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gradCyan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(187, 100%, 50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(187, 100%, 50%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradCrimson" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(0, 85%, 55%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(0, 85%, 55%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                color: "hsl(var(--foreground))",
                fontSize: "12px",
              }}
              formatter={(value: number) => [`Rp ${value.toLocaleString("id-ID")}`, ""]}
            />
            <Area
              type="monotone"
              dataKey="masuk"
              stroke="hsl(187, 100%, 50%)"
              fill="url(#gradCyan)"
              strokeWidth={2}
              name="Masuk"
            />
            <Area
              type="monotone"
              dataKey="keluar"
              stroke="hsl(0, 85%, 55%)"
              fill="url(#gradCrimson)"
              strokeWidth={2}
              name="Keluar"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-4 md:gap-6 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-cyan" /> Masuk
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-crimson" /> Keluar
        </span>
      </div>
    </GlassCard>
  )
}