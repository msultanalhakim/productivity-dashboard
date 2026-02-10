import type { AppState } from "./store"
import { supabase } from "./supabase"
import { 
  DAYS_ID, 
  getDayNameFromDate, 
} from "./store"

const FIXED_DB_ID = "dashboard"
const AUTH_KEY = "command-center-authenticated"

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

// ===== SIMPLE AUTHENTICATION (NO SESSION MANAGEMENT) =====

/**
 * Check if user is authenticated (logged in)
 */
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(AUTH_KEY) === "true"
}

/**
 * Mark user as authenticated
 */
export function setAuthenticated(value: boolean): void {
  if (typeof window === "undefined") return
  if (value) {
    localStorage.setItem(AUTH_KEY, "true")
    console.log("[Auth] User authenticated")
  } else {
    localStorage.removeItem(AUTH_KEY)
    console.log("[Auth] User logged out")
  }
}

/**
 * Clear authentication (logout)
 */
export function logout(): void {
  setAuthenticated(false)
}

// ===== SUPABASE DATABASE STORAGE =====

// In-memory cache
let stateCache: AppState | null = null
let lastFetch: number = 0
const CACHE_DURATION = 1000 // 1 second

/**
 * Load state from Supabase
 * Always tries to load data, regardless of auth status
 */
export async function loadState(): Promise<AppState> {
  if (typeof window === "undefined") return DEFAULT_STATE

  // Return cache if fresh
  if (stateCache && Date.now() - lastFetch < CACHE_DURATION) {
    console.log("[Storage] Returning cached state")
    return stateCache
  }

  try {
    console.log("[Storage] Fetching state from Supabase...")
    
    const { data, error } = await supabase
      .from('app_state')
      .select('data')
      .eq('user_id', FIXED_DB_ID)
      .maybeSingle()

    if (!error && data && data.data) {
      const state = { ...DEFAULT_STATE, ...data.data } as AppState
      stateCache = state
      lastFetch = Date.now()
      console.log("[Storage] ✅ Successfully loaded state from Supabase")
      return state
    }

    // No data found - first time user
    if (error?.code === 'PGRST116') {
      stateCache = DEFAULT_STATE
      lastFetch = Date.now()
      console.log("[Storage] No data in Supabase, using default state")
      return DEFAULT_STATE
    }

    console.error("[Storage] ❌ Error loading from Supabase:", error)
    return DEFAULT_STATE
    
  } catch (error) {
    console.error("[Storage] ❌ Exception loading state:", error)
    return DEFAULT_STATE
  }
}

/**
 * Save state to Supabase
 */
export async function saveState(state: Partial<AppState>): Promise<void> {
  if (typeof window === "undefined") return

  try {
    // Load current state
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
      console.error("[Storage] ❌ Error saving to Supabase:", error)
      throw error
    }
    
    console.log("[Storage] ✅ State saved to Supabase")
    
  } catch (error) {
    console.error("[Storage] ❌ Exception saving state:", error)
    throw error
  }
}

/**
 * Clear cache (force refresh)
 */
export function clearCache(): void {
  stateCache = null
  lastFetch = 0
  console.log("[Storage] Cache cleared")
}

// ===== PASSWORD FUNCTIONS =====

/**
 * Verify password
 */
export async function verifyPassword(inputPassword: string): Promise<boolean> {
  const state = await loadState()
  const isValid = state.password === inputPassword
  console.log("[Auth] Password verification:", isValid ? "✅ Success" : "❌ Failed")
  return isValid
}

/**
 * Update password
 */
export async function updatePassword(newPassword: string): Promise<void> {
  await saveState({ password: newPassword })
  console.log("[Auth] Password updated")
}

// ===== DATE HELPERS =====

function getTodayDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

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

function getCurrentDayName(): string {
  const today = new Date()
  const dayIndex = today.getDay()
  return dayIndex === 0 ? "Minggu" : DAYS_ID[dayIndex - 1]
}

function getWeekLabel(date: Date): string {
  const weekNum = Math.ceil(date.getDate() / 7)
  const monthName = date.toLocaleDateString("id-ID", { month: "short" })
  return `Minggu ke-${weekNum}, ${monthName} ${date.getFullYear()}`
}

// ===== RESET FUNCTIONS =====

export async function needsDailyReset(): Promise<boolean> {
  const state = await loadState()
  const today = getTodayDate()
  const needs = state.lastDailyReset !== today
  if (needs) {
    console.log("[Reset] Daily reset needed. Last reset:", state.lastDailyReset, "Today:", today)
  }
  return needs
}

export async function needsWeeklyReset(): Promise<boolean> {
  const state = await loadState()
  const currentWeekStart = getCurrentWeekStart()
  const needs = state.lastWeeklyReset !== currentWeekStart
  if (needs) {
    console.log("[Reset] Weekly reset needed. Last reset:", state.lastWeeklyReset, "Current week:", currentWeekStart)
  }
  return needs
}

export async function performDailyReset(): Promise<void> {
  const state = await loadState()
  const today = getTodayDate()
  
  console.log("[Reset] Performing daily reset...")
  
  if (state.dailyTasks.length > 0 || state.weeklyGoals.length > 0) {
    const completedTasks = state.dailyTasks.filter(t => t.done).length
    const failedTasks = state.dailyTasks.filter(t => !t.done)
    
    const resetDate = state.lastDailyReset || today
    const dayName = getDayNameFromDate(resetDate)
    
    const dayGoals = state.weeklyGoals.filter(g => g.day === dayName)
    const completedGoals = dayGoals.filter(g => g.done)
    const failedGoals = dayGoals.filter(g => !g.done)
    
    const yesterdayNote = state.dailyNotes.find(n => n.date === resetDate)
    
    const newHistoryEntry = {
      date: resetDate,
      totalTasks: state.dailyTasks.length,
      completedTasks,
      weeklyGoalsTotal: dayGoals.length,
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
    
    console.log("[Reset] ✅ Daily reset completed for:", resetDate)
  } else {
    await saveState({ lastDailyReset: today })
    console.log("[Reset] ✅ Daily reset completed (no tasks/goals)")
  }
}

export async function performWeeklyReset(): Promise<void> {
  const state = await loadState()
  const currentWeekStart = getCurrentWeekStart()
  
  console.log("[Reset] Performing weekly reset...")
  
  if (state.weeklyGoals.length > 0) {
    const completed = state.weeklyGoals.filter(g => g.done).length
    const weekLabel = getWeekLabel(new Date(state.lastWeeklyReset || currentWeekStart))
    
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
    
    console.log("[Reset] ✅ Weekly reset completed for:", weekLabel)
  } else {
    await saveState({ lastWeeklyReset: currentWeekStart })
    console.log("[Reset] ✅ Weekly reset completed (no goals)")
  }
}

// ===== DAILY NOTES FUNCTIONS =====

export async function saveDailyNoteForToday(day: string, note: string): Promise<void> {
  const state = await loadState()
  const today = getTodayDate()
  
  console.log(`[Notes] Saving note for ${day} on ${today}`)
  
  const existingNoteIndex = state.dailyNotes.findIndex(
    n => n.date === today && n.day === day
  )
  
  let updatedNotes
  if (!note.trim()) {
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
  
  const todayDayName = getCurrentDayName()
  const historyIndex = state.dailyHistory.findIndex(h => h.date === today)
  let updatedHistory = [...state.dailyHistory]
  
  const todayGoals = state.weeklyGoals.filter(g => g.day === todayDayName)
  const completedGoals = todayGoals.filter(g => g.done)
  const completedTasks = state.dailyTasks.filter(t => t.done)
  const failedTasks = state.dailyTasks.filter(t => !t.done)
  const failedGoals = todayGoals.filter(g => !g.done)
  
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
  
  await saveState({
    dailyNotes: updatedNotes,
    dailyHistory: updatedHistory,
  })
  
  console.log("[Notes] ✅ Note saved successfully")
}

export async function getDailyNoteForDate(date: string, day: string): Promise<string> {
  const state = await loadState()
  const note = state.dailyNotes.find(n => n.date === date && n.day === day)
  return note?.note || ""
}

export async function getTodayNote(day: string): Promise<string> {
  const today = getTodayDate()
  const state = await loadState()
  const note = state.dailyNotes.find(n => n.date === today && n.day === day)
  return note?.note || ""
}