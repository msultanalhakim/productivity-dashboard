"use client"

import { motion, AnimatePresence } from "framer-motion"
import { LogOut, X } from "lucide-react"

interface LogoutConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export function LogoutConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm 
}: LogoutConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[hsl(220_20%_4%/0.7)] p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
          >
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-crimson/10">
                  <LogOut className="h-5 w-5 text-crimson" />
                </div>
                <h2 className="text-lg font-bold text-foreground">Konfirmasi Logout</h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                aria-label="Tutup"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="mb-6">
              <p className="text-sm text-foreground">
                Yakin ingin logout?
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Data Anda tetap tersimpan di cloud dan bisa diakses kembali setelah login.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl bg-secondary py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-crimson/15 py-2.5 text-sm font-semibold text-crimson transition-colors hover:bg-crimson/25"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}