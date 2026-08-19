import React, { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  ArrowLeft,
  Navigation,
  Crosshair,
  Phone,
  Store,
  User,
  MapPin,
  Clock,
  ExternalLink,
  ShieldCheck,
  Compass,
  Banknote,
  CheckCircle2,
} from 'lucide-react'
import {
  openGoogleMapsNavigation,
  calculateDistanceKm,
  calculateEtaMinutes,
  fetchOsrmRoute,
  makePhoneCall,
} from '../../utils/geo'
import { formatCurrency } from '../../utils/formatters'

export const FullscreenNavModal = ({
  isOpen,
  onClose,
  order,
  riderPosition = null,
  isOutForDelivery = false,
  targetType = 'RESTAURANT', // 'RESTAURANT' | 'CUSTOMER'
}) => {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const layerGroupRef = useRef(null)
  const riderMarkerRef = useRef(null)

  // Local state for active target to allow seamless switching inside modal
  const [activeTarget, setActiveTarget] = useState(targetType)

  useEffect(() => {
    setActiveTarget(targetType)
  }, [targetType, isOpen])

  const [distanceKm, setDistanceKm] = useState(null)
  const [etaMinutes, setEtaMinutes] = useState(null)
  const [roadPath, setRoadPath] = useState([])
  const [loadingRoute, setLoadingRoute] = useState(true)

  const restaurant = order?.restaurant || {}
  const customerAddress = order?.delivery_address || order?.delivery_address_json || {}
  const customer = order?.customer || {}

  // Standard Kanpur Local Coordinates
  const restLat = Number(restaurant.latitude) || 26.4520
  const restLng = Number(restaurant.longitude) || 80.3340

  const custLat = Number(customerAddress.latitude) || 26.4560
  const custLng = Number(customerAddress.longitude) || 80.3390

  // Rider position
  const rawRiderLat = Number(riderPosition?.latitude)
  const rawRiderLng = Number(riderPosition?.longitude)
  const isFarAway = !rawRiderLat || Math.abs(rawRiderLat - restLat) > 0.1

  const riderLat = isFarAway ? restLat - 0.0035 : rawRiderLat
  const riderLng = isFarAway ? restLng - 0.0025 : rawRiderLng

  const isCod = order?.payment_mode === 'COD' || order?.payment_mode === 'CASH_ON_DELIVERY'
  const totalAmount = order?.bill?.total_amount || order?.total_amount || 0

  const isHeadingToCustomer = activeTarget === 'CUSTOMER'
  const targetLat = isHeadingToCustomer ? custLat : restLat
  const targetLng = isHeadingToCustomer ? custLng : restLng
  const targetName = isHeadingToCustomer
    ? (customerAddress.customer_name || customerAddress.name || customer.name || 'Valued Customer')
    : (restaurant.name || 'Partner Kitchen')
  const targetAddress = isHeadingToCustomer
    ? (customerAddress.address || 'Customer Delivery Address')
    : (restaurant.address_line1 || restaurant.address || 'Restaurant Pickup Outlet')
  const targetPhone = isHeadingToCustomer
    ? (customerAddress.phone || customerAddress.mobile || customer.mobile || order?.customer_mobile)
    : (restaurant.phone || restaurant.mobile)

  // =========================================================================
  // Mobile Hardware & Browser Back Button Interception via History API
  // =========================================================================
  const handleClose = useCallback(() => {
    if (window.history.state?.inAppMapOpen) {
      window.history.back()
    } else {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return

    // Push new history state when fullscreen map opens
    window.history.pushState({ inAppMapOpen: true }, '')

    const handlePopState = () => {
      // Hardware back button pressed on Android/iOS/Browser
      onClose()
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [isOpen, onClose])

  // Fetch OSRM Road Route
  useEffect(() => {
    if (!isOpen) return
    let isMounted = true
    setLoadingRoute(true)

    const getRoute = async () => {
      try {
        const routeData = await fetchOsrmRoute(riderLat, riderLng, targetLat, targetLng)
        if (isMounted && routeData && routeData.coordinates.length > 0) {
          setRoadPath(routeData.coordinates)
          setDistanceKm(routeData.distanceKm)
          setEtaMinutes(routeData.durationMinutes)
        }
      } catch (err) {
        const dist = calculateDistanceKm(riderLat, riderLng, targetLat, targetLng)
        if (isMounted) {
          setDistanceKm(dist)
          setEtaMinutes(calculateEtaMinutes(dist))
        }
      } finally {
        if (isMounted) setLoadingRoute(false)
      }
    }

    getRoute()
    return () => {
      isMounted = false
    }
  }, [isOpen, riderLat, riderLng, targetLat, targetLng])

  // Initialize and Render Fullscreen Leaflet Map
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [(riderLat + targetLat) / 2, (riderLng + targetLng) / 2],
        zoom: 16,
        minZoom: 12,
        maxZoom: 19,
        zoomControl: false,
        attributionControl: false,
      })

      // High-quality CartoDB Voyager tiles
      const tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'

      L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map)

      layerGroupRef.current = L.featureGroup().addTo(map)
      mapInstanceRef.current = map
    }

    const map = mapInstanceRef.current
    const group = layerGroupRef.current
    group.clearLayers()

    // 1. Draw Real Road Polyline
    const activeRouteCoordinates = roadPath.length > 0
      ? roadPath
      : [
          [riderLat, riderLng],
          [targetLat, targetLng],
        ]

    // Outer vibrant route line
    L.polyline(activeRouteCoordinates, {
      color: isHeadingToCustomer ? '#F97316' : '#2845D6',
      weight: 7,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(group)

    // Inner glowing dashed white route line
    L.polyline(activeRouteCoordinates, {
      color: '#FFFFFF',
      weight: 3,
      dashArray: '8, 12',
      opacity: 0.95,
      lineCap: 'round',
    }).addTo(group)

    // 2. Rider Marker (Glowing 3D Bike)
    const riderIconHtml = `
      <div class="relative flex flex-col items-center -translate-x-1/2 -translate-y-1/2 select-none">
        <span class="absolute w-14 h-14 rounded-full bg-blue-500/30 animate-ping pointer-events-none"></span>
        <span class="absolute w-10 h-10 rounded-full bg-[#2845D6]/30 animate-pulse pointer-events-none"></span>
        <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#2845D6] to-[#1E3A8A] text-white flex items-center justify-center shadow-2xl border-2 border-white ring-4 ring-blue-500/30">
          <svg class="w-6 h-6 animate-bounce" style="animation-duration: 2s;" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
            <circle cx="5.5" cy="17.5" r="3.5"/>
            <circle cx="18.5" cy="17.5" r="3.5"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5L9 9l3-3h3l2 4"/>
          </svg>
        </div>
        <div class="mt-1 px-2 py-0.5 rounded-md bg-slate-900 text-white text-[9px] font-black shadow-md border border-white/20 whitespace-nowrap">
          Your Location (Rider)
        </div>
      </div>
    `
    const riderMarker = L.marker([riderLat, riderLng], {
      icon: L.divIcon({
        html: riderIconHtml,
        className: 'custom-rider-marker',
        iconSize: [44, 44],
      }),
      zIndexOffset: 1000,
    }).addTo(group)
    riderMarkerRef.current = riderMarker

    // 3. Target Destination Marker
    const targetIconHtml = isHeadingToCustomer
      ? `
        <div class="relative flex flex-col items-center -translate-x-1/2 -translate-y-1/2 select-none">
          <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#F97316] to-amber-500 text-white flex items-center justify-center shadow-2xl border-2 border-white ring-4 ring-orange-500/30">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/>
            </svg>
          </div>
          <div class="mt-1 px-2 py-0.5 rounded-md bg-orange-950 text-white text-[9px] font-black shadow-md border border-white/20 whitespace-nowrap">
            📍 ${targetName}
          </div>
        </div>
      `
      : `
        <div class="relative flex flex-col items-center -translate-x-1/2 -translate-y-1/2 select-none">
          <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#2845D6] to-indigo-600 text-white flex items-center justify-center shadow-2xl border-2 border-white ring-4 ring-blue-500/30">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72m-13.5 8.651h.008v.008H3.75v-.008Zm0-3h.008v.008H3.75v-.008Zm0-3h.008v.008H3.75v-.008Z"/>
            </svg>
          </div>
          <div class="mt-1 px-2 py-0.5 rounded-md bg-slate-900 text-white text-[9px] font-black shadow-md border border-white/20 whitespace-nowrap">
            🏪 ${targetName}
          </div>
        </div>
      `

    L.marker([targetLat, targetLng], {
      icon: L.divIcon({
        html: targetIconHtml,
        className: 'custom-target-marker',
        iconSize: [44, 44],
      }),
      zIndexOffset: 900,
    }).addTo(group)

    // Smoothly auto-fit bounds
    map.fitBounds(group.getBounds(), {
      padding: [70, 70],
      maxZoom: 16,
    })

    setTimeout(() => {
      map.invalidateSize()
    }, 200)
  }, [isOpen, riderLat, riderLng, targetLat, targetLng, roadPath, isHeadingToCustomer, targetName])

  const handleCenterRider = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([riderLat, riderLng], 17, { duration: 1.2 })
    }
  }

  const handleLaunchExternalGoogleMaps = () => {
    openGoogleMapsNavigation(targetLat, targetLng, targetName)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950 flex flex-col font-sans select-none overflow-hidden antialiased">
      {/* 1. Fullscreen Map Canvas */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* 2. Top Floating Navigation Header */}
      <div className="relative z-20 px-3 sm:px-4 py-3 pt-[max(env(safe-area-inset-top),12px)] flex items-center justify-between gap-2 pointer-events-none">
        {/* Back Button */}
        <button
          type="button"
          onClick={handleClose}
          className="pointer-events-auto w-11 h-11 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl text-slate-800 dark:text-slate-100 shadow-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-center active:scale-95 transition-all cursor-pointer touch-manipulation shrink-0"
          title="Back to Order (Back Button)"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Live Route Target Switcher (Centered) */}
        <div className="pointer-events-auto flex items-center gap-1.5 p-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-xl rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTarget('RESTAURANT')}
            className={`px-3.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer touch-manipulation ${
              activeTarget === 'RESTAURANT'
                ? 'bg-[#2845D6] text-white shadow-md shadow-blue-600/30'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Restaurant</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTarget('CUSTOMER')}
            className={`px-3.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer touch-manipulation ${
              activeTarget === 'CUSTOMER'
                ? 'bg-[#F97316] text-white shadow-md shadow-orange-500/30'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Customer</span>
          </button>
        </div>

        {/* Right Balance Spacer to keep switcher perfectly dead-center */}
        <div className="w-11 h-11 shrink-0 pointer-events-none" />
      </div>

      {/* Floating Live Telemetry Badge below Header */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <div className="px-3.5 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md text-white text-xs font-black shadow-xl border border-white/20 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <span>
            {distanceKm !== null ? `${distanceKm} km • ~${etaMinutes} mins` : 'Calculating route...'}
          </span>
          <span className="text-slate-400 font-normal">|</span>
          <span className={isHeadingToCustomer ? 'text-orange-400' : 'text-blue-400'}>
            {isHeadingToCustomer ? 'Customer Drop' : 'Restaurant Pickup'}
          </span>
        </div>
      </div>

      {/* 3. Floating Quick Recenter GPS Button */}
      <button
        type="button"
        onClick={handleCenterRider}
        className="absolute bottom-40 right-3.5 z-20 p-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 text-[#2845D6] dark:text-blue-400 shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer touch-manipulation"
        title="Recenter on Rider Location"
      >
        <Crosshair className="w-5 h-5" />
      </button>

      {/* 4. Bottom Destination Action Sheet */}
      <div className="mt-auto relative z-20 p-3 sm:p-4 pb-[max(env(safe-area-inset-bottom),16px)]">
        <div className="p-4 sm:p-5 rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl space-y-3.5">
          {/* Destination Details & Call Button */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black shadow-md shrink-0 ${
                  isHeadingToCustomer
                    ? 'bg-gradient-to-tr from-[#F97316] to-amber-500'
                    : 'bg-gradient-to-tr from-[#2845D6] to-indigo-600'
                }`}
              >
                {isHeadingToCustomer ? <User className="w-6 h-6" /> : <Store className="w-6 h-6" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block leading-none">
                    {isHeadingToCustomer ? 'CUSTOMER DESTINATION' : 'RESTAURANT PICKUP'}
                  </span>
                  {isHeadingToCustomer && (
                    isCod ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] font-black border border-amber-500/30">
                        <Banknote className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        <span>COD: Collect {formatCurrency(totalAmount)}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[10px] font-black border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>PREPAID (Paid Online)</span>
                      </span>
                    )
                  )}
                </div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 truncate mt-0.5">
                  {targetName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {targetAddress}
                </p>
              </div>
            </div>

            {targetPhone && (
              <button
                type="button"
                onClick={() => makePhoneCall(targetPhone)}
                className="p-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 flex items-center justify-center active:scale-95 transition-all cursor-pointer shrink-0 touch-manipulation"
                title="Call Contact"
              >
                <Phone className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Action Row: Google Maps Turn-by-Turn GPS & Back Button */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="py-3 px-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer touch-manipulation"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Trip</span>
            </button>

            <button
              type="button"
              onClick={handleLaunchExternalGoogleMaps}
              className="py-3 px-3.5 rounded-2xl bg-gradient-to-r from-[#2845D6] to-[#1E3A8A] hover:from-[#F97316] hover:to-[#EA580C] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-blue-600/30 transition-all active:scale-[0.98] cursor-pointer touch-manipulation truncate"
            >
              <Navigation className="w-4 h-4 fill-white shrink-0" />
              <span className="truncate">Google Maps GPS</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FullscreenNavModal
