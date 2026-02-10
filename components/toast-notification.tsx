"use client"

import React from "react"

import { useState, useCallback, createContext, useContext, useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Check, X, AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

type ToastType = "success" | "error" | "warning" | "info"

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

const ICONS: Record<ToastType, React.ComponentType<{ className?: string }>> = {
  success: Check,
  error: X,
  warning: AlertTriangle,
  info: Info,
}

const COLORS: Record<ToastType, string> = {
  success: "border-[hsl(145_100%_50%/0.4)] bg-[hsl(145_100%_50%/0.08)]",
  error: "border-[hsl(0_85%_55%/0.4)] bg-[hsl(0_85%_55%/0.08)]",
  warning: "border-[hsl(45_100%_55%/0.4)] bg-[hsl(45_100%_55%/0.08)]",
  info: "border-[hsl(187_100%_50%/0.4)] bg-[hsl(187_100%_50%/0.08)]",
}

const ICON_COLORS: Record<ToastType, string> = {
  success: "text-neon bg-[hsl(145_100%_50%/0.15)]",
  error: "text-crimson bg-[hsl(0_85%_55%/0.15)]",
  warning: "text-[hsl(45_100%_55%)] bg-[hsl(45_100%_55%/0.15)]",
  info: "text-cyan bg-[hsl(187_100%_50%/0.15)]",
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counterRef = useRef(0)

  const addToast = useCallback((message: string, type: ToastType = "success") => {
    const id = `toast-${++counterRef.current}`
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed right-4 top-4 z-[100] flex flex-col gap-2 md:right-6 md:top-6">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => {
            const Icon = ICONS[t.type]
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 80, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 80, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-xl",
                  COLORS[t.type]
                )}
              >
                <div className={cn("flex h-6 w-6 items-center justify-center rounded-lg", ICON_COLORS[t.type])}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-sm font-medium text-foreground">{t.message}</span>
                <button
                  onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                  className="ml-2 rounded-md p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Tutup notifikasi"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}