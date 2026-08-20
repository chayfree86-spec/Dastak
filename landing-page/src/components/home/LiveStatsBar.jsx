import React, { useState, useEffect } from 'react'
import { Users, Store, PackageCheck, MapPin } from 'lucide-react'
import apiClient from '../../api/client'

// Honest formatting of a REAL count — no inflation, just locale commas + a "+".
const fmt = (n) => {
  if (n === null || n === undefined) return '—'
  const num = Number(n) || 0
  return num > 0 ? `${num.toLocaleString('en-IN')}+` : '0'
}

export const LiveStatsBar = () => {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await apiClient.get('/stats')
        setStats(res.data?.data || res.data || null)
      } catch {
        setStats(null)
      }
    }
    loadStats()
  }, [])

  const statItems = [
    {
      label: 'Happy Customers',
      value: fmt(stats?.customers),
      icon: Users,
      color: 'text-[#FF5200]',
      bg: 'bg-orange-50 dark:bg-orange-950/60',
    },
    {
      label: 'Partner Restaurants',
      value: fmt(stats?.restaurants),
      icon: Store,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/60',
    },
    {
      label: 'Orders Delivered',
      value: fmt(stats?.orders_delivered),
      icon: PackageCheck,
      color: 'text-[#113BD0] dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/60',
    },
    {
      label: 'Cities Served',
      value: fmt(stats?.cities),
      icon: MapPin,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    },
  ]

  return (
    <section className="py-12 bg-white dark:bg-slate-900 border-y border-slate-200/80 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {statItems.map((item, idx) => {
            const Icon = item.icon
            return (
              <div key={idx} className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center shrink-0 shadow-xs`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {item.value}
                  </h4>
                  <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
                    {item.label}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default LiveStatsBar
