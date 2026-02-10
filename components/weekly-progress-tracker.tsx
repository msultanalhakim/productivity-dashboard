"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronUp, Calendar, TrendingUp, CheckCircle2, FileText } from "lucide-react"
import { GlassCard } from "./glass-card"
import { cn } from "@/lib/utils"
import type { WeeklyProgressEntry } from "@/lib/store"

interface WeeklyProgressTrackerProps {
  progress: WeeklyProgressEntry[]
  weeklyNotes: Array<{ weekStart: string; notes: string; weekLabel: string }>
}

export function WeeklyProgressTracker({ progress, weeklyNotes }: WeeklyProgressTrackerProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getCurrentWeekProgress = () => {
    const today = new Date()
    const currentWeekStart = getWeekStart(today)
    return progress.filter((p) => {
      const progressDate = new Date(p.date)
      const progressWeekStart = getWeekStart(progressDate)
      return progressWeekStart === currentWeekStart
    })
  }

  const getPreviousWeeksProgress = () => {
    const today = new Date()
    const currentWeekStart = getWeekStart(today)
    
    const weeklyGroups: Record<string, WeeklyProgressEntry[]> = {}
    
    progress.forEach((p) => {
      const progressDate = new Date(p.date)
      const progressWeekStart = getWeekStart(progressDate)
      
      if (progressWeekStart !== currentWeekStart) {
        if (!weeklyGroups[progressWeekStart]) {
          weeklyGroups[progressWeekStart] = []
        }
        weeklyGroups[progressWeekStart].push(p)
      }
    })

    return Object.entries(weeklyGroups)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .slice(0, 4)
  }

  const currentWeek = getCurrentWeekProgress()
  const previousWeeks = getPreviousWeeksProgress()

  const calculateWeekStats = (entries: WeeklyProgressEntry[]) => {
    const totalGoals = entries.reduce((sum, e) => sum + e.goalsTotal, 0)
    const completedGoals = entries.reduce((sum, e) => sum + e.goalsCompleted, 0)
    const percentage = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0
    return { totalGoals, completedGoals, percentage }
  }

  const currentWeekStats = calculateWeekStats(currentWeek)

  const getCurrentWeekNotes = () => {
    const today = new Date()
    const currentWeekStart = getWeekStart(today)
    return weeklyNotes.find(n => n.weekStart === currentWeekStart)
  }

  const currentNotes = getCurrentWeekNotes()

  return (
    <GlassCard className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-neon" />
          <h2 className="text-base font-bold text-foreground">Progress Mingguan</h2>
        </div>
        {currentWeekStats.totalGoals > 0 && (
          <span className="rounded-full bg-neon/10 px-2.5 py-0.5 text-xs font-semibold text-neon">
            {currentWeekStats.percentage}%
          </span>
        )}
      </div>

      {/* Current Week */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Minggu Ini
        </span>
        {currentWeek.length === 0 ? (
          <p className="py-3 text-center text-xs text-muted-foreground">
            Belum ada progress minggu ini
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {currentWeek.map((entry) => (
              <div
                key={entry.date}
                className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">{entry.day}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(entry.date).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {entry.goalsCompleted === entry.goalsTotal && entry.goalsTotal > 0 ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-neon" />
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground" />
                    )}
                    <span className="text-xs font-semibold text-foreground">
                      {entry.goalsCompleted}/{entry.goalsTotal}
                    </span>
                  </div>
                  <div className="h-1.5 w-16 rounded-full bg-background/50">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        entry.goalsCompleted === entry.goalsTotal && entry.goalsTotal > 0
                          ? "bg-neon"
                          : entry.goalsCompleted / entry.goalsTotal >= 0.5
                          ? "bg-cyan"
                          : "bg-crimson"
                      )}
                      style={{
                        width: `${entry.goalsTotal > 0 ? (entry.goalsCompleted / entry.goalsTotal) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
            
            {/* Week Summary */}
            <div className="mt-1 rounded-xl border border-neon/20 bg-neon/5 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neon">Total</span>
                <span className="text-sm font-bold text-neon">
                  {currentWeekStats.completedGoals}/{currentWeekStats.totalGoals}
                </span>
              </div>
            </div>

            {/* Current Week Notes - Simplified */}
            {currentNotes && currentNotes.notes && (
              <div className="mt-2 rounded-lg bg-cyan/5 border border-cyan/20 px-3 py-2">
                <div className="flex items-start gap-2">
                  <FileText className="h-3.5 w-3.5 text-cyan shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">
                    {currentNotes.notes}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Previous Weeks */}
      {previousWeeks.length > 0 && (
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between rounded-lg bg-secondary/30 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/50"
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-cyan" />
              Minggu Sebelumnya
            </div>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-2 overflow-hidden"
              >
                {previousWeeks.map(([weekStart, entries]) => {
                  const stats = calculateWeekStats(entries)
                  const weekDate = new Date(weekStart)
                  const weekLabel = getWeekLabel(weekDate)
                  const weekNotes = weeklyNotes.find(n => n.weekStart === weekStart)

                  return (
                    <div
                      key={weekStart}
                      className="rounded-lg bg-secondary/20 px-3 py-2.5"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          {weekLabel}
                        </span>
                        <span className="text-xs font-semibold text-foreground">
                          {stats.completedGoals}/{stats.totalGoals}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-background/50">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            stats.percentage === 100
                              ? "bg-neon"
                              : stats.percentage >= 50
                              ? "bg-cyan"
                              : "bg-crimson"
                          )}
                          style={{ width: `${stats.percentage}%` }}
                        />
                      </div>
                      
                      {/* Previous Week Notes - Simplified */}
                      {weekNotes && weekNotes.notes && (
                        <div className="mt-2 rounded-lg bg-cyan/5 border border-cyan/10 px-2.5 py-2">
                          <p className="text-[10px] text-foreground/70 leading-relaxed whitespace-pre-wrap">
                            {weekNotes.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </GlassCard>
  )
}

function getWeekStart(date: Date): string {
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(date)
  monday.setDate(date.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().split("T")[0]
}

function getWeekLabel(date: Date): string {
  const weekNum = Math.ceil(date.getDate() / 7)
  const monthName = date.toLocaleDateString("id-ID", { month: "short" })
  return `Minggu ke-${weekNum}, ${monthName} ${date.getFullYear()}`
}