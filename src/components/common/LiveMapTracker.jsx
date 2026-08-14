import React, { useState, useEffect } from 'react'
import {
  MapPin,
  Navigation,
  Radio,
  Compass,
  Gauge,
  Clock,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Bike,
  Home,
  Store,
  ShieldCheck,
  Maximize2,
} from 'lucide-react'
import Button from './Button'

export const LiveMapTracker = ({
  title = 'Live GPS Telemetry',
  type = 'rider', // 'rider' | 'customer'
  entityName,
  coordinates = { lat: 26.4520, lng: 80.3340 },
  speed = 32.5,
  heading = 120,
  isOnline = true,
  lastPingTime = 'Just now',
  activeOrder = null,
  zoneName = 'Kanpur Central Zone',
  address = '',
}) => {
  const [copied, setCopied] = useState(false)
  const [isSimulating, setIsSimulating] = useState(true)
  const [simLat, setSimLat] = useState(coordinates.lat)
  const [simLng, setSimLng] = useState(coordinates.lng)
  const [simSpeed, setSimSpeed] = useState(speed)
  const [pingTimer, setPingTimer] = useState(0)

  // Live telemetry pulse animation & coordinate drift simulation
  useEffect(() => {
    if (!isSimulating) return
    const interval = setInterval(() => {
      setSimLat((prev) => +(prev + (Math.random() - 0.48) * 0.0002).toFixed(6))
      setSimLng((prev) => +(prev + (Math.random() - 0.48) * 0.0002).toFixed(6))
      setSimSpeed((prev) => Math.max(0, +(prev + (Math.random() - 0.5) * 4).toFixed(1)))
      setPingTimer((prev) => (prev + 1) % 60)
    }, 2500)
    return () => clearInterval(interval)
  }, [isSimulating])

  const copyCoordinates = () => {
    navigator.clipboard.writeText(`${simLat}, ${simLng}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const openGoogleMaps = () => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${simLat},${simLng}`, '_blank')
  }

  return (
    <div className="space-y-4">
      {/* Telemetry Status Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {isOnline && (
              <span className="absolute w-6 h-6 rounded-full bg-emerald-400/40 animate-ping" />
            )}
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span>{title}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                {isOnline ? 'LIVE' : 'OFFLINE'}
              </span>
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              {type === 'rider'
                ? `Tracking fleet unit for ${entityName} • Pinging every 2.5s`
                : `Verified customer delivery coordinates • ${zoneName}`}
            </p>
          </div>
        </div>

        {/* Telemetry Control Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="xs"
            icon={copied ? Check : Copy}
            onClick={copyCoordinates}
          >
            {copied ? 'Copied' : 'Copy Lat/Lng'}
          </Button>

          <Button
            variant="primary"
            size="xs"
            icon={ExternalLink}
            onClick={openGoogleMaps}
          >
            Google Maps
          </Button>
        </div>
      </div>

      {/* Main Interactive Radar Map Viewport (Supports both Light & Dark themes) */}
      <div className="relative w-full h-80 sm:h-96 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-gradient-to-b from-blue-50/70 via-slate-50 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 shadow-inner flex flex-col justify-between p-4 sm:p-6 select-none transition-colors">
        
        {/* Map Grid Pattern */}
        <div className="absolute inset-0 opacity-25 dark:opacity-15 pointer-events-none bg-[radial-gradient(#3b82f6_1.5px,transparent_1.5px)] [background-size:24px_24px]" />
        
        {/* Concentric Radar Circles */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30 dark:opacity-20">
          <div className="w-48 h-48 rounded-full border border-blue-500 animate-pulse" />
          <div className="absolute w-80 h-80 rounded-full border border-blue-400/60 dark:border-blue-500/40" />
          <div className="absolute w-[440px] h-[440px] rounded-full border border-blue-300/40 dark:border-blue-500/20" />
        </div>

        {/* Top Floating Telemetry Overlay */}
        <div className="relative z-10 flex items-start justify-between gap-3">
          <div className="p-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-700 text-xs shadow-md space-y-1">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              <Navigation className="w-3.5 h-3.5 text-[#2845D6] dark:text-blue-400" />
              <span>GPS Telemetry Coordinates</span>
            </div>
            <div className="font-mono font-bold text-[#2845D6] dark:text-emerald-400 text-sm">
              {simLat}° N, {simLng}° E
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span>Accuracy: <strong className="text-slate-800 dark:text-slate-200">±3.5m</strong></span>
              <span>•</span>
              <span>Zone: <strong className="text-slate-800 dark:text-slate-200">{zoneName}</strong></span>
            </div>
          </div>

          {type === 'rider' && (
            <div className="p-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-700 text-xs flex items-center gap-4 shadow-md">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-orange-500" />
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Speed</span>
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">{simSpeed} km/h</span>
                </div>
              </div>
              <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Heading</span>
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">{heading}° E</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Center Live Marker Simulation */}
        <div className="relative z-10 flex items-center justify-center my-auto">
          {type === 'rider' ? (
            <div className="relative flex flex-col items-center">
              {/* Radar pulse wave */}
              <div className="absolute w-24 h-24 rounded-full bg-blue-500/25 dark:bg-blue-500/20 animate-ping pointer-events-none" />
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#2845D6] to-blue-500 text-white shadow-xl shadow-blue-500/30 border-2 border-white dark:border-slate-800 flex items-center justify-center relative">
                <Bike className="w-7 h-7 animate-bounce" />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
              </div>
              <div className="mt-2 px-3 py-1 rounded-full bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-900 dark:text-white shadow-md flex items-center gap-1.5">
                <span>{entityName}</span>
                <span className="text-[#2845D6] dark:text-emerald-400 font-mono">({simSpeed} km/h)</span>
              </div>
            </div>
          ) : (
            <div className="relative flex flex-col items-center">
              <div className="absolute w-24 h-24 rounded-full bg-purple-500/25 dark:bg-purple-500/20 animate-ping pointer-events-none" />
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-xl shadow-purple-500/30 border-2 border-white dark:border-slate-800 flex items-center justify-center relative">
                <Home className="w-7 h-7" />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
              </div>
              <div className="mt-2 px-3 py-1 rounded-full bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-900 dark:text-white shadow-md flex items-center gap-1.5">
                <span>{entityName}'s Location</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Floating Info Bar */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-700 text-xs shadow-md">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-xs sm:max-w-md">
              {address || `${simLat}° N, ${simLng}° E, ${zoneName}, Kanpur`}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Ping updated just now
            </span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Geofence Verified
            </span>
          </div>
        </div>
      </div>

      {/* Active Trip Telemetry Card (If on delivery) */}
      {activeOrder && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-[#2845D6] dark:text-blue-400 animate-pulse" />
              <span>Active Trip Routing</span>
            </h5>
            <span className="font-mono text-xs font-bold text-[#2845D6] dark:text-blue-400">
              Order #{activeOrder.id}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                <Store className="w-3 h-3 text-amber-500" /> Pickup Kitchen
              </span>
              <p className="font-bold text-slate-800 dark:text-slate-200">{activeOrder.restaurant}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                <Bike className="w-3 h-3 text-blue-500" /> Current Rider
              </span>
              <p className="font-bold text-slate-800 dark:text-slate-200">{entityName}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                <Home className="w-3 h-3 text-purple-500" /> Delivery Destination
              </span>
              <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{activeOrder.address || activeOrder.customer}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LiveMapTracker
