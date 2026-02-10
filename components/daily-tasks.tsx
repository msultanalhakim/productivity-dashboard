"use client"

import { useState } from "react"
import { Trash2, Check } from "lucide-react"
import { GlassCard } from "./glass-card"
import { EmptyState } from "./empty-state"
import { cn } from "@/lib/utils"
import type { DailyTask } from "@/lib/store"

interface DailyTasksProps {
  tasks: DailyTask[]
  onToggle: (id: string) => void
  onAdd: (text: string) => void
  onDelete: (id: string) => void
  hideInput?: boolean // New prop to hide input on dashboard
}

// Sound effect helper
const playSuccessSound = () => {
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
}

export function DailyTasks({ tasks, onToggle, onAdd, onDelete, hideInput = false }: DailyTasksProps) {
  const [newTask, setNewTask] = useState("")
  const [animatingId, setAnimatingId] = useState<string | null>(null)
  const [celebratingId, setCelebratingId] = useState<string | null>(null)
  const [showFullscreenCelebration, setShowFullscreenCelebration] = useState(false)

  const handleToggle = (id: string) => {
    const task = tasks.find((t) => t.id === id)
    if (task && !task.done) {
      setAnimatingId(id)
      setCelebratingId(id)
      setShowFullscreenCelebration(true)
      playSuccessSound()
      setTimeout(() => {
        setAnimatingId(null)
        setCelebratingId(null)
        setShowFullscreenCelebration(false)
      }, 1500)
    }
    onToggle(id)
  }

  const handleAdd = () => {
    if (!newTask.trim()) return
    onAdd(newTask.trim())
    setNewTask("")
  }

  const done = tasks.filter((t) => t.done).length
  const total = tasks.length

  return (
    <>
      <GlassCard glowColor="cyan" className="flex h-full w-full flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Tugas Harian</h2>
          {total > 0 && (
            <span className="rounded-full bg-[hsl(187_100%_50%/0.1)] px-2.5 py-0.5 text-xs font-semibold text-cyan">
              {done}/{total}
            </span>
          )}
        </div>

        {/* Add Task Input - only show if hideInput is false */}
        {!hideInput && (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Tambah tugas baru..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-cyan"
            />
            <button
              onClick={handleAdd}
              className="flex items-center justify-center rounded-xl bg-[hsl(187_100%_50%/0.15)] px-3 text-cyan transition-colors hover:bg-[hsl(187_100%_50%/0.25)]"
              aria-label="Tambah tugas"
            >
              <Check className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Task List */}
        <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
          {tasks.length === 0 ? (
            <EmptyState variant="tugas" />
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  "group relative flex items-center justify-between rounded-xl px-3 py-2.5 transition-all duration-200",
                  task.done ? "bg-[hsl(145_100%_50%/0.05)]" : "bg-secondary/50",
                  animatingId === task.id && "animate-pop-check",
                  celebratingId === task.id && "animate-celebration"
                )}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggle(task.id)}
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-md border transition-all duration-200",
                      task.done
                        ? "border-neon bg-[hsl(145_100%_50%/0.2)]"
                        : "border-muted-foreground/30 hover:border-cyan"
                    )}
                    aria-label={task.done ? "Tandai belum selesai" : "Tandai selesai"}
                  >
                    {task.done && <Check className="h-3 w-3 text-neon" />}
                  </button>
                  <span
                    className={cn(
                      "text-sm transition-all duration-200",
                      task.done
                        ? "text-muted-foreground line-through"
                        : "text-foreground"
                    )}
                  >
                    {task.text}
                  </span>
                </div>
                <button
                  onClick={() => onDelete(task.id)}
                  className="rounded-md p-1 text-muted-foreground opacity-0 transition-all hover:text-crimson group-hover:opacity-100"
                  aria-label={`Hapus ${task.text}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </GlassCard>

      {/* Fullscreen Celebration Overlay */}
      {showFullscreenCelebration && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="flex flex-col items-center gap-6">
            <span className="animate-celebration-bounce text-[180px] drop-shadow-2xl">🎉</span>
            <span className="animate-fade-in text-3xl font-bold text-white drop-shadow-lg">
              Tugas Selesai!
            </span>
          </div>
        </div>
      )}
    </>
  )
}