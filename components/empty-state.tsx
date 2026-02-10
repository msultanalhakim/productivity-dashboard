"use client"

import React from "react"

import { motion } from "framer-motion"
import { Wallet, ListChecks, Target, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

type EmptyVariant = "transaksi" | "tugas" | "goals" | "chart"

const CONFIG: Record<EmptyVariant, {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  accentColor: string
  bgColor: string
}> = {
  transaksi: {
    icon: Wallet,
    title: "Belum ada transaksi",
    description: "Mulai catat pemasukan dan pengeluaran Anda untuk melihat ringkasan keuangan di sini.",
    accentColor: "text-cyan",
    bgColor: "bg-[hsl(187_100%_50%/0.08)]",
  },
  tugas: {
    icon: ListChecks,
    title: "Belum ada tugas",
    description: "Tambahkan tugas harian pertama Anda dan mulai tingkatkan produktivitas.",
    accentColor: "text-cyan",
    bgColor: "bg-[hsl(187_100%_50%/0.08)]",
  },
  goals: {
    icon: Target,
    title: "Belum ada goals",
    description: "Tetapkan tujuan jangka panjang Anda dan pantau pencapaiannya di sini.",
    accentColor: "text-neon",
    bgColor: "bg-[hsl(145_100%_50%/0.08)]",
  },
  chart: {
    icon: BarChart3,
    title: "Belum ada data",
    description: "Tambahkan transaksi untuk melihat grafik cashflow Anda.",
    accentColor: "text-cyan",
    bgColor: "bg-[hsl(187_100%_50%/0.08)]",
  },
}

interface EmptyStateProps {
  variant: EmptyVariant
  className?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ variant, className, action }: EmptyStateProps) {
  const { icon: Icon, title, description, accentColor, bgColor } = CONFIG[variant]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={cn("flex flex-col items-center justify-center gap-4 py-10", className)}
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className={cn("flex h-16 w-16 items-center justify-center rounded-2xl", bgColor)}
      >
        <Icon className={cn("h-8 w-8", accentColor)} />
      </motion.div>
      <div className="flex flex-col items-center gap-1.5 text-center">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <p className="max-w-[240px] text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className={cn(
            "rounded-xl px-4 py-2 text-xs font-semibold transition-colors",
            "bg-[hsl(187_100%_50%/0.12)] text-cyan hover:bg-[hsl(187_100%_50%/0.2)]"
          )}
        >
          {action.label}
        </button>
      )}
    </motion.div>
  )
}