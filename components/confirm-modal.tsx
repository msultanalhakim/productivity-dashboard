"use client"

import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "danger" | "warning"
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Hapus",
  cancelText = "Batal",
  variant = "danger",
}: ConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-xl border border-border bg-card shadow-xl"
          >
            <div className="border-b border-border px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg",
                    variant === "danger" ? "bg-crimson/10" : "bg-orange-500/10"
                  )}>
                    <AlertTriangle className={cn(
                      "h-4 w-4",
                      variant === "danger" ? "text-crimson" : "text-orange-500"
                    )} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{title}</h3>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="px-6 py-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {description}
              </p>
            </div>

            <div className="border-t border-border px-6 py-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-border bg-secondary/50 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className={cn(
                  "flex-1 rounded-lg py-2.5 text-sm font-medium text-white transition-all",
                  variant === "danger" 
                    ? "bg-crimson hover:bg-crimson/90" 
                    : "bg-orange-500 hover:bg-orange-500/90"
                )}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}