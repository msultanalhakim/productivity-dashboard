"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, ArrowDownLeft, ArrowUpRight, Plus, Trash2, X, Wallet, Edit2 } from "lucide-react"
import { GlassCard } from "./glass-card"
import { EmptyState } from "./empty-state"
import { ConfirmModal } from "./confirm-modal"
import { useToast } from "./toast-notification"
import {
  formatRupiah,
  getMonthName,
  generateId,
  EXPENSE_CATEGORIES,
  type Expense,
} from "@/lib/store"
import { cn } from "@/lib/utils"

interface ExpenseTrackerProps {
  expenses: Expense[]
  onAddExpense: (e: Expense) => void
  onDeleteExpense: (id: string) => void
  onEditExpense?: (id: string, updatedExpense: Expense) => void
  currentMonth: Date
  onMonthChange: (d: Date) => void
}

export function ExpenseTracker({
  expenses,
  onAddExpense,
  onDeleteExpense,
  onEditExpense,
  currentMonth,
  onMonthChange,
}: ExpenseTrackerProps) {
  const [showModal, setShowModal] = useState(false)
  const [label, setLabel] = useState("")
  const [amount, setAmount] = useState("")
  const [type, setType] = useState<"in" | "out">("out")
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0])
  const [date, setDate] = useState("")

  const [editMode, setEditMode] = useState(false)
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)

  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; expenseId: string; expenseLabel: string }>({
    isOpen: false,
    expenseId: "",
    expenseLabel: "",
  })

  const { toast } = useToast()

  const now = new Date()
  const isCurrentMonth =
    currentMonth.getMonth() === now.getMonth() &&
    currentMonth.getFullYear() === now.getFullYear()

  const goPrevMonth = () => {
    const d = new Date(currentMonth)
    d.setMonth(d.getMonth() - 1)
    onMonthChange(d)
  }

  const goNextMonth = () => {
    if (isCurrentMonth) return
    const d = new Date(currentMonth)
    d.setMonth(d.getMonth() + 1)
    onMonthChange(d)
  }

  // ✅ FIX 1: Sort by latest date (descending)
  const filteredExpenses = expenses
    .filter((e) => {
      const d = new Date(e.date)
      return (
        d.getMonth() === currentMonth.getMonth() &&
        d.getFullYear() === currentMonth.getFullYear()
      )
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const totalIn = filteredExpenses
    .filter((e) => e.type === "in")
    .reduce((s, e) => s + e.amount, 0)
  const totalOut = filteredExpenses
    .filter((e) => e.type === "out")
    .reduce((s, e) => s + e.amount, 0)

  const handleSubmit = () => {
    if (!label.trim() || !amount || !date) return

    if (editMode && editingExpenseId) {
      const updatedExpense: Expense = {
        id: editingExpenseId,
        label: label.trim(),
        amount: Number(amount),
        type,
        date: new Date(date).toISOString(),
        category,
      }

      // ✅ FIX 2: Properly handle edit — use onEditExpense if available,
      // otherwise fallback to delete old + add new (balance stays correct)
      if (onEditExpense) {
        onEditExpense(editingExpenseId, updatedExpense)
      } else {
        onDeleteExpense(editingExpenseId)
        onAddExpense({ ...updatedExpense, id: generateId() })
      }

      toast("Transaksi berhasil diupdate", "success")
    } else {
      onAddExpense({
        id: generateId(),
        label: label.trim(),
        amount: Number(amount),
        type,
        date: new Date(date).toISOString(),
        category,
      })
      toast("Transaksi berhasil disimpan", "success")
    }

    resetForm()
  }

  const resetForm = () => {
    setLabel("")
    setAmount("")
    setType("out")
    setCategory(EXPENSE_CATEGORIES[0])
    setDate("")
    setShowModal(false)
    setEditMode(false)
    setEditingExpenseId(null)
  }

  const handleEdit = (expense: Expense) => {
    setEditMode(true)
    setEditingExpenseId(expense.id)
    setLabel(expense.label)
    setAmount(expense.amount.toString())
    setType(expense.type)
    setCategory(expense.category)
    setDate(new Date(expense.date).toISOString().split("T")[0])
    setShowModal(true)
  }

  const handleDeleteClick = (expense: Expense) => {
    setDeleteConfirm({
      isOpen: true,
      expenseId: expense.id,
      expenseLabel: expense.label,
    })
  }

  const handleDeleteConfirm = () => {
    onDeleteExpense(deleteConfirm.expenseId)
    setDeleteConfirm({ isOpen: false, expenseId: "", expenseLabel: "" })
    toast("Transaksi berhasil dihapus", "success")
  }

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && showModal) resetForm()
    },
    [showModal]
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    if (showModal && !editMode) {
      setDate(new Date().toISOString().split("T")[0])
    }
  }, [showModal, editMode])

  return (
    <>
      <GlassCard className="flex h-full w-full flex-col gap-3 sm:gap-4 p-4 sm:p-5 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-cyan"></div>
            <h2 className="text-sm sm:text-base font-semibold text-foreground">Catatan Keuangan</h2>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={goPrevMonth}
              className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
            <span className="min-w-[100px] sm:min-w-[130px] text-center text-xs sm:text-sm font-medium text-foreground">
              {getMonthName(currentMonth)}
            </span>
            <button
              onClick={goNextMonth}
              disabled={isCurrentMonth}
              className={cn(
                "flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg transition-colors",
                isCurrentMonth
                  ? "cursor-not-allowed text-muted-foreground/50"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
              aria-label="Bulan berikutnya"
            >
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-[hsl(145_100%_50%/0.08)] px-2.5 py-2 sm:px-3">
            <ArrowDownLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-neon shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground">Masuk</p>
              <p className="text-xs sm:text-sm font-bold text-neon truncate">
                Rp {formatRupiah(totalIn)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-[hsl(0_85%_55%/0.08)] px-2.5 py-2 sm:px-3">
            <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-crimson shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground">Keluar</p>
              <p className="text-xs sm:text-sm font-bold text-crimson truncate">
                Rp {formatRupiah(totalOut)}
              </p>
            </div>
          </div>
        </div>

        {/* Add Transaction Button */}
        <button
          onClick={() => {
            setEditMode(false)
            setShowModal(true)
          }}
          className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border py-2 sm:py-2.5 text-xs sm:text-sm text-muted-foreground transition-colors hover:border-cyan hover:text-cyan"
        >
          <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden xs:inline">Tambah Transaksi</span>
          <span className="xs:hidden">Tambah</span>
        </button>

        {/* Expense List */}
        <div className="flex max-h-72 flex-1 flex-col gap-1.5 overflow-y-auto">
          {filteredExpenses.length === 0 ? (
            <EmptyState variant="transaksi" action={{ label: "Tambah Transaksi", onClick: () => setShowModal(true) }} />
          ) : (
            filteredExpenses.map((e) => (
              <div
                key={e.id}
                className="group flex items-center justify-between gap-2 rounded-lg bg-secondary/50 px-2.5 py-2 sm:px-3"
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div
                    className={cn(
                      "flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg shrink-0",
                      e.type === "in"
                        ? "bg-[hsl(145_100%_50%/0.1)]"
                        : "bg-[hsl(0_85%_55%/0.1)]"
                    )}
                  >
                    {e.type === "in" ? (
                      <ArrowDownLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-neon" />
                    ) : (
                      <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-crimson" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-foreground truncate">{e.label}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                      {e.category} &middot;{" "}
                      {new Date(e.date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                  <span
                    className={cn(
                      "text-xs sm:text-sm font-semibold",
                      e.type === "in" ? "text-neon" : "text-crimson"
                    )}
                  >
                    <span className="hidden xs:inline">
                      {e.type === "in" ? "+" : "-"}Rp {formatRupiah(e.amount)}
                    </span>
                    <span className="xs:hidden">
                      {e.type === "in" ? "+" : "-"}
                      {formatRupiah(e.amount)}
                    </span>
                  </span>

                  <button
                    onClick={() => handleEdit(e)}
                    className="rounded-md p-1 text-muted-foreground opacity-0 transition-all hover:text-cyan group-hover:opacity-100"
                    aria-label={`Edit ${e.label}`}
                  >
                    <Edit2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteClick(e)}
                    className="rounded-md p-1 text-muted-foreground opacity-0 transition-all hover:text-crimson group-hover:opacity-100"
                    aria-label={`Hapus ${e.label}`}
                  >
                    <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </GlassCard>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={resetForm}
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
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                      <Wallet className="h-4 w-4 text-foreground" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground">
                        {editMode ? "Edit Transaksi" : "Tambah Transaksi"}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {editMode ? "Ubah detail transaksi" : "Catat pemasukan atau pengeluaran"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={resetForm}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 p-6">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Jenis Transaksi</label>
                  <div className="grid grid-cols-2 gap-2 rounded-lg bg-secondary/50 p-1">
                    <button
                      type="button"
                      onClick={() => setType("in")}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors",
                        type === "in"
                          ? "bg-neon/10 text-neon"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <ArrowDownLeft className="h-4 w-4" />
                      Pemasukan
                    </button>
                    <button
                      type="button"
                      onClick={() => setType("out")}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors",
                        type === "out"
                          ? "bg-crimson/10 text-crimson"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <ArrowUpRight className="h-4 w-4" />
                      Pengeluaran
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Keterangan</label>
                  <input
                    type="text"
                    placeholder={type === "in" ? "Contoh: Gaji bulanan" : "Contoh: Makan siang"}
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors focus:border-foreground focus:outline-none"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Jumlah</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      Rp
                    </span>
                    <input
                      type="number"
                      placeholder="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                      className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors focus:border-foreground focus:outline-none"
                    />
                  </div>
                  {amount && !isNaN(Number(amount)) && (
                    <p className="text-xs text-muted-foreground">{formatRupiah(Number(amount))}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground transition-colors focus:border-foreground focus:outline-none [color-scheme:dark]"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Tanggal</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground transition-colors focus:border-foreground focus:outline-none [color-scheme:dark]"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 rounded-lg border border-border bg-secondary/50 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!label.trim() || !amount || !date}
                    className={cn(
                      "flex-1 rounded-lg py-2.5 text-sm font-medium text-background transition-all",
                      type === "in"
                        ? "bg-neon hover:bg-neon/90 disabled:bg-neon/50"
                        : "bg-cyan hover:bg-cyan/90 disabled:bg-cyan/50",
                      "disabled:cursor-not-allowed"
                    )}
                  >
                    {editMode ? "Update" : "Simpan"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, expenseId: "", expenseLabel: "" })}
        onConfirm={handleDeleteConfirm}
        title="Hapus Transaksi?"
        description={`Apakah Anda yakin ingin menghapus transaksi "${deleteConfirm.expenseLabel}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
      />
    </>
  )
}