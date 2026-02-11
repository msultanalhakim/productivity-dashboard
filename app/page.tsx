"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Settings, Calendar, AlertTriangle, LayoutDashboard, Wallet, ListTodo, Target, ArrowUp, MoreVertical } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { MusicPlayer } from "@/components/music-player"
import { SaldoCard } from "@/components/saldo-card"
import { MoodTracker } from "@/components/mood-tracker"
import { DailyProgress } from "@/components/progress-ring"
import { ExpenseChart } from "@/components/expense-chart"
import { ExpenseTracker } from "@/components/expense-tracker"
import { DailyTasks } from "@/components/daily-tasks"
import { WeeklyGoals } from "@/components/weekly-goals"
import { LongTermGoals } from "@/components/long-term-goals"
import { MonthlyTaskProgress } from "@/components/monthly-task-progress"
import { GlassCard } from "@/components/glass-card"
import { LockScreen } from "@/components/lock-screen"
import { SettingsModal } from "@/components/settings-modal"
import { ToastProvider, useToast } from "@/components/toast-notification"
import {
  loadState,
  saveState,
  isAuthenticated,
  setAuthenticated,
  performDailyReset,
  performWeeklyReset,
  needsDailyReset,
  needsWeeklyReset,
  saveDailyNoteForToday,
} from "@/lib/storage"
import {
  generateId,
  isOverdue,
  getTodayString,
  getCurrentDayName,
  getWeekLabel,
  daysUntil,
  type NavSection,
  type Mood,
  type Expense,
  type DailyTask,
  type WeeklyGoal,
  type LongTermGoal,
  type UnplannedTask,
  type WeeklyProgressEntry,
  type DailyNote,
} from "@/lib/store"
import { cn } from "@/lib/utils"

interface WeeklyRecord {
  weekLabel: string
  notes: string
  startDate: string
  endDate: string
}

function CommandCenterInner() {
  const [isLocked, setIsLocked] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [showQuickMenu, setShowQuickMenu] = useState(false)
  const [activeNav, setActiveNav] = useState<NavSection>("dashboard")
  const [mood, setMood] = useState<Mood | null>(null)
  const [lastMoodDate, setLastMoodDate] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showScrollTop, setShowScrollTop] = useState(false)

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([])

  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>([])

  const [longTermGoals, setLongTermGoals] = useState<LongTermGoal[]>([])

  const [dailyHistory, setDailyHistory] = useState<any[]>([])
  const [weeklyHistory, setWeeklyHistory] = useState<WeeklyRecord[]>([])
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgressEntry[]>([])
  const [dailyNotes, setDailyNotes] = useState<DailyNote[]>([])

  const expenseRef = useRef<HTMLDivElement>(null)
  const taskRef = useRef<HTMLDivElement>(null)
  const goalRef = useRef<HTMLDivElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { toast } = useToast()

  // Scroll to top detection
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Initial load from Supabase
  useEffect(() => {
    async function initializeApp() {
      // Check if authenticated
      if (!isAuthenticated()) {
        setIsLocked(true)
        setIsLoading(false)
        return
      }
  
      try {
        // Load state from Supabase
        const state = await loadState()
        
        setMood(state.mood)
        setLastMoodDate(state.lastMoodDate)
        setExpenses(state.expenses)
        setDailyTasks(state.dailyTasks)
        setWeeklyGoals(state.weeklyGoals)
        setLongTermGoals(state.longTermGoals)
        setDailyHistory(state.dailyHistory)
        setWeeklyHistory(state.weeklyHistory.map(entry => ({
          weekLabel: entry.weekLabel,
          notes: (entry as any).notes || "",
          startDate: (entry as any).startDate || entry.weekStart,
          endDate: entry.endDate,
        })))
        setWeeklyProgress(state.weeklyProgress)
        setDailyNotes(state.dailyNotes || [])
        setCurrentMonth(new Date(state.currentMonth))
  
        // Check for daily reset
        if (await needsDailyReset()) {
          await performDailyReset()
          const updatedState = await loadState()
          setDailyTasks(updatedState.dailyTasks)
          setDailyHistory(updatedState.dailyHistory)
          setMood(updatedState.mood)
          toast("Daily tasks telah direset", "info")
        }
  
        // Check for weekly reset
        if (await needsWeeklyReset()) {
          await performWeeklyReset()
          const updatedState = await loadState()
          setWeeklyGoals(updatedState.weeklyGoals)
          setWeeklyHistory(updatedState.weeklyHistory.map(entry => ({
            weekLabel: entry.weekLabel,
            notes: (entry as any).notes || "",
            startDate: (entry as any).startDate || entry.weekStart,
            endDate: entry.endDate,
          })))
          toast("Weekly goals telah direset", "info")
        }
  
        setIsLocked(false)
      } catch (error) {
        console.error("Error initializing app:", error)
        toast("Gagal memuat data", "error")
      } finally {
        setIsLoading(false)
      }
    }
  
    initializeApp()
  }, [toast])
  
  // Auto-save to Supabase with debounce
  useEffect(() => {
    if (isLoading) return  // Only check isLoading, not isLocked
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Debounce save - wait 1 second after last change
    saveTimeoutRef.current = setTimeout(async () => {
      if (!isAuthenticated()) return  // Add auth check
      
      try {
        await saveState({
          mood,
          lastMoodDate,
          expenses,
          dailyTasks,
          weeklyGoals,
          unplannedTasks: [],
          longTermGoals,
          dailyHistory,
          weeklyHistory: weeklyHistory.map(entry => ({
            weekLabel: entry.weekLabel,
            weekStart: entry.startDate,
            endDate: entry.endDate,
            totalGoals: (entry as any).totalGoals || 0,
            completedGoals: (entry as any).completedGoals || 0,
          })),
          weeklyProgress,
          dailyNotes,
          currentMonth: currentMonth.toISOString(),
        })
        console.log("State auto-saved to Supabase")
      } catch (error) {
        console.error("Error saving state:", error)
        toast("Gagal menyimpan data", "error")
      }
    }, 1000)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [
    mood,
    lastMoodDate,
    expenses,
    dailyTasks,
    weeklyGoals,
    longTermGoals,
    dailyHistory,
    weeklyHistory,
    weeklyProgress,
    dailyNotes,
    currentMonth,
    isLoading,  // Removed isLocked from dependencies
    toast,
  ])

  // ✅ FIXED: Update daily history when tasks/goals change
  const updateTodayHistory = useCallback(() => {
    if (isLocked || isLoading) return
    
    const today = getTodayString()
    const todayDayName = getCurrentDayName()
    
    // Filter goals for today only
    const todayGoals = weeklyGoals.filter((g) => g.day === todayDayName)
    const completedGoals = todayGoals.filter((g) => g.done)
    
    // Get today's note if exists
    const todayNote = dailyNotes.find(n => n.date === today)
    
    setDailyHistory((prev) => {
      // ✅ FIX: If no tasks AND no goals for today AND no note → remove entry
      if (dailyTasks.length === 0 && todayGoals.length === 0 && !todayNote?.note?.trim()) {
        console.log('[updateTodayHistory] Removing today entry - no tasks, no goals, no note')
        return prev.filter((h) => h.date !== today)
      }
      
      const completedGoalsList = completedGoals.map((g) => g.text)
      const failedTasks = dailyTasks.filter((t) => !t.done)
      const failedGoals = todayGoals.filter((g) => !g.done)
      
      const newRecord = {
        date: today,
        totalTasks: dailyTasks.length,
        completedTasks: dailyTasks.filter((t) => t.done).length,
        weeklyGoalsCompleted: completedGoals.length,
        weeklyGoalsTotal: todayGoals.length,
        completedGoalsList,
        failedTasksList: failedTasks.map(t => t.text),
        failedGoalsList: failedGoals.map(g => g.text),
        hasNotes: !!todayNote?.note?.trim(),
        dailyNote: todayNote?.note?.trim() || undefined,
      }

      const existing = prev.find((h) => h.date === today)
      
      if (!existing) {
        console.log('[updateTodayHistory] Creating new history entry:', newRecord)
        return [...prev, newRecord]
      }
      
      // Check if anything changed
      const hasChanges = 
        existing.completedTasks !== newRecord.completedTasks ||
        existing.totalTasks !== newRecord.totalTasks ||
        existing.weeklyGoalsCompleted !== newRecord.weeklyGoalsCompleted ||
        existing.weeklyGoalsTotal !== newRecord.weeklyGoalsTotal ||
        JSON.stringify(existing.completedGoalsList) !== JSON.stringify(completedGoalsList) ||
        JSON.stringify(existing.failedTasksList) !== JSON.stringify(newRecord.failedTasksList) ||
        JSON.stringify(existing.failedGoalsList) !== JSON.stringify(newRecord.failedGoalsList) ||
        existing.hasNotes !== newRecord.hasNotes ||
        existing.dailyNote !== newRecord.dailyNote
      
      if (hasChanges) {
        console.log('[updateTodayHistory] Updating history entry:', newRecord)
        return prev.map((h) => (h.date === today ? newRecord : h))
      }
      
      return prev
    })
  }, [dailyTasks, weeklyGoals, dailyNotes, isLocked, isLoading])

  // Call updateTodayHistory whenever dependencies change
  useEffect(() => {
    updateTodayHistory()
  }, [updateTodayHistory])

  // Handler to save daily note
  const handleSaveDailyNote = useCallback(async (day: string, note: string) => {
    try {
      await saveDailyNoteForToday(day, note)
      const updatedState = await loadState()
      setDailyNotes(updatedState.dailyNotes || [])
      setDailyHistory(updatedState.dailyHistory)
      toast("Catatan berhasil disimpan", "success")
      console.log(`[handleSaveDailyNote] Note saved for ${day}:`, note)
    } catch (error) {
      console.error("[handleSaveDailyNote] Error saving note:", error)
      toast("Gagal menyimpan catatan", "error")
      throw error
    }
  }, [toast])

  const now = new Date()
  const thisMonthExpenses = expenses.filter((e) => {
    const d = new Date(e.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const incomeThisMonth = thisMonthExpenses
    .filter((e) => e.type === "in")
    .reduce((s, e) => s + e.amount, 0)
  const expenseThisMonth = thisMonthExpenses
    .filter((e) => e.type === "out")
    .reduce((s, e) => s + e.amount, 0)
  const saldo = incomeThisMonth - expenseThisMonth

  const lastMonth = new Date(now)
  lastMonth.setMonth(lastMonth.getMonth() - 1)
  const lastMonthExpenses = expenses.filter((e) => {
    const d = new Date(e.date)
    return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear()
  })
  const lastMonthIncome = lastMonthExpenses
    .filter((e) => e.type === "in")
    .reduce((s, e) => s + e.amount, 0)
  const lastMonthExpense = lastMonthExpenses
    .filter((e) => e.type === "out")
    .reduce((s, e) => s + e.amount, 0)
  const lastMonthSaldo = lastMonthIncome - lastMonthExpense

  const tasksDone = dailyTasks.filter((t) => t.done).length
  const tasksTotal = dailyTasks.length
  const goalsDone = weeklyGoals.filter((g) => g.done).length
  const goalsTotal = weeklyGoals.length

  const dateStr = now.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const processedGoals = longTermGoals.map((g) => {
    if (g.status === "active" && isOverdue(g.deadline)) {
      return { ...g, status: "failed" as const }
    }
    return g
  })

  useEffect(() => {
    const hasChanges = processedGoals.some((pg, i) => pg.status !== longTermGoals[i].status)
    if (hasChanges) {
      setLongTermGoals(processedGoals)
    }
  }, [processedGoals, longTermGoals])

  const addExpense = useCallback((e: Expense) => {
    setExpenses((prev) => [e, ...prev])
  }, [])

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const toggleTask = useCallback((id: string) => {
    setDailyTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    )
  }, [])

  const addTask = useCallback(
    (text: string) => {
      setDailyTasks((prev) => [...prev, { id: generateId(), text, done: false }])
      toast("Tugas berhasil ditambahkan", "success")
    },
    [toast]
  )

  const deleteTask = useCallback((id: string) => {
    setDailyTasks((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addWeeklyGoal = useCallback((day: string, text: string) => {
    setWeeklyGoals((prev) => [...prev, { id: generateId(), day, text, done: false }])
  }, [])

  const toggleWeeklyGoal = useCallback((id: string) => {
    setWeeklyGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, done: !g.done } : g))
    )
  }, [])

  const deleteWeeklyGoal = useCallback((id: string) => {
    setWeeklyGoals((prev) => prev.filter((g) => g.id !== id))
  }, [])

  const addLongTermGoal = useCallback((goal: LongTermGoal) => {
    setLongTermGoals((prev) => [...prev, goal])
  }, [])

  const deleteLongTermGoal = useCallback((id: string) => {
    setLongTermGoals((prev) => prev.filter((g) => g.id !== id))
  }, [])

  const completeLongTermGoal = useCallback((id: string) => {
    setLongTermGoals((prev) =>
      prev.map((g) =>
        g.id === id
          ? { ...g, status: "completed" as const, completedAt: new Date().toISOString() }
          : g
      )
    )
  }, [])

  const activeGoalsCount = processedGoals.filter((g) => g.status === "active").length
  
  const nearest3ActiveGoals = processedGoals
    .filter((g) => g.status === "active")
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 3)

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Memuat data...</p>
        </div>
      </div>
    )
  }

  if (isLocked) {
    return (
      <LockScreen 
        onUnlock={() => {
          setAuthenticated(true)
          setIsLocked(false)
        }} 
      />
    )
  }

  const navItems: { id: NavSection; icon: any; label: string }[] = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "keuangan", icon: Wallet, label: "Keuangan" },
    { id: "tugas", icon: ListTodo, label: "Tugas" },
    { id: "goals", icon: Target, label: "Goals" },
  ]

  const handleLogout = useCallback(() => {
    console.log("[CommandCenter] Logging out...")
    setIsLocked(true)
    // Reload window to reset all state
    setTimeout(() => {
      window.location.reload()
    }, 100)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-20 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-cyan shadow-xl backdrop-blur-xl transition-colors hover:bg-cyan hover:text-background md:bottom-6 md:right-6"
            aria-label="Scroll to top"
          >
            <ArrowUp className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>
      
      {/* Top Right Controls */}
      <div className="fixed right-4 top-4 z-40 flex items-center gap-2 md:right-6 md:top-6">
        <MusicPlayer />
        <ThemeToggle />
        <button
          onClick={() => setShowSettings(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground backdrop-blur-xl transition-colors hover:text-primary"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>

      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)}
        onLogout={handleLogout}  // Pass logout handler
      />

      <main className="w-full px-4 py-4 pb-24 md:px-8 md:py-6">
        <div className="mx-auto w-full max-w-7xl">
          {/* Header with Side Navigation */}
          <div className="mb-4 flex flex-col gap-3 md:mb-6 md:flex-row md:items-start md:justify-between md:gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-balance text-xl font-bold tracking-tight text-foreground md:text-2xl lg:text-3xl">
                Productivity Dashboard
              </h1>
              <p className="text-xs text-muted-foreground md:text-sm">{dateStr}</p>
            </div>
            
            {/* Side Navigation */}
            <div className="flex flex-wrap gap-2 md:flex-nowrap">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveNav(item.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all md:px-4",
                      activeNav === item.id
                        ? "bg-cyan/20 text-cyan shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                        : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeNav === "dashboard" && (
              <motion.div
                key="dashboard"
                variants={{
                  initial: { opacity: 0, y: 20 },
                  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
                  exit: { opacity: 0, y: 20, transition: { duration: 0.5 } },
                }}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex w-full min-w-0 flex-col gap-3 md:gap-4"
              >
                {/* Top row */}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:gap-4">
                  <div className="col-span-1 md:col-span-4">
                    <SaldoCard
                      saldo={saldo}
                      lastMonthSaldo={lastMonthSaldo}
                      incomeThisMonth={incomeThisMonth}
                      expenseThisMonth={expenseThisMonth}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-4">
                    <DailyProgress
                      tasksTotal={tasksTotal}
                      tasksDone={tasksDone}
                      goalsTotal={goalsTotal}
                      goalsDone={goalsDone}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-4">
                    <MoodTracker mood={mood} lastMoodDate={lastMoodDate} onMoodChange={setMood} />
                  </div>
                </div>

                {/* Chart + Quick Stats */}
                <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-12">
                  <div className="col-span-1 lg:col-span-8">
                    <ExpenseChart expenses={thisMonthExpenses} />
                  </div>
                  <div className="col-span-1 lg:col-span-4">
                    <GlassCard className="flex h-full w-full flex-col gap-3 md:gap-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1 w-1 rounded-full bg-cyan"></div>
                        <span className="text-sm font-semibold text-foreground">
                          Ringkasan Cepat
                        </span>
                      </div>
                      <div className="flex flex-col gap-3">
                        <QuickStat label="Tugas Selesai" value={`${tasksDone}/${tasksTotal}`} color="cyan" />
                        <QuickStat label="Goals Mingguan" value={`${goalsDone}/${goalsTotal}`} color="neon" />
                        <QuickStat label="Goals Aktif" value={`${activeGoalsCount}`} color="cyan" />
                      </div>
                    </GlassCard>
                  </div>
                </div>

                {/* Tasks Preview + Active Goals */}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:gap-4">
                  <div className="col-span-1 md:col-span-5">
                    <DailyTasks tasks={dailyTasks} onToggle={toggleTask} onAdd={addTask} onDelete={deleteTask} hideInput={true} />
                  </div>
                  <div className="col-span-1 md:col-span-7">
                    <GlassCard glowColor="neon" className="flex h-full w-full flex-col gap-3 md:gap-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1 w-1 rounded-full bg-neon"></div>
                        <h3 className="text-sm font-semibold text-foreground">Goals Terdekat</h3>
                      </div>
                      <div className="flex flex-col gap-3">
                        {nearest3ActiveGoals.length === 0 ? (
                          <p className="py-8 text-center text-sm text-muted-foreground">
                            Tidak ada goals aktif saat ini
                          </p>
                        ) : (
                          nearest3ActiveGoals.map((g) => {
                            const overdue = isOverdue(g.deadline)
                            return (
                              <div 
                                key={g.id} 
                                className={cn(
                                  "flex flex-col gap-2 rounded-xl border-2 p-3 transition-all md:gap-3 md:p-4",
                                  overdue 
                                    ? "border-crimson bg-crimson/5" 
                                    : "border-border bg-secondary/30"
                                )}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-foreground">{g.title}</p>
                                    {g.notes && (
                                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{g.notes}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  {overdue ? (
                                    <>
                                      <AlertTriangle className="h-4 w-4 text-crimson" />
                                      <span className="text-xs font-medium text-crimson">
                                        Terlambat {Math.abs(daysUntil(g.deadline))} hari
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <Calendar className="h-4 w-4 text-cyan" />
                                      <span className="text-xs font-medium text-cyan">
                                        {daysUntil(g.deadline)} hari lagi
                                      </span>
                                    </>
                                  )}
                                  <span className="ml-auto text-xs text-muted-foreground">
                                    {new Date(g.deadline).toLocaleDateString("id-ID")}
                                  </span>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </GlassCard>
                  </div>
                </div>
              </motion.div>
            )}

            {activeNav === "keuangan" && (
              <motion.div
                key="keuangan"
                variants={{
                  initial: { opacity: 0, y: 20 },
                  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
                  exit: { opacity: 0, y: 20, transition: { duration: 0.5 } },
                }}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex w-full min-w-0 flex-col gap-3 md:gap-4"
                ref={expenseRef}
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:gap-4">
                  <div className="col-span-1 md:col-span-4">
                    <SaldoCard
                      saldo={saldo}
                      lastMonthSaldo={lastMonthSaldo}
                      incomeThisMonth={incomeThisMonth}
                      expenseThisMonth={expenseThisMonth}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-8">
                    <ExpenseChart expenses={thisMonthExpenses} />
                  </div>
                </div>
                <div className="col-span-1">
                  <ExpenseTracker
                    expenses={expenses}
                    onAddExpense={addExpense}
                    onDeleteExpense={deleteExpense}
                    currentMonth={currentMonth}
                    onMonthChange={setCurrentMonth}
                  />
                </div>
              </motion.div>
            )}

            {activeNav === "tugas" && (
              <motion.div
                key="tugas"
                variants={{
                  initial: { opacity: 0, y: 20 },
                  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeInOut" } },
                  exit: { opacity: 0, y: 20, transition: { duration: 0.5 } },
                }}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex w-full min-w-0 flex-col gap-3 md:gap-4"
                ref={taskRef}
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:gap-4">
                  <div className="col-span-1 md:col-span-8">
                    <DailyTasks tasks={dailyTasks} onToggle={toggleTask} onAdd={addTask} onDelete={deleteTask} />
                  </div>
                  <div className="col-span-1 md:col-span-4">
                    <DailyProgress
                      tasksTotal={tasksTotal}
                      tasksDone={tasksDone}
                      goalsTotal={goalsTotal}
                      goalsDone={goalsDone}
                    />
                  </div>
                </div>
                <div className="col-span-1">
                  <WeeklyGoals
                    goals={weeklyGoals}
                    onAddGoal={addWeeklyGoal}
                    onToggleGoal={toggleWeeklyGoal}
                    onDeleteGoal={deleteWeeklyGoal}
                    weeklyHistory={weeklyHistory}
                    dailyNotes={dailyNotes}
                    onSaveDailyNote={handleSaveDailyNote}
                  />
                </div>
                <div className="col-span-1">
                  <MonthlyTaskProgress 
                    dailyHistory={dailyHistory} 
                    weeklyGoals={weeklyGoals}
                    weeklyHistory={weeklyHistory}
                    dailyNotes={dailyNotes}
                  />
                </div>
              </motion.div>
            )}

            {activeNav === "goals" && (
              <motion.div
                key="goals"
                variants={{
                  initial: { opacity: 0, y: 20 },
                  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeInOut" } },
                  exit: { opacity: 0, y: 20, transition: { duration: 0.5 } },
                }}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex w-full min-w-0 flex-col gap-3 md:gap-4"
                ref={goalRef}
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
                  <div className="col-span-1">
                    <DailyProgress
                      tasksTotal={tasksTotal}
                      tasksDone={tasksDone}
                      goalsTotal={goalsTotal}
                      goalsDone={goalsDone}
                    />
                  </div>
                  <div className="col-span-1">
                    <MoodTracker mood={mood} lastMoodDate={lastMoodDate} onMoodChange={setMood} />
                  </div>
                </div>

                <LongTermGoals
                  goals={processedGoals}
                  onAdd={addLongTermGoal}
                  onDelete={deleteLongTermGoal}
                  onComplete={completeLongTermGoal}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

function QuickStat({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: "cyan" | "neon" | "crimson"
}) {
  const colorClasses = {
    cyan: "bg-[hsl(187_100%_50%/0.1)] text-cyan",
    neon: "bg-[hsl(145_100%_50%/0.1)] text-neon",
    crimson: "bg-[hsl(0_85%_55%/0.1)] text-crimson",
  }

  return (
    <div className="flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-2.5">
      <span className="text-xs text-muted-foreground md:text-sm">{label}</span>
      <span className={`rounded-lg px-2 py-1 text-xs font-bold md:px-2.5 md:text-sm ${colorClasses[color]}`}>
        {value}
      </span>
    </div>
  )
}

export default function CommandCenter() {
  return (
    <div className="w-full md:mx-auto md:my-8 md:w-3/4 md:min-w-3/4">
      <ToastProvider>
        <CommandCenterInner />
      </ToastProvider>
    </div>
  )
}