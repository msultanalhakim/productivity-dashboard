import type { AppState } from "./store"
import { supabase } from "./supabase"
import { 
  DAYS_ID, 
  getDayNameFromDate, 
  recalculateWeeklyGoalsInHistory 
} from "./store"

const SESSION_KEY = "command-center-session"
const LAST_ACTIVITY_KEY = "command-center-activity"
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
  // FIXED: Use localStorage instead of sessionStorage so it persists across tabs and browser sessions
  return localStorage.getItem(SESSION_KEY)
}

// Create new session
export function createSession(): string {
  if (typeof window === "undefined") return ""
  const sessionId = generateSessionId()
  // FIXED: Store in localStorage so it persists
  localStorage.setItem(SESSION_KEY, sessionId)
  localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString())
  console.log("[createSession] New session created:", sessionId)
  return sessionId
}

// Check if session is valid
export function isSessionValid(): boolean {
  if (typeof window === "undefined") return false
  
  const sessionId = getCurrentSessionId()
  if (!sessionId) {
    console.log("[isSessionValid] No session ID found")
    return false
  }

  const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY)
  if (!lastActivity) {
    console.log("[isSessionValid] No last activity found")
    return false
  }

  const timeSinceActivity = Date.now() - parseInt(lastActivity)
  const isValid = timeSinceActivity < IDLE_TIMEOUT
  
  if (!isValid) {
    console.log("[isSessionValid] Session expired. Idle for:", Math.floor(timeSinceActivity / 1000 / 60), "minutes")
  }
  
  return isValid
}

// Update last activity
export function updateActivity(): void {
  if (typeof window === "undefined") return
  localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString())
}

// Clear session (only called on manual logout, not on idle timeout)
export function clearSession(): void {
  if (typeof window === "undefined") return
  console.log("[clearSession] Clearing session (manual logout)")
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(LAST_ACTIVITY_KEY)
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
      console.log("[loadState] Loaded state from Supabase")
      return state
    }

    // Jika belum ada data, return default
    if (error?.code === 'PGRST116') {
      // No rows found - first time user
      stateCache = DEFAULT_STATE
      lastFetch = Date.now()
      console.log("[loadState] No data found, using default state")
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
    
    console.log("[saveState] State saved to Supabase successfully")
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
  console.log("[clearCache] Cache cleared")
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
 * IMPROVED: Better handling of daily history
 */
export async function performDailyReset(): Promise<void> {
  const state = await loadState()
  const today = getTodayDate()
  
  // Save current tasks to history
  if (state.dailyTasks.length > 0 || state.weeklyGoals.length > 0) {
    const completedTasks = state.dailyTasks.filter(t => t.done).length
    const failedTasks = state.dailyTasks.filter(t => !t.done)
    
    // Get yesterday's day name (from lastDailyReset)
    const resetDate = state.lastDailyReset || today
    const dayName = getDayNameFromDate(resetDate)
    
    // CRITICAL FIX: Filter goals yang sesuai dengan hari yang di-reset
    const dayGoals = state.weeklyGoals.filter(g => g.day === dayName)
    const completedGoals = dayGoals.filter(g => g.done)
    const failedGoals = dayGoals.filter(g => !g.done)
    
    // Get yesterday's note if exists
    const yesterdayNote = state.dailyNotes.find(n => n.date === resetDate)
    
    const newHistoryEntry = {
      date: resetDate,
      totalTasks: state.dailyTasks.length,
      completedTasks,
      weeklyGoalsTotal: dayGoals.length, // Hanya goals untuk hari itu
      weeklyGoalsCompleted: completedGoals.length,
      completedGoalsList: completedGoals.map(g => g.text),
      failedTasksList: failedTasks.map(t => t.text),
      failedGoalsList: failedGoals.map(g => g.text),
      hasNotes: !!yesterdayNote?.note?.trim(),
      dailyNote: yesterdayNote?.note?.trim() || undefined,
    }
    
    await saveState({
      dailyHistory: [...state.dailyHistory, newHistoryEntry],
      dailyTasks: [],
      mood: null,
      lastDailyReset: today,
    })
    
    console.log("[performDailyReset] Daily reset completed for:", resetDate)
  } else {
    await saveState({ lastDailyReset: today })
    console.log("[performDailyReset] Daily reset completed (no tasks/goals)")
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
    
    console.log("[performWeeklyReset] Weekly reset completed for:", weekLabel)
  } else {
    await saveState({ lastWeeklyReset: currentWeekStart })
    console.log("[performWeeklyReset] Weekly reset completed (no goals)")
  }
}

// ===== DAILY NOTES FUNCTIONS - IMPROVED =====

/**
 * Save daily note for current date
 * IMPROVED: Also updates daily history immediately
 */
export async function saveDailyNoteForToday(day: string, note: string): Promise<void> {
  const state = await loadState()
  const today = getTodayDate()
  
  console.log(`[saveDailyNoteForToday] Saving note for ${day} on ${today}:`, note)
  
  // 1. Update dailyNotes array
  const existingNoteIndex = state.dailyNotes.findIndex(
    n => n.date === today && n.day === day
  )
  
  let updatedNotes
  if (!note.trim()) {
    // Jika note kosong, hapus
    updatedNotes = state.dailyNotes.filter((_, i) => i !== existingNoteIndex)
  } else {
    const newNote = {
      date: today,
      day,
      note: note.trim(),
    }
    
    if (existingNoteIndex >= 0) {
      updatedNotes = [...state.dailyNotes]
      updatedNotes[existingNoteIndex] = newNote
    } else {
      updatedNotes = [...state.dailyNotes, newNote]
    }
  }
  
  // 2. Update dailyHistory with the note
  const todayDayName = getCurrentDayName()
  const historyIndex = state.dailyHistory.findIndex(h => h.date === today)
  let updatedHistory = [...state.dailyHistory]
  
  // CRITICAL FIX: Filter goals yang sesuai dengan hari ini
  const todayGoals = state.weeklyGoals.filter(g => g.day === todayDayName)
  const completedGoals = todayGoals.filter(g => g.done)
  const completedTasks = state.dailyTasks.filter(t => t.done)
  const failedTasks = state.dailyTasks.filter(t => !t.done)
  const failedGoals = todayGoals.filter(g => !g.done)
  
  // Jika tidak ada tasks, goals, dan note → hapus entry
  if (state.dailyTasks.length === 0 && todayGoals.length === 0 && !note.trim()) {
    updatedHistory = updatedHistory.filter(h => h.date !== today)
  } else {
    const newEntry = {
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
    }
    
    if (historyIndex >= 0) {
      updatedHistory[historyIndex] = newEntry
    } else {
      updatedHistory.push(newEntry)
    }
  }
  
  // 3. Save to database
  await saveState({
    dailyNotes: updatedNotes,
    dailyHistory: updatedHistory,
  })
  
  console.log(`[saveDailyNoteForToday] Note saved successfully!`)
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