"use client"

import React from "react"

import { cn } from "@/lib/utils"

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  glowColor?: "cyan" | "neon" | "crimson" | "none"
}

export function GlassCard({
  children,
  className,
  glowColor = "none",
}: GlassCardProps) {
  const glowClasses = {
    cyan: "border-[hsl(var(--cyan))]/25 glow-cyan",
    neon: "border-[hsl(var(--neon))]/25 glow-neon",
    crimson: "border-[hsl(var(--crimson))]/25 glow-crimson",
    none: "border-[hsl(var(--border))]",
  }

  return (
    <div
      className={cn(
        "rounded-2xl border bg-[hsl(var(--card))]/60 p-5 backdrop-blur-md transition-all duration-300",
        glowClasses[glowColor],
        className
      )}
    >
      {children}
    </div>
  )
}