"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Calendar, Target, CheckCircle2, XCircle, TrendingUp, Trash2, X, Sparkles } from "lucide-react"
import { GlassCard } from "./glass-card"
import { cn } from "@/lib/utils"
import { generateId, daysUntil, type LongTermGoal } from "@/lib/store"

interface LongTermGoalsProps {
  goals: LongTermGoal[]
  onAdd: (goal: LongTermGoal) => void
  onDelete: (id: string) => void
  onComplete: (id: string) => void
}

type GoalFilter = "active" | "completed" | "failed"

export function LongTermGoals({ goals, onAdd, onDelete, onComplete }: LongTermGoalsProps) {
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<GoalFilter>("active")
  
  const [formData, setFormData] = useState({
    title: "",
    deadline: "",
    notes: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.deadline) return

    const newGoal: LongTermGoal = {
      id: generateId(),
      title: formData.title.trim(),
      deadline: formData.deadline,
      notes: formData.notes.trim(),
      status: "active",
      createdAt: new Date().toISOString(),
    }

    onAdd(newGoal)
    setFormData({ title: "", deadline: "", notes: "" })
    setShowForm(false)
  }

  // Filter dan sort goals
  const activeGoals = goals
    .filter((g) => g.status === "active")
    .sort((a, b) => daysUntil(a.deadline) - daysUntil(b.deadline)) // Sort ascending (dari kecil ke besar)
  const completedGoals = goals.filter((g) => g.status === "completed")
  const failedGoals = goals.filter((g) => g.status === "failed")

  const currentGoals = filter === "active" ? activeGoals : filter === "completed" ? completedGoals : failedGoals

  const renderGoalCard = (goal: LongTermGoal) => {
    const days = daysUntil(goal.deadline)
    const isOverdue = days < 0
    
    // Hitung total durasi goal (dari created sampai deadline)
    const totalDuration = Math.ceil(
      (new Date(goal.deadline).getTime() - new Date(goal.createdAt).getTime()) / 
      (1000 * 60 * 60 * 24)
    )
    
    // Hitung progress percentage
    const elapsed = totalDuration - days
    const progressPercent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100))

    // Fungsi untuk menentukan warna badge berdasarkan sisa hari
    const getBadgeColor = () => {
      if (isOverdue) return "bg-crimson text-background"
      if (days <= 10) return "bg-red-500 text-background"
      if (days <= 20) return "bg-yellow-500 text-background"
      if (days <= 30) return "bg-orange-500 text-background"
      if (days <= 60) return "bg-cyan text-background"
      return "bg-neon text-background"
    }

    // Fungsi untuk mendapatkan label badge yang lebih deskriptif
    const getBadgeLabel = () => {
      if (isOverdue) return `${Math.abs(days)}H Terlambat`
      if (days === 0) return "Hari ini"
      if (days === 1) return "1 Hari"
      return `${days} Hari`
    }

    return (
      <div
        key={goal.id}
        className="group relative flex flex-col gap-3 rounded-xl border border-border/50 bg-card/30 p-4 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <h4 className="text-base font-semibold text-foreground break-words leading-tight flex-1">
            {goal.title}
          </h4>
          
          {goal.status === "active" && (
            <div className={cn(
              "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold whitespace-nowrap shadow-sm",
              getBadgeColor()
            )}>
              {getBadgeLabel()}
            </div>
          )}
          
          {goal.status === "completed" && (
            <div className="flex items-center gap-1 rounded-md bg-neon px-2.5 py-1 text-xs font-bold text-background shadow-sm">
              <CheckCircle2 className="h-3 w-3" />
              SELESAI
            </div>
          )}
          
          {goal.status === "failed" && (
            <div className="flex items-center gap-1 rounded-md bg-crimson px-2.5 py-1 text-xs font-bold text-background shadow-sm">
              <XCircle className="h-3 w-3" />
              GAGAL
            </div>
          )}
        </div>

        {/* Notes */}
        {goal.notes && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {goal.notes}
          </p>
        )}

        {/* Progress Bar untuk Active Goals */}
        {goal.status === "active" && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Progress waktu</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="relative h-1.5 overflow-hidden rounded-full bg-secondary">
              <div
                className={cn(
                  "h-full transition-all duration-500",
                  isOverdue ? "bg-crimson" :
                  days <= 10 ? "bg-red-500" :
                  days <= 20 ? "bg-yellow-500" :
                  days <= 30 ? "bg-orange-500" :
                  days <= 60 ? "bg-cyan" :
                  "bg-neon"
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/30">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(goal.deadline).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric"
              })}
            </div>
            {goal.status === "active" && (
              <span className="text-[10px] text-muted-foreground/70">
                Dibuat {new Date(goal.createdAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short"
                })} • {totalDuration} hari total
              </span>
            )}
            {goal.status === "completed" && goal.completedAt && (
              <span className="text-[10px] text-neon/70">
                Selesai {new Date(goal.completedAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short"
                })}
              </span>
            )}
          </div>

          <div className="flex gap-1.5">
            {goal.status === "active" && (
              <button
                onClick={() => onComplete(goal.id)}
                className="flex items-center gap-1 rounded-md bg-neon/10 px-2 py-1 text-xs font-semibold text-neon transition-all hover:bg-neon/20"
              >
                <CheckCircle2 className="h-3 w-3" />
                Selesai
              </button>
            )}
            <button
              onClick={() => onDelete(goal.id)}
              className="flex items-center gap-1 rounded-md bg-crimson/10 px-2 py-1 text-xs font-semibold text-crimson transition-all hover:bg-crimson/20"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Stats - 2 kolom (lg:col-span-2) */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <GlassCard className="flex flex-col gap-2 p-4">
            <div className="flex items-center justify-between">
              <Target className="h-5 w-5 text-cyan" />
              <span className="text-2xl font-bold text-cyan">{activeGoals.length}</span>
            </div>
            <span className="text-xs text-muted-foreground">Aktif</span>
          </GlassCard>

          <GlassCard className="flex flex-col gap-2 p-4">
            <div className="flex items-center justify-between">
              <CheckCircle2 className="h-5 w-5 text-neon" />
              <span className="text-2xl font-bold text-neon">{completedGoals.length}</span>
            </div>
            <span className="text-xs text-muted-foreground">Tercapai</span>
          </GlassCard>

          <GlassCard className="flex flex-col gap-2 p-4">
            <div className="flex items-center justify-between">
              <XCircle className="h-5 w-5 text-crimson" />
              <span className="text-2xl font-bold text-crimson">{failedGoals.length}</span>
            </div>
            <span className="text-xs text-muted-foreground">Gagal</span>
          </GlassCard>

          <GlassCard className="flex flex-col gap-2 p-4">
            <div className="flex items-center justify-between">
              <TrendingUp className="h-5 w-5 text-neon" />
              <span className="text-2xl font-bold text-foreground">
                {goals.length > 0 ? Math.round((completedGoals.length / goals.length) * 100) : 0}%
              </span>
            </div>
            <span className="text-xs text-muted-foreground">Keberhasilan</span>
          </GlassCard>
        </div>

        {/* Add Goal Button - 1 kolom (lg:col-span-1) */}
        <GlassCard className="flex items-center justify-center p-4">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-neon/15 px-4 py-2.5 text-sm font-semibold text-neon transition-all hover:bg-neon/25 hover:scale-105"
          >
            <Plus className="h-4 w-4" />
            Tambah Goal
          </button>
        </GlassCard>

        {/* Goals List - Full width */}
        <div className="lg:col-span-3">
          <GlassCard className="flex flex-col gap-4 p-4">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-border/30 pb-3">
              <button
                onClick={() => setFilter("active")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                  filter === "active"
                    ? "bg-cyan/20 text-cyan"
                    : "text-muted-foreground hover:bg-secondary/50"
                )}
              >
                <Target className="h-3.5 w-3.5" />
                Aktif
              </button>
              <button
                onClick={() => setFilter("completed")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                  filter === "completed"
                    ? "bg-neon/20 text-neon"
                    : "text-muted-foreground hover:bg-secondary/50"
                )}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Tercapai
              </button>
              <button
                onClick={() => setFilter("failed")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                  filter === "failed"
                    ? "bg-crimson/20 text-crimson"
                    : "text-muted-foreground hover:bg-secondary/50"
                )}
              >
                <XCircle className="h-3.5 w-3.5" />
                Gagal
              </button>
            </div>

            {/* Goals Grid */}
            {currentGoals.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8">
                {filter === "active" && <Target className="h-10 w-10 text-muted-foreground/50" />}
                {filter === "completed" && <CheckCircle2 className="h-10 w-10 text-muted-foreground/50" />}
                {filter === "failed" && <XCircle className="h-10 w-10 text-muted-foreground/50" />}
                <p className="text-sm text-muted-foreground">
                  Belum ada goals {filter === "active" ? "aktif" : filter === "completed" ? "tercapai" : "gagal"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {currentGoals.map((goal) => renderGoalCard(goal))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {/* Beautiful Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md overflow-hidden rounded-xl border border-border bg-card shadow-xl"
            >
              {/* Header */}
              <div className="border-b border-border px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                      <Sparkles className="h-4 w-4 text-foreground" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground">Tambah Goal Baru</h3>
                      <p className="text-xs text-muted-foreground">Buat target jangka panjang Anda</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4 p-6">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Judul Goal</label>
                  <input
                    type="text"
                    placeholder="Contoh: Belajar React hingga mahir"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors focus:border-foreground focus:outline-none"
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Target Deadline</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                      className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-3 text-sm text-foreground transition-colors focus:border-foreground focus:outline-none [color-scheme:dark]"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Catatan (Opsional)</label>
                  <textarea
                    placeholder="Tambahkan detail atau milestone yang ingin dicapai..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors focus:border-foreground focus:outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 rounded-lg border border-border bg-secondary/50 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-neon py-2.5 text-sm font-medium text-background transition-all hover:bg-neon/90"
                  >
                    Simpan Goal
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}