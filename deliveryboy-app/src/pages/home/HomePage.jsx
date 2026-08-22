import React, { useState, useEffect, useCallback } from 'react'
import {
  Bike,
  Package,
  DollarSign,
  Banknote,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  Navigation,
  Shield,
  PhoneCall,
  ChevronRight,
  MapPin,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useRiderLocation } from '../../context/LocationContext'
import { formatCurrency } from '../../utils/formatters'
import deliveryApi from '../../api/delivery.api'
import ActiveDeliveryCard from '../../components/delivery/ActiveDeliveryCard'
import LoadingSkeleton from '../../components/common/LoadingSkeleton'
import Button from '../../components/common/Button'
import { realtimeBus } from '../../utils/realtimeSync'

export const HomePage = () => {
  const { riderProfile, activeOrder, refreshActiveOrder } = useAuth()
  const { location, openLocationModal } = useRiderLocation()
  const navigate = useNavigate()

  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [riderSupportPhone, setRiderSupportPhone] = useState('9005271986')

  const isOnline = !!riderProfile?.is_online

  useEffect(() => {
    deliveryApi.getConfig?.().then((res) => {
      const p = res?.data?.data?.rider_support_phone || res?.data?.data?.support_phone || res?.data?.rider_support_phone || res?.data?.support_phone
      if (p) setRiderSupportPhone(p)
    }).catch(() => {})
  }, [])

  const fetchDashboardData = useCallback(async () => {
    try {
      const [summaryRes] = await Promise.allSettled([
        deliveryApi.getSummary(),
        refreshActiveOrder(),
      ])

      if (summaryRes.status === 'fulfilled') {
        setSummary(summaryRes.value?.data?.data || null)
      }
    } catch (e) {
      console.warn('Dashboard summary error:', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [refreshActiveOrder])

  useEffect(() => {
    fetchDashboardData()

    // 0ms Realtime subscription on rider assignment / dispatch from Admin or Partner
    const unsubscribe = realtimeBus.subscribe(() => {
      fetchDashboardData()
    })

    const handleFocus = () => fetchDashboardData()
    window.addEventListener('focus', handleFocus)

    const timer = setInterval(() => {
      if (!document.hidden) {
        fetchDashboardData()
      }
    }, 7000)

    return () => {
      unsubscribe()
      window.removeEventListener('focus', handleFocus)
      clearInterval(timer)
    }
  }, [fetchDashboardData])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchDashboardData()
  }

  const todayEarnings = summary?.today?.earnings ?? summary?.today_earnings ?? 0
  const todayDeliveries = summary?.today?.completed_deliveries ?? summary?.today_orders_count ?? 0
  const pendingCod = summary?.pending_cod_amount ?? riderProfile?.pending_cod_amount ?? 0

  return (
    <div className="space-y-6">
      {/* 1. Header Title & Quick Refresh */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Fleet Overview
          </h1>
          <p className="text-xs text-slate-400">
            Real-time delivery assignments and shift metrics
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-[#113BD0] dark:hover:text-blue-400 shadow-xs flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#113BD0]' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* 2. Responsive 2-Column Grid on Desktop / Fullwidth on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ========================================================================= */}
        {/* Left Primary Column: Active Delivery Trip                                  */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Delivery Trip */}
          {activeOrder ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#113BD0] dark:text-blue-400 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>CURRENT ACTIVE TRIP</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-bold">
                  Trip in progress
                </span>
              </div>
              <ActiveDeliveryCard order={activeOrder} onRefresh={fetchDashboardData} />
            </div>
          ) : (
            <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/40 text-[#113BD0] dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center mx-auto shadow-xs">
                <Package className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h4 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  {isOnline ? 'No Active Trip at this Moment' : 'You are Currently Offline'}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isOnline
                    ? 'Stay connected and keep GPS enabled. New orders in your zone will be automatically assigned to you.'
                    : 'Turn your duty ON from the sidebar switch to start receiving delivery orders.'}
                </p>
              </div>
            </div>
          )}

          {/* Quick Action Navigation Shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div
              onClick={() => navigate('/deliveries')}
              className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 hover:border-[#113BD0]/40 transition-all flex items-center justify-between cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-[#113BD0] dark:text-blue-400">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-xs font-black text-slate-900 dark:text-slate-100">
                    Trip History & Log
                  </h5>
                  <p className="text-[11px] text-slate-400">
                    View completed & past orders
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            <div
              onClick={() => navigate('/cod')}
              className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 hover:border-[#113BD0]/40 transition-all flex items-center justify-between cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-xs font-black text-slate-900 dark:text-slate-100">
                    Cash in Hand Ledger
                  </h5>
                  <p className="text-[11px] text-slate-400">
                    {formatCurrency(pendingCod)} to deposit
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Right Column: Duty Status & Today's Shift KPI Metrics                      */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 space-y-4">
          {/* Duty Status Banner */}
          {/* 1. Online / Offline Duty Status Card */}
          <div
            className={`p-5 rounded-3xl border transition-all flex items-center justify-between gap-3 shadow-xs ${
              isOnline
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100'
                : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black ${
                  isOnline
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 animate-pulse'
                    : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Bike className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider block">
                  {isOnline ? 'ONLINE & READY' : 'OFFLINE (STANDBY)'}
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isOnline ? 'Ready for trips' : 'Duty turned off'}
                </p>
              </div>
            </div>

            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isOnline ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'
              }`}
            />
          </div>

          {/* 2. Active Operating Location & Zone Card */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#F97316]" />
                <span>OPERATING LOCATION</span>
              </h3>
              <button
                type="button"
                onClick={openLocationModal}
                className="text-[11px] font-black text-[#113BD0] dark:text-blue-400 hover:underline cursor-pointer"
              >
                Change Zone
              </button>
            </div>

            <div
              onClick={openLocationModal}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/60 hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer flex items-center justify-between gap-3 group"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  location.isGpsLive
                    ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                    : 'bg-orange-100 dark:bg-orange-950/50 text-[#F97316]'
                }`}>
                  {location.isGpsLive ? (
                    <Navigation className="w-4 h-4 animate-pulse" />
                  ) : (
                    <MapPin className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100 truncate group-hover:text-[#113BD0]">
                      {location.zoneName || 'Set Location'}
                    </span>
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md ${
                      location.isGpsLive
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                    }`}>
                      {location.isGpsLive ? 'Live GPS' : 'Zone'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {location.address || 'Kanpur, Uttar Pradesh'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0" />
            </div>
          </div>

          {/* Today's Shift Overview */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 sm:space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              TODAY'S SHIFT OVERVIEW
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 sm:gap-3">
              {/* Metric 1: Today's Earnings */}
              <div
                onClick={() => navigate('/earnings')}
                className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-3 cursor-pointer hover:border-emerald-500/40 transition-all touch-manipulation"
              >
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                    Today's Earnings
                  </span>
                  <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
                    {formatCurrency(todayEarnings)}
                  </div>
                </div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>

              {/* Metric 2: Completed Trips */}
              <div
                onClick={() => navigate('/deliveries')}
                className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-3 cursor-pointer hover:border-blue-500/40 transition-all touch-manipulation"
              >
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                    Completed Trips
                  </span>
                  <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
                    {todayDeliveries} <span className="text-xs font-semibold text-slate-400">Orders</span>
                  </div>
                </div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#113BD0] dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>

              {/* Metric 3: Cash in Hand */}
              <div
                onClick={() => navigate('/cod')}
                className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-3 cursor-pointer hover:border-amber-500/40 transition-all touch-manipulation sm:col-span-2 lg:col-span-1"
              >
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                    Cash in Hand (COD)
                  </span>
                  <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
                    {formatCurrency(pendingCod)}
                  </div>
                </div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Banknote className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Dispatch Helpline Card */}
          <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-slate-900/60 border border-blue-200/60 dark:border-slate-700 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <PhoneCall className="w-4 h-4 text-[#113BD0] dark:text-blue-400 shrink-0" />
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  Central Fleet Dispatch
                </span>
                <span className="text-[10px] text-slate-400">
                  Emergency order assistance
                </span>
              </div>
            </div>
            <a
              href={`tel:${riderSupportPhone.replace(/[^0-9+]/g, '')}`}
              className="px-3 py-1.5 rounded-xl bg-[#113BD0] hover:bg-[#F97316] text-white font-bold text-[11px] transition-colors"
            >
              Call Hub ({riderSupportPhone})
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
