"use client"

import { motion, AnimatePresence } from "framer-motion"
import { RotateCcw } from "lucide-react"
import { GlassCard } from "./glass-card"
import { cn } from "@/lib/utils"
import type { Mood } from "@/lib/store"
import { MOOD_EMOJI } from "@/lib/store"

interface MoodTrackerProps {
  mood: Mood | null
  onMoodChange: (mood: Mood | null) => void
  lastMoodDate: string | null
}

const moods: { key: Mood; label: string }[] = [
  { key: "senang", label: "Senang" },
  { key: "biasa", label: "Biasa" },
  { key: "sedih", label: "Sedih" },
  { key: "marah", label: "Marah" },
  { key: "fokus", label: "Fokus" },
]

export function MoodTracker({ mood, onMoodChange, lastMoodDate }: MoodTrackerProps) {
  const today = new Date().toISOString().split('T')[0]
  const needsReset = lastMoodDate && lastMoodDate !== today
  
  if (needsReset && mood !== null) {
    onMoodChange(null)
  }

  const isSelected = mood !== null

  return (
    <GlassCard className="flex h-full w-full flex-col gap-3 p-4 sm:p-5 md:p-6">
      <div className="flex items-center justify-between">
        <span className="text-xs sm:text-sm font-medium text-muted-foreground">
          Mood Hari Ini
        </span>
        <AnimatePresence>
          {isSelected && (
            <motion.button
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              onClick={() => onMoodChange(null)}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Reset mood"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="relative flex flex-1 items-center justify-center">
        <AnimatePresence mode="wait">
          {!isSelected ? (
            <motion.div
            key="all-moods"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="grid w-full grid-cols-2 gap-1 sm:grid-cols-3 sm:gap-1.5 md:grid-cols-5 md:gap-3"
          >
            {moods.map((m, idx) => (
              <motion.button
                key={m.key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onMoodChange(m.key)}
                className={cn(
                  "group relative flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 transition-all hover:bg-[hsl(187_100%_50%/0.08)] active:bg-[hsl(187_100%_50%/0.12)]",
                  "sm:gap-2 sm:px-3 sm:py-3 md:aspect-square md:gap-2 md:px-3 md:py-4",
                  idx === 4 && "col-span-2 sm:col-span-1"
                )}
                aria-label={`Pilih mood: ${m.label}`}
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan/0 to-cyan/0 opacity-0 transition-opacity group-hover:from-cyan/5 group-hover:to-cyan/10 group-hover:opacity-100" />
                
                <span 
                  className="relative z-10 text-5xl leading-none transition-transform group-hover:scale-110 sm:text-6xl md:text-4xl" 
                  role="img" 
                  aria-hidden="true"
                >
                  {MOOD_EMOJI[m.key]}
                </span>
                <span className="relative z-10 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground sm:text-xs md:text-sm">
                  {m.label}
                </span>
              </motion.button>
            ))}
          </motion.div>
          ) : (
            <motion.div
              key="selected-mood"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ type: "spring", stiffness: 350, damping: 22 }}
              className="flex flex-col items-center gap-2 sm:gap-3"
            >
              <motion.span
                className="text-5xl leading-none sm:text-6xl md:text-7xl lg:text-8xl"
                role="img"
                aria-hidden="true"
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                {MOOD_EMOJI[mood]}
              </motion.span>
              <span className="text-sm font-semibold text-cyan sm:text-base md:text-lg">
                {moods.find((m) => m.key === mood)?.label}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GlassCard>
  )
}