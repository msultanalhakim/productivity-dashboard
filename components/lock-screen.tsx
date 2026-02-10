"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Lock, Eye, EyeOff } from "lucide-react"
import { verifyPassword, setAuthenticated } from "@/lib/storage"

interface LockScreenProps {
  onUnlock: () => void
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password.trim()) {
      setError(true)
      setTimeout(() => setError(false), 2000)
      return
    }
    
    setLoading(true)
    setError(false)
    
    try {
      // Verify password dari Supabase
      const isValid = await verifyPassword(password)
      
      if (isValid) {
        console.log("[LockScreen] ✅ Password valid, authenticating...")
        
        // Set authenticated flag di localStorage
        setAuthenticated(true)
        
        // Trigger unlock callback
        onUnlock()
      } else {
        console.log("[LockScreen] ❌ Password invalid")
        setError(true)
        setPassword("")
        setTimeout(() => setError(false), 2000)
      }
    } catch (err) {
      console.error("[LockScreen] ❌ Error during authentication:", err)
      setError(true)
      setPassword("")
      setTimeout(() => setError(false), 2000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md px-6"
      >
        <div className="rounded-2xl border border-border bg-card/50 p-8 shadow-2xl backdrop-blur-xl">
          {/* Lock Icon */}
          <div className="mb-6 flex justify-center">
            <motion.div 
              className="rounded-full bg-cyan/10 p-4"
              animate={error ? { 
                x: [0, -10, 10, -10, 10, 0],
                transition: { duration: 0.5 }
              } : {}}
            >
              <Lock className="h-12 w-12 text-cyan" />
            </motion.div>
          </div>

          {/* Title */}
          <h2 className="mb-2 text-center text-2xl font-bold text-foreground">
            Command Center
          </h2>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            Masukkan password untuk melanjutkan
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError(false)
                }}
                placeholder="Masukkan password"
                className={`w-full rounded-xl border bg-background px-4 py-3 pr-12 text-foreground outline-none transition-all focus:ring-2 ${
                  error
                    ? "border-crimson ring-2 ring-crimson/50"
                    : "border-border focus:border-cyan focus:ring-cyan/50"
                }`}
                autoFocus
                disabled={loading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-crimson/10 px-4 py-2 text-center text-sm text-crimson"
              >
                Password salah! Silakan coba lagi.
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="w-full rounded-xl bg-gradient-to-r from-cyan to-neon py-3 font-semibold text-background transition-all hover:shadow-lg hover:shadow-cyan/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Memverifikasi...
                </span>
              ) : (
                "Unlock"
              )}
            </button>
          </form>

          {/* Info */}
          <div className="mt-6 space-y-2">
            <p className="text-center text-xs text-muted-foreground">
              Data Anda aman tersimpan di Supabase
            </p>
            <p className="text-center text-xs text-muted-foreground/70">
              Default password: <span className="font-mono text-cyan">sultan</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}