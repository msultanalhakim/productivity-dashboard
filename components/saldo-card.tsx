"use client"

import { TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight } from "lucide-react"
import { GlassCard } from "./glass-card"
import { formatRupiah } from "@/lib/store"

interface SaldoCardProps {
  saldo: number
  lastMonthSaldo: number
  incomeThisMonth: number
  expenseThisMonth: number
}

export function SaldoCard({ saldo, lastMonthSaldo, incomeThisMonth, expenseThisMonth }: SaldoCardProps) {
  const diff = saldo - lastMonthSaldo
  const isUp = diff >= 0
  const percent =
    lastMonthSaldo > 0 ? Math.abs((diff / lastMonthSaldo) * 100).toFixed(1) : "0"

  return (
    <GlassCard glowColor="cyan" className="flex h-full w-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Saldo Saat Ini
        </span>
        <div
          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
            isUp
              ? "bg-[hsl(145_100%_50%/0.12)] text-neon"
              : "bg-[hsl(0_85%_55%/0.12)] text-crimson"
          }`}
        >
          {isUp ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {percent}%
        </div>
      </div>
      <p className="text-4xl font-bold tracking-tight text-foreground">
        <span className="text-base md:text-lg text-muted-foreground">Rp</span>{" "}
        {formatRupiah(saldo)}
      </p>
      <p className="text-xs text-muted-foreground">
        {isUp ? "+" : "-"}Rp {formatRupiah(Math.abs(diff))} dari bulan lalu
      </p>

      {/* Income and Expense this month */}
      <div className="mt-1 grid grid-cols-2 gap-2 border-t border-border pt-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[hsl(145_100%_50%/0.1)]">
            <ArrowDownLeft className="h-3.5 w-3.5 text-neon" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Pemasukan</p>
            <p className="text-xs font-bold text-neon">
              +Rp {formatRupiah(incomeThisMonth)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[hsl(0_85%_55%/0.1)]">
            <ArrowUpRight className="h-3.5 w-3.5 text-crimson" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Pengeluaran</p>
            <p className="text-xs font-bold text-crimson">
              -Rp {formatRupiah(expenseThisMonth)}
            </p>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}