"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Eye, EyeOff, Lock, Check, LogOut } from "lucide-react"
import { verifyPassword, updatePassword } from "@/lib/storage"
import { useToast } from "./toast-notification"
import { logout } from "@/lib/storage"
import { useRouter } from "next/navigation" 

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // ✅ FIX: Tambahkan async untuk verifyPassword dan updatePassword
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validations
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Semua field harus diisi")
      return
    }

    if (newPassword.length < 4) {
      setError("Password baru minimal 4 karakter")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Password baru tidak cocok")
      return
    }

    setIsLoading(true)

    try {
      // Verify current password
      const isValid = await verifyPassword(currentPassword)
      
      if (!isValid) {
        setError("Password saat ini salah")
        return
      }

      // Update password
      await updatePassword(newPassword)
      toast("Password berhasil diubah", "success")
      
      // Reset form
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      onClose()
    } catch (error) {
      console.error("Error updating password:", error)
      setError("Gagal mengubah password. Coba lagi.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setError("")
    onClose()
  }

  const handleLogout = () => {
    if (confirm("Yakin ingin logout? Data tetap tersimpan dan bisa diakses kembali setelah login.")) {
      logout()
      router.refresh()  // atau window.location.reload()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[hsl(220_20%_4%/0.7)] p-4 backdrop-blur-sm"
          onClick={handleClose}
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
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(187_100%_50%/0.1)]">
                  <Lock className="h-5 w-5 text-cyan" />
                </div>
                <h2 className="text-lg font-bold text-foreground">Ubah Password</h2>
              </div>
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
                aria-label="Tutup"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Current Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-muted-foreground">
                  Password Saat Ini
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value)
                      setError("")
                    }}
                    placeholder="Masukkan password saat ini"
                    disabled={isLoading}
                    className="w-full rounded-xl border border-border bg-card px-4 py-2.5 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                  >
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-muted-foreground">
                  Password Baru
                </label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value)
                      setError("")
                    }}
                    placeholder="Minimal 4 karakter"
                    disabled={isLoading}
                    className="w-full rounded-xl border border-border bg-card px-4 py-2.5 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-muted-foreground">
                  Konfirmasi Password Baru
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      setError("")
                    }}
                    placeholder="Ulangi password baru"
                    disabled={isLoading}
                    className="w-full rounded-xl border border-border bg-card px-4 py-2.5 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-[hsl(0_85%_55%/0.1)] px-3 py-2 text-sm text-crimson"
                >
                  {error}
                </motion.div>
              )}

              {/* Buttons */}
              <div className="mt-2 flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="flex-1 rounded-xl bg-secondary py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[hsl(187_100%_50%/0.15)] py-2.5 text-sm font-semibold text-cyan transition-colors hover:bg-[hsl(187_100%_50%/0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Simpan
                    </>
                  )}
                </button>
              </div>
            </form>
            <div className="mt-6 border-t border-border pt-6">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Account</h3>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl border border-crimson/30 bg-crimson/5 px-4 py-3 text-crimson transition-all hover:border-crimson hover:bg-crimson/10"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Logout</span>
              </button>
              <p className="mt-2 text-xs text-muted-foreground">
                Data Anda tetap tersimpan dan bisa diakses kembali setelah login
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}