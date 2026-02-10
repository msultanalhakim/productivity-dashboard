import type { AppState } from "./store"

const STORAGE_KEY = "command-center-data"
const SESSION_KEY = "command-center-session"
const IDLE_TIMEOUT = 60 * 60 * 1000 // 1 hour in milliseconds

export const DEFAULT_STATE: AppState = {
  mood: null,
  expenses: [],
  dailyTasks: [],
  weeklyGoals: [],
  unplannedTasks: [],
  weeklyNotes: "",
  longTermGoals: [],
  dailyHistory: [],
  weeklyHistory: [],
  weeklyProgress: [],
  dailyNotes: [],
  lastDailyReset: null,
  lastWeeklyReset: null,
  currentMonth: new Date().toISOString(),
  password: "admin",
}

// Session ID generator
function generateSessionId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

// Get current session ID
export function getCurrentSessionId(): string | null {
  if (typeof window === "undefined") return null
  return sessionStorage.getItem(SESSION_KEY)
}

// Create new session
export function createSession(): string {
  if (typeof window === "undefined") return ""
  const sessionId = generateSessionId()
  sessionStorage.setItem(SESSION_KEY, sessionId)
  localStorage.setItem("lastActivity", Date.now().toString())
  return sessionId
}

// Check if session is valid
export function isSessionValid(): boolean {
  if (typeof window === "undefined") return false
  
  const sessionId = getCurrentSessionId()
  if (!sessionId) return false

  const lastActivity = localStorage.getItem("lastActivity")
  if (!lastActivity) return false

  const timeSinceActivity = Date.now() - parseInt(lastActivity)
  return timeSinceActivity < IDLE_TIMEOUT
}

// Update last activity
export function updateActivity(): void {
  if (typeof window === "undefined") return
  localStorage.setItem("lastActivity", Date.now().toString())
}

// Clear session
export function clearSession(): void {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(SESSION_KEY)
  localStorage.removeItem("lastActivity")
}

// Load state from localStorage
export function loadState(): AppState {
  if (typeof window === "undefined") return DEFAULT_STATE

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_STATE
    
    const parsed = JSON.parse(stored)
    return { ...DEFAULT_STATE, ...parsed }
  } catch (error) {
    console.error("Error loading state:", error)
    return DEFAULT_STATE
  }
}

// Save state to localStorage
export function saveState(state: Partial<AppState>): void {
  if (typeof window === "undefined") return

  try {
    const current = loadState()
    const updated = { ...current, ...state }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error("Error saving state:", error)
  }
}

// Verify password
export function verifyPassword(inputPassword: string): boolean {
  const state = loadState()
  return state.password === inputPassword
}

// Update password
export function updatePassword(newPassword: string): void {
  saveState({ password: newPassword })
}

// Helper: Get today's date in local timezone
function getTodayDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Helper: Get current week start in local timezone
function getCurrentWeekStart(): string {
  const today = new Date()
  const day = today.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(today)
  monday.setDate(today.getDate() + diff)
  
  const year = monday.getFullYear()
  const month = String(monday.getMonth() + 1).padStart(2, '0')
  const dayStr = String(monday.getDate()).padStart(2, '0')
  return `${year}-${month}-${dayStr}`
}

// Check if needs daily reset
export function needsDailyReset(): boolean {
  const state = loadState()
  const today = getTodayDate()
  return state.lastDailyReset !== today
}

// Check if needs weekly reset
export function needsWeeklyReset(): boolean {
  const state = loadState()
  const currentWeekStart = getCurrentWeekStart()
  return state.lastWeeklyReset !== currentWeekStart
}

// Perform daily reset
export function performDailyReset(): void {
  const state = loadState()
  const today = getTodayDate()
  
  // Save current tasks to history
  if (state.dailyTasks.length > 0 || state.weeklyGoals.length > 0) {
    const completedTasks = state.dailyTasks.filter(t => t.done).length
    const failedTasks = state.dailyTasks.filter(t => !t.done)
    
    // Get today's goals
    const todayDayName = getCurrentDayName()
    const todayGoals = state.weeklyGoals.filter(g => g.day === todayDayName)
    const completedGoals = todayGoals.filter(g => g.done)
    const failedGoals = todayGoals.filter(g => !g.done)
    
    // Get today's note if exists
    const todayNote = state.dailyNotes.find(n => n.date === (state.lastDailyReset || today))
    
    const newHistoryEntry = {
      date: state.lastDailyReset || today,
      totalTasks: state.dailyTasks.length,
      completedTasks,
      weeklyGoalsTotal: todayGoals.length,
      weeklyGoalsCompleted: completedGoals.length,
      completedGoalsList: completedGoals.map(g => g.text),
      failedTasksList: failedTasks.map(t => t.text),
      failedGoalsList: failedGoals.map(g => g.text),
      hasNotes: !!todayNote?.note?.trim(),
      dailyNote: todayNote?.note?.trim() || undefined,
    }
    
    saveState({
      dailyHistory: [...state.dailyHistory, newHistoryEntry],
      dailyTasks: [],
      mood: null,
      lastDailyReset: today,
    })
  } else {
    saveState({ lastDailyReset: today })
  }
}

// Get current day name
function getCurrentDayName(): string {
  const DAYS_ID = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
  const today = new Date()
  const dayIndex = today.getDay()
  return dayIndex === 0 ? "Minggu" : DAYS_ID[dayIndex - 1]
}

// Perform weekly reset
export function performWeeklyReset(): void {
  const state = loadState()
  const currentWeekStart = getCurrentWeekStart()
  
  // Save current weekly goals to history
  if (state.weeklyGoals.length > 0) {
    const completed = state.weeklyGoals.filter(g => g.done).length
    const weekLabel = getWeekLabel(new Date(state.lastWeeklyReset || currentWeekStart))
    
    // Calculate end date
    const startDate = new Date(state.lastWeeklyReset || currentWeekStart)
    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + 6)
    const endDateStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`
    
    const newHistoryEntry = {
      weekLabel,
      weekStart: state.lastWeeklyReset || currentWeekStart,
      endDate: endDateStr,
      totalGoals: state.weeklyGoals.length,
      completedGoals: completed,
      notes: state.weeklyNotes,
    }
    
    saveState({
      weeklyHistory: [...state.weeklyHistory, newHistoryEntry],
      weeklyGoals: [],
      unplannedTasks: [],
      weeklyNotes: "",
      lastWeeklyReset: currentWeekStart,
    })
  } else {
    saveState({ lastWeeklyReset: currentWeekStart })
  }
}

function getWeekLabel(date: Date): string {
  const weekNum = Math.ceil(date.getDate() / 7)
  const monthName = date.toLocaleDateString("id-ID", { month: "short" })
  return `Minggu ke-${weekNum}, ${monthName} ${date.getFullYear()}`
}

// ===== DAILY NOTES FUNCTIONS - FIXED =====

/**
 * Save daily note for current date
 * FIXED: Simpan langsung ke state dan update history
 */
export function saveDailyNoteForToday(day: string, note: string): void {
  const state = loadState()
  const today = getTodayDate()
  
  console.log(`[saveDailyNoteForToday] Saving note for ${day} on ${today}:`, note)
  
  // 1. Update dailyNotes array
  const existingNoteIndex = state.dailyNotes.findIndex(
    n => n.date === today && n.day === day
  )
  
  const newNote = {
    date: today,
    day,
    note: note.trim(),
  }
  
  let updatedNotes
  if (existingNoteIndex >= 0) {
    updatedNotes = [...state.dailyNotes]
    updatedNotes[existingNoteIndex] = newNote
  } else {
    updatedNotes = [...state.dailyNotes, newNote]
  }
  
  console.log(`[saveDailyNoteForToday] Updated notes:`, updatedNotes)
  
  // 2. Update dailyHistory with the note
  const todayDayName = getCurrentDayName()
  const historyIndex = state.dailyHistory.findIndex(h => h.date === today)
  let updatedHistory = [...state.dailyHistory]
  
  if (historyIndex >= 0) {
    // Update existing history entry
    updatedHistory[historyIndex] = {
      ...updatedHistory[historyIndex],
      hasNotes: !!note.trim(),
      dailyNote: note.trim() || undefined,
    }
  } else {
    // Create new history entry if it doesn't exist
    const todayGoals = state.weeklyGoals.filter(g => g.day === todayDayName)
    const completedGoals = todayGoals.filter(g => g.done)
    const completedTasks = state.dailyTasks.filter(t => t.done)
    const failedTasks = state.dailyTasks.filter(t => !t.done)
    const failedGoals = todayGoals.filter(g => !g.done)
    
    updatedHistory.push({
      date: today,
      totalTasks: state.dailyTasks.length,
      completedTasks: completedTasks.length,
      weeklyGoalsTotal: todayGoals.length,
      weeklyGoalsCompleted: completedGoals.length,
      completedGoalsList: completedGoals.map(g => g.text),
      failedTasksList: failedTasks.map(t => t.text),
      failedGoalsList: failedGoals.map(g => g.text),
      hasNotes: !!note.trim(),
      dailyNote: note.trim() || undefined,
    })
  }
  
  console.log(`[saveDailyNoteForToday] Updated history:`, updatedHistory)
  
  // 3. Save to localStorage
  saveState({
    dailyNotes: updatedNotes,
    dailyHistory: updatedHistory,
  })
  
  console.log(`[saveDailyNoteForToday] Note saved successfully!`)
}

/**
 * Get daily note for specific date
 */
export function getDailyNoteForDate(date: string, day: string): string {
  const state = loadState()
  const note = state.dailyNotes.find(n => n.date === date && n.day === day)
  return note?.note || ""
}

/**
 * Get daily note for today
 */
export function getTodayNote(day: string): string {
  const today = getTodayDate()
  const state = loadState()
  const note = state.dailyNotes.find(n => n.date === today && n.day === day)
  return note?.note || ""
}