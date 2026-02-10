import type { AppState } from "./store"
import { supabase } from "./supabase"

const SESSION_KEY = "command-center-session"
const IDLE_TIMEOUT = 60 * 40 * 1000 // 40 minutes in milliseconds

const FIXED_DB_ID = "dashboard"

export const DEFAULT_STATE: AppState = {
  mood: null,
  lastMoodDate: null,
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
  password: "sultan",
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

// ===== SUPABASE DATABASE STORAGE =====

// In-memory cache untuk menghindari multiple calls
let stateCache: AppState | null = null
let lastFetch: number = 0
const CACHE_DURATION = 1000 // 1 second cache

/**
 * Load state dari Supabase
 * Returns Promise<AppState>
 */
export async function loadState(): Promise<AppState> {
  if (typeof window === "undefined") return DEFAULT_STATE

  // Return cache if still fresh
  if (stateCache && Date.now() - lastFetch < CACHE_DURATION) {
    return stateCache
  }

  try {
    const { data, error } = await supabase
      .from('app_state')
      .select('data')
      .eq('user_id', FIXED_DB_ID)
      .maybeSingle()

    if (!error && data && data.data) {
      const state = { ...DEFAULT_STATE, ...data.data } as AppState
      stateCache = state
      lastFetch = Date.now()
      return state
    }

    // Jika belum ada data, return default
    if (error?.code === 'PGRST116') {
      // No rows found - first time user
      stateCache = DEFAULT_STATE
      lastFetch = Date.now()
      return DEFAULT_STATE
    }

    console.error("Error loading from Supabase:", error)
    return DEFAULT_STATE
  } catch (error) {
    console.error("Error loading state:", error)
    return DEFAULT_STATE
  }
}

/**
 * Save state ke Supabase
 * Returns Promise<void>
 */
export async function saveState(state: Partial<AppState>): Promise<void> {
  if (typeof window === "undefined") return

  try {
    // Load current state from cache or database
    const current = stateCache || await loadState()
    const updated = { ...current, ...state }
    
    // Update cache immediately
    stateCache = updated
    lastFetch = Date.now()
  
    const { error } = await supabase
      .from('app_state')
      .upsert({
        user_id: FIXED_DB_ID,
        data: updated as any,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      console.error("Error saving to Supabase:", error)
      throw error
    }
  } catch (error) {
    console.error("Error saving state:", error)
    throw error
  }
}

/**
 * Clear cache (berguna untuk force refresh)
 */
export function clearCache(): void {
  stateCache = null
  lastFetch = 0
}

// ===== PASSWORD FUNCTIONS =====

/**
 * Verify password
 */
export async function verifyPassword(inputPassword: string): Promise<boolean> {
  const state = await loadState()
  return state.password === inputPassword
}

/**
 * Update password
 */
export async function updatePassword(newPassword: string): Promise<void> {
  await saveState({ password: newPassword })
}

// ===== DATE HELPERS =====

/**
 * Helper: Get today's date in local timezone
 */
function getTodayDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Helper: Get current week start in local timezone
 */
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

/**
 * Get current day name
 */
function getCurrentDayName(): string {
  const DAYS_ID = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
  const today = new Date()
  const dayIndex = today.getDay()
  return dayIndex === 0 ? "Minggu" : DAYS_ID[dayIndex - 1]
}

/**
 * Get week label
 */
function getWeekLabel(date: Date): string {
  const weekNum = Math.ceil(date.getDate() / 7)
  const monthName = date.toLocaleDateString("id-ID", { month: "short" })
  return `Minggu ke-${weekNum}, ${monthName} ${date.getFullYear()}`
}

// ===== RESET FUNCTIONS =====

/**
 * Check if needs daily reset
 */
export async function needsDailyReset(): Promise<boolean> {
  const state = await loadState()
  const today = getTodayDate()
  return state.lastDailyReset !== today
}

/**
 * Check if needs weekly reset
 */
export async function needsWeeklyReset(): Promise<boolean> {
  const state = await loadState()
  const currentWeekStart = getCurrentWeekStart()
  return state.lastWeeklyReset !== currentWeekStart
}

/**
 * Perform daily reset
 */
export async function performDailyReset(): Promise<void> {
  const state = await loadState()
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
    
    await saveState({
      dailyHistory: [...state.dailyHistory, newHistoryEntry],
      dailyTasks: [],
      mood: null,
      lastDailyReset: today,
    })
  } else {
    await saveState({ lastDailyReset: today })
  }
}

/**
 * Perform weekly reset
 */
export async function performWeeklyReset(): Promise<void> {
  const state = await loadState()
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
    
    await saveState({
      weeklyHistory: [...state.weeklyHistory, newHistoryEntry],
      weeklyGoals: [],
      unplannedTasks: [],
      weeklyNotes: "",
      lastWeeklyReset: currentWeekStart,
    })
  } else {
    await saveState({ lastWeeklyReset: currentWeekStart })
  }
}

// ===== DAILY NOTES FUNCTIONS =====

/**
 * Save daily note for current date
 */
export async function saveDailyNoteForToday(day: string, note: string): Promise<void> {
  const state = await loadState()
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
  
  // 3. Save to database
  await saveState({
    dailyNotes: updatedNotes,
    dailyHistory: updatedHistory,
  })
  
  console.log(`[saveDailyNoteForToday] Note saved successfully to Supabase!`)
}

/**
 * Get daily note for specific date
 */
export async function getDailyNoteForDate(date: string, day: string): Promise<string> {
  const state = await loadState()
  const note = state.dailyNotes.find(n => n.date === date && n.day === day)
  return note?.note || ""
}

/**
 * Get daily note for today
 */
export async function getTodayNote(day: string): Promise<string> {
  const today = getTodayDate()
  const state = await loadState()
  const note = state.dailyNotes.find(n => n.date === today && n.day === day)
  return note?.note || ""
}