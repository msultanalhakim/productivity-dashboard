"use client"

import { useState, useEffect } from "react"
import { Plus, Check, Trash2, X, Save } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { GlassCard } from "./glass-card"
import { ConfirmModal } from "./confirm-modal"
import { cn } from "@/lib/utils"
import { DAYS_ID, generateId, type WeeklyGoal } from "@/lib/store"

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

interface WeeklyGoalsProps {
  goals: WeeklyGoal[]
  onAddGoal: (day: string, text: string) => void
  onToggleGoal: (id: string) => void
  onDeleteGoal: (id: string) => void
  weeklyHistory?: WeeklyRecord[]
  dailyNotes?: DailyNote[]
  onSaveDailyNote?: (day: string, note: string) => void
}

// Sound effect helper
const playSuccessSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime)
    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1)
    oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2)
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  } catch (error) {
    // Silent fail if audio context not available
  }
}

// Get today's date string helper
const getTodayDateString = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function WeeklyGoals({
  goals,
  onAddGoal,
  onToggleGoal,
  onDeleteGoal,
  dailyNotes = [],
  onSaveDailyNote,
}: WeeklyGoalsProps) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [newGoalText, setNewGoalText] = useState("")
  const [dailyNote, setDailyNote] = useState("")
  const [isNoteLoaded, setIsNoteLoaded] = useState(false)
  const [celebratingId, setCelebratingId] = useState<string | null>(null)
  const [showFullscreenCelebration, setShowFullscreenCelebration] = useState(false)
  const [showSaveNotification, setShowSaveNotification] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // ⭐ NEW: Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; goalId: string; goalText: string }>({
    isOpen: false,
    goalId: "",
    goalText: "",
  })

  const today = new Date()
  const dayIndex = today.getDay()
  const todayId = dayIndex === 0 ? "Minggu" : DAYS_ID[dayIndex - 1]

  // Check if selected day is today
  const isSelectedDayToday = selectedDay === todayId
  
  // Check if selected day has passed (is in the past)
  const isDayPassed = (day: string) => {
    if (day === todayId) return false
    
    const dayOrder = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
    const todayIndex = dayOrder.indexOf(todayId)
    const selectedIndex = dayOrder.indexOf(day)
    
    if (todayIndex === -1 || selectedIndex === -1) return false
    
    return selectedIndex < todayIndex
  }
  
  const isSelectedDayPassed = selectedDay ? isDayPassed(selectedDay) : false

  // Load existing note HANYA saat modal dibuka
  useEffect(() => {
    if (selectedDay && !isNoteLoaded) {
      const todayDate = getTodayDateString()
      const existingNote = dailyNotes.find(n => n.date === todayDate && n.day === selectedDay)
      setDailyNote(existingNote?.note || "")
      setIsNoteLoaded(true)
    }
    
    if (!selectedDay) {
      setDailyNote("")
      setIsNoteLoaded(false)
    }
  }, [selectedDay, dailyNotes])

  const handleToggleGoal = (id: string) => {
    const goal = goals.find((g) => g.id === id)
    if (goal && !goal.done) {
      setCelebratingId(id)
      setShowFullscreenCelebration(true)
      playSuccessSound()
      setTimeout(() => {
        setCelebratingId(null)
        setShowFullscreenCelebration(false)
      }, 1500)
    }
    onToggleGoal(id)
  }

  const handleAddGoal = () => {
    if (!newGoalText.trim() || !selectedDay || isSelectedDayPassed) return
    onAddGoal(selectedDay, newGoalText.trim())
    setNewGoalText("")
  }

  const handleSaveNote = async () => {
    if (!selectedDay || !onSaveDailyNote) return
    
    setIsSaving(true)
    
    try {
      await onSaveDailyNote(selectedDay, dailyNote.trim())
      playSuccessSound()
      setShowSaveNotification(true)
      setTimeout(() => setShowSaveNotification(false), 3000)
    } catch (error) {
      console.error("Error saving note:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleOpenModal = (day: string) => {
    setSelectedDay(day)
    setNewGoalText("")
    setIsNoteLoaded(false)
  }

  const handleCloseModal = () => {
    setSelectedDay(null)
    setNewGoalText("")
    setDailyNote("")
    setIsNoteLoaded(false)
  }

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDailyNote(e.target.value)
  }
  
  // ⭐ NEW: Show delete confirmation
  const handleDeleteClick = (goal: WeeklyGoal) => {
    setDeleteConfirm({
      isOpen: true,
      goalId: goal.id,
      goalText: goal.text,
    })
  }

  // ⭐ NEW: Confirm delete
  const handleDeleteConfirm = () => {
    onDeleteGoal(deleteConfirm.goalId)
    setDeleteConfirm({ isOpen: false, goalId: "", goalText: "" })
  }

  return (
    <>
      <GlassCard className="flex h-full w-full flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-neon"></div>
          <h2 className="text-base font-semibold text-foreground">Goals Mingguan</h2>
        </div>

        {/* All Days Grid - Always visible */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {DAYS_ID.map((day) => {
            const dayGoals = goals.filter((g) => g.day === day)
            const totalCount = dayGoals.length
            const completedCount = dayGoals.filter(g => g.done).length
            const isToday = day === todayId
            const previewGoals = dayGoals.slice(0, 2)
            const hasMore = dayGoals.length > 2
            
            return (
              <motion.button
                key={day}
                onClick={() => handleOpenModal(day)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "group relative flex flex-col gap-2 rounded-xl border-2 p-3 text-left transition-all",
                  isToday
                    ? "border-neon bg-neon/5 shadow-[0_0_15px_rgba(145,255,145,0.15)]"
                    : "border-border bg-secondary/30 hover:border-neon/40 hover:bg-secondary/50"
                )}
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "text-sm font-semibold",
                    isToday ? "text-neon" : "text-foreground"
                  )}>
                    {day}
                  </span>
                  {isToday && (
                    <span className="rounded-full bg-neon px-2 py-0.5 text-[10px] font-bold text-background">
                      Hari Ini
                    </span>
                  )}
                </div>

                {/* Progress */}
                {totalCount > 0 ? (
                  <>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className={cn(
                          "font-semibold",
                          completedCount === totalCount ? "text-neon" : "text-muted-foreground"
                        )}>
                          {completedCount}/{totalCount}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-background/50">
                        <div 
                          className={cn(
                            "h-full transition-all duration-300",
                            completedCount === totalCount ? "bg-neon" : "bg-cyan"
                          )}
                          style={{ width: `${(completedCount / totalCount) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Goal preview */}
                    <div className="space-y-1">
                      {previewGoals.map((goal) => (
                        <div key={goal.id} className="flex items-start gap-1.5">
                          <div className={cn(
                            "mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full",
                            goal.done ? "bg-neon" : "bg-muted-foreground/40"
                          )} />
                          <span className={cn(
                            "text-xs leading-tight line-clamp-1",
                            goal.done ? "text-muted-foreground line-through" : "text-foreground/80"
                          )}>
                            {goal.text}
                          </span>
                        </div>
                      ))}
                      {hasMore && (
                        <p className="text-[10px] text-muted-foreground/60 pl-3">
                          +{dayGoals.length - 2} goal lainnya
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground/60">
                    Belum ada goal
                  </p>
                )}
                
                {/* Hover indicator */}
                <div className={cn(
                  "absolute bottom-2 right-2 text-[10px] font-medium transition-opacity",
                  isToday ? "text-neon" : "text-cyan",
                  "opacity-0 group-hover:opacity-100"
                )}>
                  Klik untuk buka →
                </div>
              </motion.button>
            )
          })}
        </div>
      </GlassCard>

      {/* Modal */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[95] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="flex w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl max-h-[85vh]"
            >
              {/* Header */}
              <div className="border-b border-border px-6 py-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      selectedDay === todayId
                        ? "bg-neon/10"
                        : "bg-secondary"
                    )}>
                      <Check className={cn(
                        "h-5 w-5",
                        selectedDay === todayId ? "text-neon" : "text-foreground"
                      )} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        Goals untuk {selectedDay}
                        {selectedDay === todayId && (
                          <span className="rounded-full bg-neon px-2 py-0.5 text-[10px] font-bold text-background">
                            Hari Ini
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {goals.filter((g) => g.day === selectedDay).length} goal total
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {/* Goals List */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Daftar Goals
                  </label>
                  <div className="space-y-2">
                    {goals
                      .filter((g) => g.day === selectedDay)
                      .map((g) => (
                        <div
                          key={g.id}
                          className={cn(
                            "flex items-center gap-3 rounded-lg border-2 p-3.5 transition-all",
                            g.done
                              ? "border-neon/30 bg-neon/5"
                              : isSelectedDayPassed
                                ? "border-border/50 bg-secondary/20"
                                : "border-border bg-secondary/40 hover:border-cyan/40"
                          )}
                        >
                          <button
                            onClick={() => handleToggleGoal(g.id)}
                            disabled={isSelectedDayPassed}
                            className={cn(
                              "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all",
                              g.done
                                ? "border-neon bg-neon/10"
                                : isSelectedDayPassed
                                  ? "border-muted-foreground/20 bg-muted-foreground/5 cursor-not-allowed"
                                  : "border-muted-foreground/30 hover:border-cyan hover:bg-cyan/5"
                            )}
                          >
                            {g.done && <Check className="h-3.5 w-3.5 text-neon" />}
                          </button>
                          <span
                            className={cn(
                              "flex-1 text-sm leading-relaxed",
                              g.done
                                ? "text-muted-foreground line-through"
                                : isSelectedDayPassed
                                  ? "text-muted-foreground/60"
                                  : "text-foreground"
                            )}
                          >
                            {g.text}
                          </span>
                          <button
                            onClick={() => handleDeleteClick(g)}
                            disabled={isSelectedDayPassed}
                            className={cn(
                              "rounded-lg p-1.5 transition-all",
                              isSelectedDayPassed
                                ? "text-muted-foreground/30 cursor-not-allowed"
                                : "text-muted-foreground hover:bg-crimson/10 hover:text-crimson"
                            )}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    
                    {/* Inline Add Goal - Conditional */}
                    {!isSelectedDayPassed && (
                      <div className="flex items-center gap-3 rounded-lg border-2 border-dashed border-border/60 bg-secondary/20 p-3.5 transition-all hover:border-neon/40 hover:bg-secondary/30">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-neon/40 bg-neon/5">
                          <Plus className="h-3.5 w-3.5 text-neon" />
                        </div>
                        <input
                          type="text"
                          placeholder="Ketik goal baru dan tekan Enter..."
                          value={newGoalText}
                          onChange={(e) => setNewGoalText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddGoal()
                            if (e.key === "Escape") setNewGoalText("")
                          }}
                          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                        />
                        {newGoalText.trim() && (
                          <button
                            onClick={handleAddGoal}
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-neon transition-all hover:bg-neon/90"
                          >
                            <Plus className="h-4 w-4 text-background" />
                          </button>
                        )}
                      </div>
                    )}
                    
                    {/* Pesan jika hari sudah lewat */}
                    {isSelectedDayPassed && (
                      <div className="rounded-lg bg-muted-foreground/5 border border-muted-foreground/10 p-4 text-center">
                        <p className="text-sm text-muted-foreground/70">
                          Hari ini sudah berlalu. Goal tidak dapat ditambahkan atau diubah.
                        </p>
                      </div>
                    )}
                    
                    {goals.filter((g) => g.day === selectedDay).length === 0 && !isSelectedDayPassed && (
                      <div className="rounded-lg bg-secondary/30 p-6 text-center">
                        <p className="text-sm text-muted-foreground">
                          Belum ada goal. Ketik di atas untuk menambahkan!
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Daily Note - Conditional based on isSelectedDayToday */}
                <div className="space-y-2 border-t border-border/50 pt-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-muted-foreground">
                      {isSelectedDayToday ? "Catatan Hari Ini" : "Catatan"}
                    </label>
                    {isSelectedDayToday && (
                      <button
                        onClick={handleSaveNote}
                        disabled={isSaving}
                        className={cn(
                          "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                          isSaving
                            ? "bg-cyan/5 text-cyan/50 cursor-not-allowed"
                            : "bg-cyan/10 text-cyan hover:bg-cyan/20"
                        )}
                      >
                        <Save className="h-3 w-3" />
                        {isSaving ? "Menyimpan..." : "Simpan"}
                      </button>
                    )}
                  </div>
                  
                  {isSelectedDayToday ? (
                    <>
                      <textarea
                        placeholder="Tulis catatan singkat untuk hari ini..."
                        value={dailyNote}
                        onChange={handleNoteChange}
                        rows={3}
                        disabled={isSaving}
                        className="w-full resize-none rounded-lg border border-border/50 bg-background/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 transition-colors focus:border-cyan/50 focus:outline-none focus:ring-1 focus:ring-cyan/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <p className="text-[10px] text-muted-foreground/60">
                        Catatan akan tersimpan untuk tanggal {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </>
                  ) : (
                    <div className="rounded-lg border border-border/30 bg-secondary/20 px-3 py-3">
                      {dailyNote ? (
                        <div className="space-y-1">
                          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                            {dailyNote}
                          </p>
                          <p className="text-[10px] text-muted-foreground/60">
                            Catatan hanya bisa ditulis di hari yang sama
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-2 text-center">
                          <p className="text-xs text-muted-foreground/70">
                            Tidak ada catatan untuk hari ini
                          </p>
                          <p className="text-[10px] text-muted-foreground/50 mt-1">
                            Catatan hanya bisa ditulis di hari {todayId}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-border px-6 py-3.5 flex-shrink-0">
                <button
                  onClick={handleCloseModal}
                  className="w-full rounded-lg bg-secondary/50 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Notification */}
      <AnimatePresence>
        {showSaveNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="fixed top-4 right-4 z-[100] flex items-center gap-3 rounded-lg bg-gradient-to-r from-cyan to-cyan/90 px-4 py-3 shadow-2xl"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
              <Check className="h-4 w-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white">Catatan berhasil disimpan!</span>
              <span className="text-xs text-white/80">Tersimpan untuk {selectedDay}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Celebration */}
      {showFullscreenCelebration && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="flex flex-col items-center gap-6">
            <span className="animate-celebration-bounce text-[180px] drop-shadow-2xl">🎉</span>
            <span className="animate-fade-in text-3xl font-bold text-white drop-shadow-lg">
              Goal Selesai!
            </span>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, goalId: "", goalText: "" })}
        onConfirm={handleDeleteConfirm}
        title="Hapus Goal?"
        description={`Apakah Anda yakin ingin menghapus goal "${deleteConfirm.goalText}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
      />
    </>
  )
}