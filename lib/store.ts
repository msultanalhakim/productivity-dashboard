// Types
export type NavSection = "dashboard" | "keuangan" | "tugas" | "goals"
export type Mood = "semangat" | "fokus" | "mager" | "sedih" | "marah"

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
  semangat: "😎",
  fokus: "🧠",
  mager: "😫",
  sedih: "😢",
  marah: "😡",
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

/**
 * Get day name from a date string (YYYY-MM-DD)
 */
export function getDayNameFromDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00') // Force local timezone
  const dayIndex = date.getDay()
  return dayIndex === 0 ? "Minggu" : DAYS_ID[dayIndex - 1]
}

// ===== IMPROVED Bug Fix Helpers =====

/**
 * Get stats for goals on a specific day
 * FIX: Hanya menghitung goals yang valid (punya id dan day yang sesuai)
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
 * FIX CRITICAL: 
 * 1. Pastikan hanya goals untuk hari yang tepat yang dihitung (berdasarkan nama hari dari date)
 * 2. Update real-time saat ada perubahan tasks/goals
 * 3. Hapus entry jika tidak ada tasks dan goals sama sekali (untuk fix bug delete)
 */
export function updateDailyHistoryForToday(
  currentHistory: TaskHistoryEntry[],
  dailyTasks: DailyTask[],
  weeklyGoals: WeeklyGoal[],
  dailyNote?: string
): TaskHistoryEntry[] {
  const today = getTodayString()
  const todayDayName = getCurrentDayName()
  
  // CRITICAL FIX: Filter goals berdasarkan hari yang sesuai dengan tanggal hari ini
  const todayGoals = weeklyGoals.filter(g => g.day === todayDayName)
  const completedGoals = todayGoals.filter(g => g.done)
  const failedGoals = todayGoals.filter(g => !g.done)
  const failedTasks = dailyTasks.filter(t => !t.done)
  
  // FIX: Jika tidak ada daily tasks DAN tidak ada weekly goals untuk hari ini DAN tidak ada note
  // maka HAPUS entry dari history (untuk fix bug delete task)
  if (dailyTasks.length === 0 && todayGoals.length === 0 && !dailyNote?.trim()) {
    return currentHistory.filter(h => h.date !== today)
  }
  
  // Cari record untuk hari ini
  const todayIndex = currentHistory.findIndex(h => h.date === today)
  
  const newEntry: TaskHistoryEntry = {
    date: today,
    totalTasks: dailyTasks.length,
    completedTasks: dailyTasks.filter(t => t.done).length,
    weeklyGoalsTotal: todayGoals.length, // Hanya goals untuk hari ini
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
 * Update daily history untuk tanggal spesifik (bukan hari ini)
 * Digunakan saat user mengubah goals di hari lain
 */
export function updateDailyHistoryForDate(
  currentHistory: TaskHistoryEntry[],
  dateStr: string,
  weeklyGoals: WeeklyGoal[],
  dailyNote?: string
): TaskHistoryEntry[] {
  const dayName = getDayNameFromDate(dateStr)
  
  // Filter goals untuk hari yang sesuai
  const dayGoals = weeklyGoals.filter(g => g.day === dayName)
  const completedGoals = dayGoals.filter(g => g.done)
  const failedGoals = dayGoals.filter(g => !g.done)
  
  // Cari existing record untuk tanggal ini
  const existingIndex = currentHistory.findIndex(h => h.date === dateStr)
  const existingRecord = existingIndex >= 0 ? currentHistory[existingIndex] : null
  
  // Jika tidak ada goals untuk hari ini DAN tidak ada daily tasks DAN tidak ada note
  // maka hapus entry (jika ada)
  if (dayGoals.length === 0 && (!existingRecord || existingRecord.totalTasks === 0) && !dailyNote?.trim()) {
    if (existingIndex >= 0) {
      return currentHistory.filter(h => h.date !== dateStr)
    }
    return currentHistory
  }
  
  const newEntry: TaskHistoryEntry = {
    date: dateStr,
    totalTasks: existingRecord?.totalTasks || 0,
    completedTasks: existingRecord?.completedTasks || 0,
    weeklyGoalsTotal: dayGoals.length,
    weeklyGoalsCompleted: completedGoals.length,
    completedGoalsList: completedGoals.map(g => g.text),
    failedTasksList: existingRecord?.failedTasksList || [],
    failedGoalsList: failedGoals.map(g => g.text),
    hasNotes: !!dailyNote?.trim(),
    dailyNote: dailyNote?.trim() || undefined,
  }
  
  if (existingIndex >= 0) {
    const updated = [...currentHistory]
    updated[existingIndex] = newEntry
    return updated
  } else {
    return [...currentHistory, newEntry]
  }
}

/**
 * Update weekly progress for today
 * FIX: Pastikan hanya menghitung goals untuk hari ini
 */
export function updateWeeklyProgressForToday(
  currentProgress: WeeklyProgressEntry[],
  weeklyGoals: WeeklyGoal[]
): WeeklyProgressEntry[] {
  const today = getTodayString()
  const todayDayName = getCurrentDayName()
  
  // CRITICAL FIX: Filter goals berdasarkan hari yang sesuai
  const todayGoals = weeklyGoals.filter(g => g.day === todayDayName)
  const completedGoals = todayGoals.filter(g => g.done)
  
  // Jika tidak ada goals untuk hari ini, hapus entry
  if (todayGoals.length === 0) {
    return currentProgress.filter(p => p.date !== today)
  }
  
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
  
  // Jika note kosong, hapus entry
  if (!note.trim()) {
    if (existingIndex >= 0) {
      return currentNotes.filter((_, i) => i !== existingIndex)
    }
    return currentNotes
  }
  
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

/**
 * Recalculate all daily history for the current week
 * Call this after adding/removing/toggling weekly goals
 * to ensure all dates in current week have correct goal counts
 */
export function recalculateWeeklyGoalsInHistory(
  currentHistory: TaskHistoryEntry[],
  weeklyGoals: WeeklyGoal[]
): TaskHistoryEntry[] {
  const today = new Date()
  const currentWeekStart = getCurrentWeekStart()
  const weekStartDate = new Date(currentWeekStart + 'T00:00:00')
  
  // Get all dates in current week (Monday to Sunday)
  const weekDates: string[] = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStartDate)
    date.setDate(weekStartDate.getDate() + i)
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    weekDates.push(dateStr)
  }
  
  let updatedHistory = [...currentHistory]
  
  // Update each date in the current week
  for (const dateStr of weekDates) {
    const dayName = getDayNameFromDate(dateStr)
    const dayGoals = weeklyGoals.filter(g => g.day === dayName)
    const completedGoals = dayGoals.filter(g => g.done)
    const failedGoals = dayGoals.filter(g => !g.done)
    
    const existingIndex = updatedHistory.findIndex(h => h.date === dateStr)
    const existingRecord = existingIndex >= 0 ? updatedHistory[existingIndex] : null
    
    // Skip jika tidak ada goals dan tidak ada tasks untuk tanggal ini
    if (dayGoals.length === 0 && (!existingRecord || existingRecord.totalTasks === 0)) {
      // Hapus entry jika ada
      if (existingIndex >= 0) {
        updatedHistory = updatedHistory.filter(h => h.date !== dateStr)
      }
      continue
    }
    
    const newEntry: TaskHistoryEntry = {
      date: dateStr,
      totalTasks: existingRecord?.totalTasks || 0,
      completedTasks: existingRecord?.completedTasks || 0,
      weeklyGoalsTotal: dayGoals.length,
      weeklyGoalsCompleted: completedGoals.length,
      completedGoalsList: completedGoals.map(g => g.text),
      failedTasksList: existingRecord?.failedTasksList || [],
      failedGoalsList: failedGoals.map(g => g.text),
      hasNotes: existingRecord?.hasNotes || false,
      dailyNote: existingRecord?.dailyNote,
    }
    
    if (existingIndex >= 0) {
      updatedHistory[existingIndex] = newEntry
    } else {
      updatedHistory.push(newEntry)
    }
  }
  
  return updatedHistory
}