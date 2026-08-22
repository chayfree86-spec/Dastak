import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Power } from 'lucide-react'
import settingsApi from '../../api/settings.api'

const fmtTime = (iso) => {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleString('en-IN', { weekday: 'short', hour: '2-digit', minute: '2-digit' })
  } catch (e) {
    return null
  }
}

/**
 * Compact ordering-availability indicator for the admin header. Auto-refreshes
 * so admins can see OPEN/CLOSED at a glance without opening Settings.
 * Click → jumps to Settings ▸ Store Hours.
 */
export const StoreStatusBadge = () => {
  const navigate = useNavigate()
  const [status, setStatus] = useState(null)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await settingsApi.getServiceStatus()
      const data = res?.data || res
      if (data && typeof data.is_open === 'boolean') setStatus(data)
    } catch (e) {
      // ignore — keep last known status
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    const iv = setInterval(fetchStatus, 60000)
    const onFocus = () => fetchStatus()
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(iv)
      window.removeEventListener('focus', onFocus)
    }
  }, [fetchStatus])

  if (!status) return null

  const isOpen = status.is_open
  const sub = isOpen
    ? status.closes_at
      ? `Closes ${fmtTime(status.closes_at)}`
      : '24×7'
    : status.opens_at
      ? `Opens ${fmtTime(status.opens_at)}`
      : 'Temporarily closed'

  const title = isOpen ? `Ordering is OPEN · ${sub}` : `Ordering is CLOSED · ${sub}`

  return (
    <button
      type="button"
      onClick={() => navigate('/settings')}
      title={title}
      aria-label={title}
      className={`hidden sm:flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl border transition-colors cursor-pointer ${
        isOpen
          ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/60'
          : 'border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/60'
      }`}
    >
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span
          className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
            isOpen ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
        />
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isOpen ? 'bg-emerald-500' : 'bg-rose-500'}`} />
      </span>
      <div className="flex flex-col text-left leading-none">
        <span
          className={`text-[11px] font-black uppercase tracking-wide ${
            isOpen ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
          }`}
        >
          {isOpen ? 'Open' : 'Closed'}
        </span>
        <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 hidden lg:block max-w-[130px] truncate">
          {sub}
        </span>
      </div>
    </button>
  )
}

export default StoreStatusBadge
