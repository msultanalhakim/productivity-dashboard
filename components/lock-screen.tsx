"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Lock, Eye, EyeOff, AlertCircle } from "lucide-react"
import { verifyPassword, createSession } from "@/lib/storage"

interface LockScreenProps {
  onUnlock: () => void
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isShaking, setIsShaking] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Clear any error after 3 seconds
    if (error) {
      const timer = setTimeout(() => setError(""), 3000)
      return () => clearTimeout(timer)
    }
  }, [error])

  // ✅ FIX: Tambahkan async untuk verifyPassword
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password.trim()) {
      setError("Password tidak boleh kosong")
      triggerShake()
      return
    }

    setIsLoading(true)
    
    try {
      const isValid = await verifyPassword(password)
      
      if (isValid) {
        createSession()
        onUnlock()
      } else {
        setError("Password salah")
        triggerShake()
        setPassword("")
      }
    } catch (error) {
      console.error("Error verifying password:", error)
      setError("Terjadi kesalahan. Coba lagi.")
      triggerShake()
    } finally {
      setIsLoading(false)
    }
  }

  const triggerShake = () => {
    setIsShaking(true)
    setTimeout(() => setIsShaking(false), 500)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-[hsl(var(--background))] via-[hsl(var(--card))] to-[hsl(var(--background))]">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-[hsl(var(--cyan))]/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-[hsl(var(--neon))]/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          y: 0,
          x: isShaking ? [0, -10, 10, -10, 10, 0] : 0
        }}
        transition={{ 
          opacity: { duration: 0.5 },
          scale: { duration: 0.5 },
          y: { duration: 0.5 },
          x: { duration: 0.5 }
        }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <div className="overflow-hidden rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/80 p-8 backdrop-blur-xl">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[hsl(var(--cyan))]/10 glow-cyan">
              <Lock className="h-10 w-10 text-[hsl(var(--cyan))]" />
            </div>
          </div>

          {/* Title */}
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-2xl font-bold text-[hsl(var(--foreground))]">Command Center</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Masukkan password untuk mengakses dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError("")
                }}
                placeholder="Password"
                disabled={isLoading}
                className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3 pr-12 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--cyan))] disabled:opacity-50"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))] disabled:opacity-50"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-xl bg-[hsl(var(--crimson))]/10 px-3 py-2 text-sm text-[hsl(var(--crimson))]"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="rounded-xl bg-[hsl(var(--cyan))] py-3 text-sm font-semibold text-white transition-all hover:bg-[hsl(var(--cyan))]/90 glow-cyan disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Memverifikasi..." : "Masuk"}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}