import React from 'react'

export const StatusBadge = ({ status, size = 'sm' }) => {
  const normalized = String(status || '').toUpperCase()

  const config = {
    PENDING: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200/80 dark:border-amber-800/40',
      label: 'NEW ORDER',
      dot: 'bg-amber-500 animate-pulse',
    },
    CONFIRMED: {
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-[#113BD0] dark:text-blue-300',
      border: 'border-blue-200/80 dark:border-blue-800/40',
      label: 'ACCEPTED',
      dot: 'bg-[#113BD0] dark:bg-blue-400',
    },
    PREPARING: {
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      text: 'text-indigo-700 dark:text-indigo-300',
      border: 'border-indigo-200/80 dark:border-indigo-800/40',
      label: 'PREPARING',
      dot: 'bg-indigo-500 animate-pulse',
    },
    READY_FOR_PICKUP: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200/80 dark:border-emerald-800/40',
      label: 'READY FOR PICKUP',
      dot: 'bg-emerald-500',
    },
    DISPATCHED: {
      bg: 'bg-orange-50 dark:bg-orange-950/40',
      text: 'text-orange-700 dark:text-orange-300',
      border: 'border-orange-200/80 dark:border-orange-800/40',
      label: 'OUT FOR DELIVERY',
      dot: 'bg-orange-500',
    },
    DELIVERED: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200/80 dark:border-emerald-800/40',
      label: 'DELIVERED',
      dot: 'bg-emerald-600',
    },
    CANCELLED: {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200/80 dark:border-rose-800/40',
      label: 'CANCELLED',
      dot: 'bg-rose-500',
    },
    REJECTED: {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200/80 dark:border-rose-800/40',
      label: 'REJECTED',
      dot: 'bg-rose-500',
    },
    ONLINE: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200/80 dark:border-emerald-800/40',
      label: 'ONLINE',
      dot: 'bg-emerald-500 animate-ping',
    },
    OFFLINE: {
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-600 dark:text-slate-400',
      border: 'border-slate-300 dark:border-slate-700',
      label: 'OFFLINE',
      dot: 'bg-slate-400',
    },
  }

  const current = config[normalized] || {
    bg: 'bg-slate-50 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
    label: normalized || 'UNKNOWN',
    dot: 'bg-slate-400',
  }

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[9px] gap-1',
    sm: 'px-2.5 py-1 text-[10px] gap-1.5',
    md: 'px-3 py-1.5 text-xs gap-2',
  }

  return (
    <span
      className={`inline-flex items-center font-extrabold tracking-wider rounded-lg border uppercase select-none ${current.bg} ${current.text} ${current.border} ${sizeClasses[size] || sizeClasses.sm}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${current.dot}`} />
      <span>{current.label}</span>
    </span>
  )
}

export default StatusBadge
