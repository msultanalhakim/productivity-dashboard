// Types
export type NavSection = "dashboard" | "keuangan" | "tugas" | "goals"
export type Mood = "senang" | "biasa" | "sedih" | "marah" | "fokus"

export interface Expense {
  id: string
  label: string
  amount: number
  type: "in" | "out"
  date: string
  category: string
}

export interface DailyTask {
  id: string
  text: string
  done: boolean
}

export interface WeeklyGoal {
  id: string
  day: string
  text: string
  done: boolean
}

export interface UnplannedTask {
  id: string
  text: string
  done: boolean
}

export interface LongTermGoal {
  id: string
  title: string
  deadline: string
  notes: string
  status: "active" | "completed" | "failed"
  createdAt: string
  completedAt?: string
}

export interface TaskHistoryEntry {
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

export interface WeeklyHistoryEntry {
  weekLabel: string
  weekStart: string
  endDate: string
  totalGoals: number
  completedGoals: number
  notes?: string
}

export interface WeeklyProgressEntry {
  date: string
  day: string
  goalsCompleted: number
  goalsTotal: number
  notes?: string
}

export interface DailyNote {
  date: string
  day: string
  note: string
}

export interface AppState {
  mood: Mood | null
  lastMoodDate: string | null
  expenses: Expense[]
  dailyTasks: DailyTask[]
  weeklyGoals: WeeklyGoal[]
  unplannedTasks: UnplannedTask[]
  weeklyNotes: string
  longTermGoals: LongTermGoal[]
  dailyHistory: TaskHistoryEntry[]
  weeklyHistory: WeeklyHistoryEntry[]
  weeklyProgress: WeeklyProgressEntry[]
  dailyNotes: DailyNote[]
  lastDailyReset: string | null
  lastWeeklyReset: string | null
  currentMonth: string
  password: string
}

// Constants
export const DAYS_ID = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]

export const EXPENSE_CATEGORIES = [
  "Makanan",
  "Transportasi",
  "Belanja",
  "Tagihan",
  "Hiburan",
  "Kesehatan",
  "Pendidikan",
  "Lainnya",
]

export const MOOD_EMOJI: Record<Mood, string> = {
  senang: "😊",
  biasa: "😐",
  sedih: "😢",
  marah: "😡",
  fokus: "🧠",
}

// Helper functions
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

export function formatRupiah(amount: number): string {
  return amount.toLocaleString("id-ID")
}

export function getMonthName(date: Date): string {
  return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" })
}

export function isOverdue(deadline: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const deadlineDate = new Date(deadline)
  deadlineDate.setHours(0, 0, 0, 0)
  return today > deadlineDate
}

export function daysOverdue(deadline: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const deadlineDate = new Date(deadline)
  deadlineDate.setHours(0, 0, 0, 0)
  const diff = today.getTime() - deadlineDate.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export function daysUntil(deadline: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const deadlineDate = new Date(deadline)
  deadlineDate.setHours(0, 0, 0, 0)
  const diff = deadlineDate.getTime() - today.getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

export function getTodayString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getCurrentWeekStart(): string {
  const today = new Date()
  const day = today.getDay()
  const diff = day === 0 ? -6 : 1 - day // Monday as start of week
  const monday = new Date(today)
  monday.setDate(today.getDate() + diff)
  
  const year = monday.getFullYear()
  const month = String(monday.getMonth() + 1).padStart(2, '0')
  const dayStr = String(monday.getDate()).padStart(2, '0')
  return `${year}-${month}-${dayStr}`
}

export function getWeekLabel(date: Date): string {
  const weekNum = Math.ceil(date.getDate() / 7)
  const monthName = date.toLocaleDateString("id-ID", { month: "short" })
  return `Minggu ke-${weekNum}, ${monthName} ${date.getFullYear()}`
}

export function getCurrentDayName(): string {
  const today = new Date()
  const dayIndex = today.getDay()
  return dayIndex === 0 ? "Minggu" : DAYS_ID[dayIndex - 1]
}

// ===== Bug Fix Helpers =====

/**
 * Get stats for goals on a specific day
 * Fix Bug #1: Tidak menghitung input field atau placeholder
 */
export function getDayGoalsStats(goals: WeeklyGoal[], day: string) {
  // Filter hanya goals yang valid (punya id dan day yang sesuai)
  const dayGoals = goals.filter(g => g.id && g.day === day)
  const completedCount = dayGoals.filter(g => g.done).length
  const totalCount = dayGoals.length
  
  return { 
    completedCount, 
    totalCount, 
    goals: dayGoals,
    completedGoals: dayGoals.filter(g => g.done),
    failedGoals: dayGoals.filter(g => !g.done)
  }
}

/**
 * Update daily history with current progress
 * Fix Bug #2 & #3: Update history saat ada perubahan dan pastikan date benar
 */
export function updateDailyHistoryForToday(
  currentHistory: TaskHistoryEntry[],
  dailyTasks: DailyTask[],
  weeklyGoals: WeeklyGoal[],
  dailyNote?: string
): TaskHistoryEntry[] {
  const today = getTodayString()
  const todayDayName = getCurrentDayName()
  
  // Filter goals untuk hari ini
  const todayGoals = weeklyGoals.filter(g => g.day === todayDayName)
  const completedGoals = todayGoals.filter(g => g.done)
  const failedGoals = todayGoals.filter(g => !g.done)
  const failedTasks = dailyTasks.filter(t => !t.done)
  
  // Cari record untuk hari ini
  const todayIndex = currentHistory.findIndex(h => h.date === today)
  
  const newEntry: TaskHistoryEntry = {
    date: today,
    totalTasks: dailyTasks.length,
    completedTasks: dailyTasks.filter(t => t.done).length,
    weeklyGoalsTotal: todayGoals.length,
    weeklyGoalsCompleted: completedGoals.length,
    completedGoalsList: completedGoals.map(g => g.text),
    failedTasksList: failedTasks.map(t => t.text),
    failedGoalsList: failedGoals.map(g => g.text),
    hasNotes: !!dailyNote?.trim(),
    dailyNote: dailyNote?.trim() || undefined,
  }
  
  if (todayIndex >= 0) {
    // Update existing entry
    const updated = [...currentHistory]
    updated[todayIndex] = newEntry
    return updated
  } else {
    // Add new entry
    return [...currentHistory, newEntry]
  }
}

/**
 * Update weekly progress for today
 * Fix Bug #3: Pastikan update untuk hari ini, bukan kemarin
 */
export function updateWeeklyProgressForToday(
  currentProgress: WeeklyProgressEntry[],
  weeklyGoals: WeeklyGoal[]
): WeeklyProgressEntry[] {
  const today = getTodayString()
  const todayDayName = getCurrentDayName()
  
  // Filter goals untuk hari ini
  const todayGoals = weeklyGoals.filter(g => g.day === todayDayName)
  const completedGoals = todayGoals.filter(g => g.done)
  
  // Cari record untuk hari ini
  const todayIndex = currentProgress.findIndex(p => p.date === today)
  
  const newEntry: WeeklyProgressEntry = {
    date: today,
    day: todayDayName,
    goalsTotal: todayGoals.length,
    goalsCompleted: completedGoals.length,
  }
  
  if (todayIndex >= 0) {
    // Update existing entry
    const updated = [...currentProgress]
    updated[todayIndex] = newEntry
    return updated
  } else {
    // Add new entry
    return [...currentProgress, newEntry]
  }
}

/**
 * Save or update daily note for current date
 * This ensures the note is saved with the correct date (today)
 */
export function saveDailyNote(
  currentNotes: DailyNote[],
  day: string,
  note: string
): DailyNote[] {
  const today = getTodayString()
  
  // Find if there's already a note for today and this day
  const existingIndex = currentNotes.findIndex(
    n => n.date === today && n.day === day
  )
  
  const newNote: DailyNote = {
    date: today,
    day,
    note: note.trim(),
  }
  
  if (existingIndex >= 0) {
    // Update existing note
    const updated = [...currentNotes]
    updated[existingIndex] = newNote
    return updated
  } else {
    // Add new note
    return [...currentNotes, newNote]
  }
}

/**
 * Get daily note for a specific date and day
 */
export function getDailyNoteForDate(
  notes: DailyNote[],
  date: string,
  day: string
): string {
  const note = notes.find(n => n.date === date && n.day === day)
  return note?.note || ""
}

/**
 * Get daily note for today
 */
export function getTodayNote(
  notes: DailyNote[],
  day: string
): string {
  const today = getTodayString()
  return getDailyNoteForDate(notes, today, day)
}