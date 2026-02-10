"use client"

import { GlassCard } from "./glass-card"

interface ProgressRingProps {
  label: string
  value: number
  max: number
  color: "cyan" | "neon" | "crimson"
}

const COLOR_MAP = {
  cyan: "hsl(var(--cyan))",
  neon: "hsl(var(--neon))",
  crimson: "hsl(var(--crimson))",
}

const GLOW_MAP = {
  cyan: "0 0 20px hsl(var(--cyan) / 0.3)",
  neon: "0 0 20px hsl(var(--neon) / 0.3)",
  crimson: "0 0 20px hsl(var(--crimson) / 0.3)",
}

const TRACK_COLOR = "hsl(var(--muted))"

export function ProgressRing({ label, value, max, color }: ProgressRingProps) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const radius = 45
  const strokeWidth = 8
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-2 md:gap-3">
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 120 120"
          className="-rotate-90"
          aria-label={`${label}: ${Math.round(pct)}%`}
        >
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={COLOR_MAP[color]}
            strokeWidth={strokeWidth + 2}
            opacity="0.1"
            strokeLinecap="round"
          />
          
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={TRACK_COLOR}
            strokeWidth={strokeWidth}
          />
          
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={COLOR_MAP[color]}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ 
              transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
              filter: `drop-shadow(${GLOW_MAP[color]})`
            }}
          />
        </svg>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <span 
            className="text-lg sm:text-xl md:text-2xl font-bold"
            style={{ color: COLOR_MAP[color] }}
          >
            {Math.round(pct)}%
          </span>
        </div>
      </div>
      
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-xs sm:text-sm font-medium text-muted-foreground">{label}</span>
        <span className="text-[10px] sm:text-xs text-muted-foreground/70">
          {value} dari {max}
        </span>
      </div>
    </div>
  )
}

interface DailyProgressProps {
  tasksTotal: number
  tasksDone: number
  goalsTotal: number
  goalsDone: number
}

export function DailyProgress({
  tasksTotal,
  tasksDone,
  goalsTotal,
  goalsDone,
}: DailyProgressProps) {
  return (
    <GlassCard className="flex h-full w-full flex-col gap-4 p-4 sm:p-5 md:p-6">
      <div className="flex items-center gap-2">
        <div className="h-1 w-1 rounded-full bg-cyan"></div>
        <span className="text-xs sm:text-sm font-semibold text-foreground">
          Progress Harian
        </span>
      </div>
      <div className="flex flex-1 items-center justify-around gap-3 sm:gap-6 md:gap-8">
        <ProgressRing
          label="Tugas"
          value={tasksDone}
          max={tasksTotal}
          color="cyan"
        />
        <ProgressRing
          label="Goals"
          value={goalsDone}
          max={goalsTotal}
          color="neon"
        />
      </div>
    </GlassCard>
  )
}