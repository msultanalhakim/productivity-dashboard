"use client"

import { useState, useRef, useEffect } from "react"
import {
  Plus,
  X,
  Wallet,
  ListChecks,
  Target,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface FabQuickActionProps {
  onQuickExpense: () => void
  onQuickTask: () => void
  onQuickGoal: () => void
}

const ACTIONS = [
  { key: "expense", label: "Transaksi", icon: Wallet, color: "text-cyan" },
  { key: "task", label: "Tugas", icon: ListChecks, color: "text-neon" },
  { key: "goal", label: "Goal", icon: Target, color: "text-crimson" },
] as const

export function FabQuickAction({
  onQuickExpense,
  onQuickTask,
  onQuickGoal,
}: FabQuickActionProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleAction = (key: string) => {
    setOpen(false)
    if (key === "expense") onQuickExpense()
    else if (key === "task") onQuickTask()
    else if (key === "goal") onQuickGoal()
  }

  return (
    <div ref={ref} className="fixed bottom-20 right-4 z-50 md:bottom-6 md:right-6">
      {/* Action buttons */}
      <div
        className={cn(
          "mb-3 flex flex-col-reverse gap-2 transition-all duration-300",
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        )}
      >
        {ACTIONS.map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.key}
              onClick={() => handleAction(action.key)}
              className="flex items-center gap-2 self-end rounded-xl border border-border bg-[hsl(220_18%_10%/0.95)] px-4 py-2.5 shadow-lg backdrop-blur-md transition-all duration-200 hover:bg-secondary"
            >
              <Icon className={cn("h-4 w-4", action.color)} />
              <span className="text-sm font-medium text-foreground">
                {action.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Main FAB */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "ml-auto flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-all duration-300",
          open
            ? "rotate-45 bg-secondary text-foreground"
            : "bg-cyan text-[hsl(220_20%_6%)] glow-cyan"
        )}
        aria-label={open ? "Tutup menu cepat" : "Buka menu cepat"}
      >
        {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </button>
    </div>
  )
}