import React, { useState, useEffect } from 'react'
import {
  MapPin,
  Navigation,
  Search,
  CheckCircle2,
  Radio,
  Clock,
  Sparkles,
  ChevronRight,
  Compass,
  Layers,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import Modal from '../common/Modal'
import { useRiderLocation } from '../../context/LocationContext'
import deliveryApi from '../../api/delivery.api'

export const LocationPickerModal = () => {
  const {
    location,
    isModalOpen,
    isDetecting,
    isTrackingActive,
    lastStreamedAt,
    availableZones,
    detectGpsLocation,
    setOperatingZone,
    setCustomLocation,
    closeLocationModal,
  } = useRiderLocation()

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [activeTab, setActiveTab] = useState('zones') // 'zones' | 'search'

  // Debounced search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await deliveryApi.forwardGeocode(searchQuery.trim())
        const data = res.data?.data || res.data || []
        setSearchResults(Array.isArray(data) ? data : [])
      } catch (err) {
        console.warn('Forward geocode search error:', err)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleGpsClick = async () => {
    try {
      await detectGpsLocation(true)
      closeLocationModal()
    } catch (e) {
      // toast is handled in context
    }
  }

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={closeLocationModal}
      title="Set Delivery Location & Zone"
      subtitle="Select where you want to receive pickup & delivery orders."
      maxWidth="max-w-lg"
    >
      <div className="space-y-4 text-left">
        {/* 1. Currently Active Location Card */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-orange-500/10 border border-blue-500/20 dark:border-blue-500/30 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#113BD0] to-[#F97316] text-white flex items-center justify-center shrink-0 shadow-sm">
            {location.isGpsLive ? (
              <Navigation className="w-4 h-4 animate-pulse" />
            ) : (
              <MapPin className="w-4 h-4" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">
                {location.zoneName || 'Current Location'}
              </span>
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                  location.isGpsLive
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                }`}
              >
                {location.isGpsLive ? '● Live GPS Active' : 'Zone Selected'}
              </span>
              {isTrackingActive && (
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-[#113BD0] dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                  <span>Auto-Stream Active</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
              {location.address || 'Kanpur, Uttar Pradesh'}
            </p>
            <div className="flex items-center gap-3 text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex-wrap font-mono">
              <span>
                {Number(location.latitude).toFixed(4)}, {Number(location.longitude).toFixed(4)}
              </span>
              {location.speed !== null && (
                <span>Speed: {location.speed} km/h</span>
              )}
            </div>
          </div>
        </div>

        {/* 2. One-Tap Live GPS Auto-Detect Button */}
        <button
          type="button"
          onClick={handleGpsClick}
          disabled={isDetecting}
          className="w-full p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-between shadow-md shadow-emerald-600/20 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
              {isDetecting ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Navigation className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="text-left">
              <span className="block font-black text-xs">
                {isDetecting ? 'Fetching Live Device Coordinates...' : 'Use Current Device GPS'}
              </span>
              <span className="block text-[10px] text-emerald-100 font-normal">
                Auto-locate via satellite for highest accuracy
              </span>
            </div>
          </div>
          <Radio className="w-4 h-4 text-emerald-200 animate-pulse shrink-0" />
        </button>

        {/* 3. Search Bar for Custom Address */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search any area, locality, or landmark..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#113BD0]"
          />
          {isSearching && (
            <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
          )}
        </div>

        {/* 4. Search Results (if searching) */}
        {searchQuery.trim().length >= 2 ? (
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1 block">
              Search Results
            </span>
            {searchResults.length === 0 && !isSearching && (
              <div className="p-4 text-center text-xs text-slate-400">
                No location found for &ldquo;{searchQuery}&rdquo;. Try another area name.
              </div>
            )}
            {searchResults.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCustomLocation(item)}
                className="w-full p-2.5 rounded-xl text-left bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-750 border border-slate-200/70 dark:border-slate-700/70 flex items-start gap-2.5 transition-colors cursor-pointer group"
              >
                <MapPin className="w-4 h-4 text-slate-400 group-hover:text-[#113BD0] shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block truncate">
                    {item.formatted_address || item.display_name}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                    {item.city ? `${item.city}, ` : ''}{item.state || 'India'}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 shrink-0 self-center" />
              </button>
            ))}
          </div>
        ) : (
          /* 5. Predefined Operating Zones Grid */
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3 text-[#113BD0]" />
                <span>Operating Delivery Hubs</span>
              </span>
              <span>10 Active Zones</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
              {availableZones.map((zone) => {
                const isSelected = !location.isGpsLive && location.zoneName === zone.name
                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => setOperatingZone(zone)}
                    className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 border-[#113BD0] dark:border-blue-500 ring-2 ring-blue-500/20'
                        : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border-slate-200/80 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <span className="font-black text-xs text-slate-900 dark:text-slate-100 line-clamp-1">
                        {zone.name}
                      </span>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-[#113BD0] shrink-0" />
                      ) : (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 shrink-0">
                          {zone.radiusKm} km
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-400 line-clamp-1">
                      {zone.area}
                    </p>
                    <span className="text-[9px] font-bold text-orange-600 dark:text-orange-400">
                      ⚡ {zone.tag}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Info Note */}
        <div className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
          <AlertCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span>The dispatch engine uses your active location to assign the nearest restaurant orders.</span>
        </div>
      </div>
    </Modal>
  )
}

export default LocationPickerModal
