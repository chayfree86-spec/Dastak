import React from 'react'

export const StatusBadge = ({ status, size = 'sm' }) => {
  const normalized = String(status || '').toUpperCase()

  const config = {
    PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'NEW ORDER', dot: 'bg-amber-500 animate-pulse' },
    CONFIRMED: { bg: 'bg-blue-50', text: 'text-[#2845D6]', border: 'border-blue-200', label: 'ACCEPTED', dot: 'bg-[#2845D6]' },
    PREPARING: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', label: 'PREPARING', dot: 'bg-indigo-500 animate-pulse' },
    READY_FOR_PICKUP: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'READY FOR PICKUP', dot: 'bg-emerald-500' },
    DISPATCHED: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', label: 'OUT FOR DELIVERY', dot: 'bg-orange-500' },
    DELIVERED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'DELIVERED', dot: 'bg-emerald-600' },
    CANCELLED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'CANCELLED', dot: 'bg-rose-500' },
    REJECTED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'REJECTED', dot: 'bg-rose-500' },
    ONLINE: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'ONLINE', dot: 'bg-emerald-500 animate-ping' },
    OFFLINE: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300', label: 'OFFLINE', dot: 'bg-slate-400' },
  }

  const current = config[normalized] || {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
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
