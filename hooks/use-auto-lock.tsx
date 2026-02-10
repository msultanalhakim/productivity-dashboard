"use client"

import { useEffect, useCallback, useRef } from "react"
// Pastikan path import ini sesuai dengan lokasi file storage Anda
import { isSessionValid, updateActivity, clearSession } from "@/lib/storage"

// Update ke 2 jam sesuai instruksi sebelumnya (2 * 60 * 60 * 1000)
const IDLE_TIMEOUT = 2 * 60 * 60 * 1000 
const CHECK_INTERVAL = 10000 // Cek validitas setiap 10 detik

interface UseAutoLockOptions {
  onLock: () => void
}

export function useAutoLock({ onLock }: UseAutoLockOptions) {
  // Menggunakan useRef agar timer tetap persisten tanpa memicu re-render
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const resetIdleTimer = useCallback(() => {
    // 1. Update timestamp aktivitas terakhir di storage
    updateActivity()
    
    // 2. Hapus timeout yang sedang berjalan
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // 3. Setel ulang timeout untuk mengunci aplikasi
    timeoutRef.current = setTimeout(() => {
      clearSession()
      onLock()
    }, IDLE_TIMEOUT)
  }, [onLock])

  const checkSession = useCallback(() => {
    // Validasi apakah sesi masih berlaku (misal: cek session/device baru)
    if (!isSessionValid()) {
      clearSession()
      onLock()
    }
  }, [onLock])

  useEffect(() => {
    // Jalankan aktivitas awal
    updateActivity()

    // Daftar event untuk mendeteksi interaksi pengguna
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ]

    // Pasang event listeners
    events.forEach((event) => {
      document.addEventListener(event, resetIdleTimer, true)
    })

    // Inisialisasi timer pertama kali
    resetIdleTimer()

    // Cek validitas sesi secara berkala (deteksi perubahan session/device)
    checkIntervalRef.current = setInterval(checkSession, CHECK_INTERVAL)

    // Cek sesi saat pengguna kembali ke tab ini
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkSession()
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Cleanup: Membersihkan memori saat komponen dilepas
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, resetIdleTimer, true)
      })
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }

      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [resetIdleTimer, checkSession])

  return { resetIdleTimer }
}