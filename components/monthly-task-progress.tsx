"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Check, Calendar, TrendingUp, CheckCircle2, FileText, X } from "lucide-react"
import { GlassCard } from "./glass-card"
import { DAYS_ID, type WeeklyGoal } from "@/lib/store"

interface DailyTaskRecord {
  date: string
  totalTasks: number
  completedTasks: number
  weeklyGoalsCompleted?: number
  weeklyGoalsTotal?: number
  completedGoalsList?: string[]
  failedTasksList?: string[]
  failedGoalsList?: string[]
  hasNotes?: boolean
  dailyNote?: string
}

interface WeeklyRecord {
  weekLabel: string
  notes: string
  startDate: string
  endDate: string
}

interface DailyNote {
  date: string
  day: string
  note: string
}

interface MonthlyTaskProgressProps {
  dailyHistory: DailyTaskRecord[]
  weeklyGoals?: WeeklyGoal[]
  weeklyHistory?: WeeklyRecord[]
  dailyNotes?: DailyNote[]
}

export function MonthlyTaskProgress({ 
  dailyHistory, 
  weeklyGoals = [],
  weeklyHistory = [],
  dailyNotes = []
}: MonthlyTaskProgressProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month")
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const today = new Date()

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" })
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { daysInMonth, startingDayOfWeek, year, month }
  }

  const getWeeksInMonth = (date: Date) => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(date)
    const weeks: number[][] = []
    let currentWeek: number[] = []

    for (let i = 0; i < startingDayOfWeek; i++) {
      currentWeek.push(0)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day)
      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(0)
      }
      weeks.push(currentWeek)
    }

    return weeks
  }

  const getTaskStatusForDay = (day: number): "complete" | "incomplete" | "partial" | "no-data" => {
    if (day === 0) return "no-data"
    
    const { year, month } = getDaysInMonth(currentDate)
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    
    const record = dailyHistory.find((h) => h.date === dateStr)
    
    if (!record) return "no-data"
    
    const hasDailyTasks = record.totalTasks > 0
    const hasWeeklyGoals = (record.weeklyGoalsTotal ?? 0) > 0
    
    if (!hasDailyTasks && !hasWeeklyGoals) return "no-data"
    
    const dailyComplete = hasDailyTasks ? record.completedTasks === record.totalTasks : true
    const weeklyComplete = hasWeeklyGoals ? record.weeklyGoalsCompleted === record.weeklyGoalsTotal : true
    
    if (dailyComplete && weeklyComplete) return "complete"
    if (record.completedTasks > 0 || (record.weeklyGoalsCompleted ?? 0) > 0) return "partial"
    return "incomplete"
  }

  const getTasksForDay = (day: number) => {
    if (day === 0) return null
    
    const { year, month } = getDaysInMonth(currentDate)
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    
    return dailyHistory.find((h) => h.date === dateStr)
  }

  // NEW: Get note for specific date
  const getNoteForDate = (day: number): string => {
    if (day === 0) return ""
    
    const { year, month } = getDaysInMonth(currentDate)
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    
    // Cari di dailyNotes dulu
    const noteFromDailyNotes = dailyNotes.find(n => n.date === dateStr)
    if (noteFromDailyNotes?.note) {
      return noteFromDailyNotes.note
    }
    
    // Fallback ke dailyHistory
    const record = dailyHistory.find((h) => h.date === dateStr)
    return record?.dailyNote || ""
  }

  const getDayName = (day: number) => {
    if (day === 0) return ""
    const { year, month } = getDaysInMonth(currentDate)
    const date = new Date(year, month, day)
    return date.toLocaleDateString("id-ID", { weekday: "long" })
  }

  // NEW: Check if a day is Sunday
  const isSunday = (dayIndex: number): boolean => {
    return dayIndex === 0
  }

  const getWeeklyGoalsForDate = (day: number) => {
    if (day === 0) return []
    const { year, month } = getDaysInMonth(currentDate)
    const date = new Date(year, month, day)
    const dayName = DAYS_ID[date.getDay() === 0 ? 6 : date.getDay() - 1]
    
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    const record = dailyHistory.find((h) => h.date === dateStr)
    
    if (record && record.completedGoalsList && record.completedGoalsList.length > 0) {
      return record.completedGoalsList
    }
    
    return weeklyGoals
      .filter((g) => g.day === dayName && g.done)
      .map((g) => g.text)
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
    setViewMode("month")
    setSelectedWeek(null)
    setSelectedDay(null)
  }

  const goToNextMonth = () => {
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    if (nextMonth <= today) {
      setCurrentDate(nextMonth)
      setViewMode("month")
      setSelectedWeek(null)
      setSelectedDay(null)
    }
  }

  const canGoNext = () => {
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    return nextMonth <= today
  }

  const handleWeekClick = (weekIndex: number) => {
    setSelectedWeek(weekIndex)
    setViewMode("week")
    setSelectedDay(null)
  }

  const handleDayClick = (day: number) => {
    if (day === 0) return
    setSelectedDay(day)
    setViewMode("day")
  }

  const backToMonth = () => {
    setViewMode("month")
    setSelectedWeek(null)
    setSelectedDay(null)
  }

  const backToWeek = () => {
    setViewMode("week")
    setSelectedDay(null)
  }

  const weeks = getWeeksInMonth(currentDate)
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]

  return (
    <GlassCard className="flex h-full w-full flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {viewMode !== "month" ? (
            <button
              onClick={viewMode === "week" ? backToMonth : backToWeek}
              className="flex items-center gap-1.5 text-sm text-cyan hover:text-cyan/80 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Kembali
            </button>
          ) : (
            <>
              <div className="h-1 w-1 rounded-full bg-cyan"></div>
              <h2 className="text-base font-semibold text-foreground">Progress Tugas</h2>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[140px] text-center text-sm font-medium text-foreground">
            {getMonthName(currentDate)}
          </span>
          <button
            onClick={goToNextMonth}
            disabled={!canGoNext()}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
              canGoNext()
                ? "text-muted-foreground hover:bg-secondary hover:text-foreground"
                : "text-muted-foreground/30 cursor-not-allowed"
            }`}
            aria-label="Bulan selanjutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === "month" ? (
          <motion.div
            key="month-view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col gap-3"
          >
            {/* Day Names */}
            <div className="grid grid-cols-7 gap-2">
              {dayNames.map((name, index) => (
                <div
                  key={name}
                  className={`py-2 text-center text-xs font-semibold ${
                    isSunday(index) 
                      ? "text-crimson" 
                      : "text-muted-foreground"
                  }`}
                >
                  {name}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="flex flex-col gap-2">
              {weeks.map((week, weekIndex) => (
                <div
                  key={weekIndex}
                  className="grid grid-cols-7 gap-2"
                >
                  {week.map((day, dayIndex) => {
                    const status = getTaskStatusForDay(day)
                    const hasNote = getNoteForDate(day).trim() !== ""
                    const isDaySunday = isSunday(dayIndex)
                    
                    return (
                      <button
                        key={dayIndex}
                        onClick={() => day > 0 && handleWeekClick(weekIndex)}
                        disabled={day === 0}
                        className={`group relative flex flex-col items-center justify-center rounded-lg p-2.5 transition-all min-h-[60px] ${
                          day === 0
                            ? "bg-transparent cursor-default"
                            : "hover:scale-105"
                        } ${
                          day === 0
                            ? "bg-transparent"
                            : status === "complete"
                              ? "bg-neon/10 border-2 border-neon/40"
                              : status === "partial"
                                ? "bg-cyan/10 border-2 border-cyan/40"
                                : status === "incomplete"
                                  ? "bg-crimson/10 border-2 border-crimson/40"
                                  : status === "no-data" && isDaySunday 
                                    ? "bg-crimson/5 border border-crimson/20 hover:border-crimson/30"
                                    : "bg-secondary/30 border border-border/30 hover:border-border"
                        }`}
                      >
                        {day > 0 && (
                          <>
                            <span className={`text-lg font-bold ${
                              status === "complete" ? "text-neon" :
                              status === "partial" ? "text-cyan" :
                              status === "incomplete" ? "text-crimson" :
                              status === "no-data" && isDaySunday ? "text-crimson" :
                              "text-foreground"
                            }`}>
                              {day}
                            </span>
                            {hasNote && (
                              <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-cyan" />
                            )}
                          </>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-2 flex items-center justify-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded border-2 border-neon/40 bg-neon/10" />
                <span className="text-muted-foreground">Selesai</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded border-2 border-cyan/40 bg-cyan/10" />
                <span className="text-muted-foreground">Sebagian</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded border-2 border-crimson/40 bg-crimson/10" />
                <span className="text-muted-foreground">Gagal</span>
              </div>
            </div>
          </motion.div>
        ) : viewMode === "week" && selectedWeek !== null ? (
          <motion.div
            key="week-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col gap-3"
          >
            {weeks[selectedWeek!] && (
              <div className="flex flex-col gap-2.5">
                {weeks[selectedWeek!].map((day, index) => {
                  if (day === 0) return null
                  const status = getTaskStatusForDay(day)
                  const tasks = getTasksForDay(day)
                  const dayName = getDayName(day)
                  const hasNote = getNoteForDate(day).trim() !== ""
                  const isDaySunday = isSunday(index)

                  return (
                    <button
                      key={index}
                      onClick={() => handleDayClick(day)}
                      className={`flex items-center gap-4 rounded-xl p-4 transition-all hover:scale-[1.01] ${
                        status === "complete"
                          ? "bg-neon/10 border border-neon/30"
                          : status === "partial"
                            ? "bg-cyan/10 border border-cyan/30"
                            : status === "incomplete"
                              ? "bg-crimson/10 border border-crimson/30"
                              : isDaySunday
                                ? "bg-crimson/5 border border-crimson/20"
                                : "bg-secondary/30 border border-border/30"
                      }`}
                    >
                      <div className="flex flex-col items-center min-w-[50px]">
                        <span className={`text-2xl font-bold ${
                          isDaySunday ? "text-crimson" : "text-foreground"
                        }`}>{day}</span>
                        <span className={`text-[10px] uppercase tracking-wide ${
                          isDaySunday ? "text-crimson" : "text-muted-foreground"
                        }`}>{dayName.slice(0, 3)}</span>
                      </div>
                      
                      <div className="flex-1 text-left space-y-1.5">
                        {tasks ? (
                          <>
                            {tasks.totalTasks > 0 && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">Tugas: </span>
                                <span className="font-semibold text-foreground">{tasks.completedTasks}/{tasks.totalTasks}</span>
                              </div>
                            )}
                            {(tasks.weeklyGoalsTotal ?? 0) > 0 && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">Goals: </span>
                                <span className="font-semibold text-foreground">{tasks.weeklyGoalsCompleted}/{tasks.weeklyGoalsTotal}</span>
                              </div>
                            )}
                            {hasNote && (
                              <div className="flex items-center gap-1 text-xs text-cyan">
                                <FileText className="h-3 w-3" />
                                <span>Catatan tersimpan</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">Tidak ada data</span>
                        )}
                      </div>

                      <div className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                        status === "complete" ? "bg-neon/20 text-neon" :
                        status === "partial" ? "bg-cyan/20 text-cyan" :
                        status === "incomplete" ? "bg-crimson/20 text-crimson" :
                        "bg-secondary text-muted-foreground"
                      }`}>
                        {status === "complete" ? "✓ Selesai" : 
                         status === "partial" ? "~ Sebagian" : 
                         status === "incomplete" ? "✕ Gagal" : 
                         "Kosong"}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="day-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col gap-4"
          >
            {selectedDay !== null && (
              <>
                {/* Day Header */}
                <div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-cyan/10 to-transparent p-4 border border-cyan/20">
                  <Calendar className="h-6 w-6 text-cyan" />
                  <div>
                    <div className="text-xl font-bold text-foreground">
                      {selectedDay} {getMonthName(currentDate).split(" ")[0]}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {getDayName(selectedDay)}
                    </div>
                  </div>
                </div>

                {(() => {
                  const tasks = getTasksForDay(selectedDay)
                  const completedGoals = getWeeklyGoalsForDate(selectedDay)
                  const dailyNote = getNoteForDate(selectedDay)
                  
                  if (!tasks && !dailyNote) {
                    return (
                      <div className="rounded-xl bg-secondary/30 p-8 text-center border border-border/30">
                        <p className="text-sm text-muted-foreground">
                          Tidak ada aktivitas di hari ini
                        </p>
                      </div>
                    )
                  }

                  const hasDailyTasks = tasks ? tasks.totalTasks > 0 : false
                  const hasWeeklyGoals = tasks ? (tasks.weeklyGoalsTotal ?? 0) > 0 : false

                  return (
                    <div className="flex flex-col gap-3">
                      {/* Daily Tasks */}
                      {hasDailyTasks && (
                        <div className="rounded-xl bg-secondary/30 border border-border/30 p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-foreground">
                              Tugas Harian
                            </h4>
                            <span className={`text-sm font-bold ${
                              tasks!.completedTasks === tasks!.totalTasks
                                ? "text-neon"
                                : "text-muted-foreground"
                            }`}>
                              {tasks!.completedTasks}/{tasks!.totalTasks}
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-background/50">
                            <div
                              className={`h-full transition-all ${
                                tasks!.completedTasks === tasks!.totalTasks
                                  ? "bg-neon"
                                  : "bg-cyan"
                              }`}
                              style={{
                                width: `${(tasks!.completedTasks / tasks!.totalTasks) * 100}%`,
                              }}
                            />
                          </div>
                          
                          {/* Failed Tasks List */}
                          {tasks!.failedTasksList && tasks!.failedTasksList.length > 0 && (
                            <div className="mt-3 flex flex-col gap-2 border-t border-crimson/20 pt-3">
                              <span className="text-xs font-medium text-crimson">
                                Tugas yang gagal diselesaikan:
                              </span>
                              {tasks!.failedTasksList.map((task, index) => (
                                <div
                                  key={index}
                                  className="flex items-start gap-2 rounded-lg bg-crimson/5 p-2.5 border border-crimson/10"
                                >
                                  <X className="h-3.5 w-3.5 text-crimson mt-0.5 shrink-0" />
                                  <span className="text-sm text-foreground/80">{task}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Weekly Goals */}
                      {hasWeeklyGoals && (
                        <div className="rounded-xl bg-secondary/30 border border-border/30 p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-foreground">
                              Goals Mingguan
                            </h4>
                            <span className={`text-sm font-bold ${
                              tasks!.weeklyGoalsCompleted === tasks!.weeklyGoalsTotal
                                ? "text-neon"
                                : "text-muted-foreground"
                            }`}>
                              {tasks!.weeklyGoalsCompleted}/{tasks!.weeklyGoalsTotal}
                            </span>
                          </div>
                          <div className="mb-3 h-2 overflow-hidden rounded-full bg-background/50">
                            <div
                              className="h-full bg-neon transition-all"
                              style={{
                                width: `${((tasks!.weeklyGoalsCompleted ?? 0) / (tasks!.weeklyGoalsTotal ?? 1)) * 100}%`,
                              }}
                            />
                          </div>
                          
                          {completedGoals.length > 0 && (
                            <div className="mt-3 flex flex-col gap-2 border-t border-border/30 pt-3">
                              <span className="text-xs font-medium text-muted-foreground">
                                Goals yang diselesaikan:
                              </span>
                              {completedGoals.map((goal, index) => (
                                <div
                                  key={index}
                                  className="flex items-start gap-2 text-sm text-foreground/80"
                                >
                                  <Check className="h-4 w-4 text-neon mt-0.5 shrink-0" />
                                  <span>{goal}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Failed Goals List */}
                          {tasks!.failedGoalsList && tasks!.failedGoalsList.length > 0 && (
                            <div className="mt-3 flex flex-col gap-2 border-t border-crimson/20 pt-3">
                              <span className="text-xs font-medium text-crimson">
                                Goals yang gagal diselesaikan:
                              </span>
                              {tasks!.failedGoalsList.map((goal, index) => (
                                <div
                                  key={index}
                                  className="flex items-start gap-2 rounded-lg bg-crimson/5 p-2.5 border border-crimson/10"
                                >
                                  <X className="h-3.5 w-3.5 text-crimson mt-0.5 shrink-0" />
                                  <span className="text-sm text-foreground/80">{goal}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Daily Note - IMPROVED */}
                      {dailyNote && (
                        <div className="rounded-xl bg-cyan/5 border border-cyan/20 p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-cyan" />
                            <h4 className="text-sm font-semibold text-cyan">Catatan</h4>
                          </div>
                          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                            {dailyNote}
                          </p>
                        </div>
                      )}

                      {/* Summary */}
                      {tasks && (
                        <div className={`rounded-xl p-4 text-center border ${
                          tasks.completedTasks === tasks.totalTasks &&
                          ((tasks.weeklyGoalsTotal ?? 0) === 0 || 
                           tasks.weeklyGoalsCompleted === tasks.weeklyGoalsTotal)
                            ? "bg-neon/10 border-neon/30"
                            : "bg-secondary/30 border-border/30"
                        }`}>
                          <p className={`text-sm font-medium ${
                            tasks.completedTasks === tasks.totalTasks &&
                            ((tasks.weeklyGoalsTotal ?? 0) === 0 || 
                             tasks.weeklyGoalsCompleted === tasks.weeklyGoalsTotal)
                              ? "text-neon"
                              : "text-muted-foreground"
                          }`}>
                            {tasks.completedTasks === tasks.totalTasks &&
                            ((tasks.weeklyGoalsTotal ?? 0) === 0 || 
                             tasks.weeklyGoalsCompleted === tasks.weeklyGoalsTotal)
                              ? "🎉 Semua tugas selesai!"
                              : "Masih ada tugas yang belum selesai"}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  )
}