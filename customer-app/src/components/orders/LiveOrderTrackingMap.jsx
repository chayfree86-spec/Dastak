import React, { useEffect, useRef, useState, useMemo } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  Bike,
  Store,
  Home,
  MapPin,
  Clock,
  Compass,
  Phone,
  Crosshair,
  ShieldCheck,
  Radio,
} from 'lucide-react'
import {
  calculateDistanceKm,
  calculateEtaMinutes,
  makePhoneCall,
} from '../../utils/geo'
import { useTheme } from '../../context/ThemeContext'
import { useLanguage } from '../../context/LanguageContext'

export const LiveOrderTrackingMap = ({
  order,
  onEtaChange,
  className = '',
}) => {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const layerGroupRef = useRef(null)
  const riderMarkerRef = useRef(null)

  const { isDark } = useTheme()
  const { t } = useLanguage()

  // Extract locations
  const restaurant = order?.restaurant || {}
  const deliveryBoy = order?.delivery_boy || {}
  const customerAddress = order?.delivery_address || order?.delivery_address_json || {}

  // Fallback / Standard Kanpur Local Coordinates
  const restLat = Number(restaurant.latitude) || 26.4520
  const restLng = Number(restaurant.longitude) || 80.3340

  const custLat = Number(customerAddress.latitude) || 26.4590
  const custLng = Number(customerAddress.longitude) || 80.3440

  // Simulation progress for live movement (0 to 1 between restaurant and customer)
  const [progress, setProgress] = useState(0.45)
  const [distanceKm, setDistanceKm] = useState(1.4)
  const [etaMins, setEtaMins] = useState(6)

  const isOutForDelivery = order?.status === 'OUT_FOR_DELIVERY'
  const isDelivered = order?.status === 'DELIVERED'

  // Calculate simulated or real Rider coordinates
  const riderCoords = useMemo(() => {
    // If real GPS coords available on delivery_boy object
    if (deliveryBoy.latitude && deliveryBoy.longitude) {
      const dLat = Number(deliveryBoy.latitude)
      const dLng = Number(deliveryBoy.longitude)
      if (dLat && dLng && Math.abs(dLat - restLat) < 0.2) {
        return [dLat, dLng]
      }
    }

    // Realistic curved interpolation from Restaurant to Customer
    const currentProg = isDelivered ? 1 : isOutForDelivery ? Math.min(0.92, Math.max(0.1, progress)) : 0.08
    
    // Add small realistic road curve offset
    const curveOffset = Math.sin(currentProg * Math.PI) * 0.0022
    const lat = restLat + (custLat - restLat) * currentProg + curveOffset
    const lng = restLng + (custLng - restLng) * currentProg - (curveOffset * 0.6)

    return [lat, lng]
  }, [restLat, restLng, custLat, custLng, deliveryBoy, progress, isOutForDelivery, isDelivered])

  // Live simulation tick: every 3.2s bike moves smoothly forward if out for delivery
  useEffect(() => {
    if (!isOutForDelivery) return

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 0.90) return 0.25 // loop smooth cycle for visual feel
        return prev + 0.04
      })
    }, 3200)

    return () => clearInterval(timer)
  }, [isOutForDelivery])

  // Recalculate live distance and ETA and notify parent
  useEffect(() => {
    const dist = calculateDistanceKm(riderCoords[0], riderCoords[1], custLat, custLng)
    const mins = calculateEtaMinutes(dist)
    setDistanceKm(dist)
    setEtaMins(mins)
    if (onEtaChange) {
      onEtaChange({ distanceKm: dist, etaMins: mins })
    }
  }, [riderCoords, custLat, custLng, onEtaChange])

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [(restLat + custLat) / 2, (restLng + custLng) / 2],
        zoom: 15,
        minZoom: 13,
        maxZoom: 18,
        zoomControl: false,
        attributionControl: false,
      })

      L.control.zoom({ position: 'topright' }).addTo(map)

      // High quality CartoDB tiles
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

    // 1. Route Polyline Path (Restaurant -> Waypoints -> Customer)
    const midPoint1 = [
      restLat + (custLat - restLat) * 0.35 + 0.0018,
      restLng + (custLng - restLng) * 0.35 - 0.0012,
    ]
    const midPoint2 = [
      restLat + (custLat - restLat) * 0.70 + 0.0015,
      restLng + (custLng - restLng) * 0.70 - 0.0008,
    ]

    const fullRouteCoords = [
      [restLat, restLng],
      midPoint1,
      midPoint2,
      [custLat, custLng],
    ]

    // Background thick route line
    L.polyline(fullRouteCoords, {
      color: '#2845D6',
      weight: 6,
      opacity: 0.85,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(group)

    // Animated dashed pulse route line
    L.polyline(fullRouteCoords, {
      color: '#FFFFFF',
      weight: 2.5,
      dashArray: '8, 12',
      opacity: 0.95,
      lineCap: 'round',
    }).addTo(group)

    // 2. Restaurant Marker
    const restIconHtml = `
      <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#F97316] to-amber-500 shadow-xl shadow-orange-500/40 flex items-center justify-center text-white border-2 border-white ring-2 ring-orange-500/20">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72m-13.5 8.651h.008v.008H3.75v-.008Zm0-3h.008v.008H3.75v-.008Zm0-3h.008v.008H3.75v-.008Z"/>
          </svg>
        </div>
        <div class="absolute -bottom-6 bg-slate-900/90 backdrop-blur-md text-white text-[9px] font-black px-2 py-0.5 rounded-md whitespace-nowrap shadow-md pointer-events-none">
          ${restaurant.name || 'Kitchen'}
        </div>
      </div>
    `

    L.marker([restLat, restLng], {
      icon: L.divIcon({
        html: restIconHtml,
        className: 'custom-rest-marker',
        iconSize: [40, 40],
      }),
    }).addTo(group)

    // 3. Customer Home Marker
    const custIconHtml = `
      <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-xl shadow-emerald-500/40 flex items-center justify-center text-white border-2 border-white ring-2 ring-emerald-500/20">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/>
          </svg>
        </div>
        <div class="absolute -bottom-6 bg-emerald-950/90 backdrop-blur-md text-white text-[9px] font-black px-2 py-0.5 rounded-md whitespace-nowrap shadow-md pointer-events-none">
          Your Home
        </div>
      </div>
    `

    L.marker([custLat, custLng], {
      icon: L.divIcon({
        html: custIconHtml,
        className: 'custom-cust-marker',
        iconSize: [40, 40],
      }),
    }).addTo(group)

    // 4. Live Rider On Bike Marker (Animated 3D Glowing Badge)
    const riderIconHtml = `
      <div class="relative flex flex-col items-center -translate-x-1/2 -translate-y-1/2 select-none group cursor-pointer">
        <!-- Live Ping Radar Circle -->
        <span class="absolute w-14 h-14 rounded-full bg-blue-500/30 animate-ping pointer-events-none"></span>
        <span class="absolute w-10 h-10 rounded-full bg-[#2845D6]/20 animate-pulse pointer-events-none"></span>

        <!-- Floating Info Pill on Rider -->
        <div class="mb-1 px-2 py-0.5 rounded-full bg-slate-900 text-white text-[9px] font-black shadow-xl flex items-center gap-1 border border-white/20 whitespace-nowrap">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>${deliveryBoy.name || 'Rahul (Rider)'}</span>
        </div>

        <!-- 3D Bike Badge with Elevation & Glow -->
        <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2845D6] via-blue-600 to-[#F97316] shadow-2xl shadow-blue-600/60 flex items-center justify-center text-white border-2 border-white ring-4 ring-blue-500/30 transition-transform hover:scale-110">
          <svg class="w-6 h-6 animate-bounce" style="animation-duration: 2s;" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
            <circle cx="5.5" cy="17.5" r="3.5"/>
            <circle cx="18.5" cy="17.5" r="3.5"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5L9 9l3-3h3l2 4"/>
          </svg>
        </div>
      </div>
    `

    const riderMarker = L.marker(riderCoords, {
      icon: L.divIcon({
        html: riderIconHtml,
        className: 'custom-rider-marker',
        iconSize: [48, 48],
      }),
      zIndexOffset: 1000,
    }).addTo(group)

    riderMarkerRef.current = riderMarker

    // Auto-fit bounds smoothly
    map.fitBounds(group.getBounds(), {
      padding: [45, 45],
      maxZoom: 16,
    })
  }, [restLat, restLng, custLat, custLng, isDark, restaurant.name, deliveryBoy.name])

  // Smoothly pan & update rider position on map
  useEffect(() => {
    if (riderMarkerRef.current) {
      riderMarkerRef.current.setLatLng(riderCoords)
    }
  }, [riderCoords])

  const handleCenterOnRider = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(riderCoords, 16, { duration: 1.2 })
    }
  }

  return (
    <div className={`relative overflow-hidden rounded-3xl border-2 border-slate-200/90 dark:border-slate-800 shadow-xl bg-slate-100 dark:bg-slate-900 ${className}`}>
      {/* 1. Leaflet Live Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-72 sm:h-80 z-0" />

      {/* 2. Top-Left Live Status Badge */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 pointer-events-none">
        <div className="px-3 py-1.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg border border-slate-200/80 dark:border-slate-800 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
          <div>
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block leading-none">
              {isOutForDelivery ? 'LIVE RIDER GPS' : isDelivered ? 'DELIVERED' : 'KITCHEN READY'}
            </span>
            <span className="text-xs font-black text-slate-900 dark:text-slate-100 leading-tight">
              {isOutForDelivery ? `${distanceKm} km away • ~${etaMins} mins` : 'Food Being Prepared'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Top-Right Center Focus Button */}
      <div className="absolute top-3 right-3 z-10">
        <button
          type="button"
          onClick={handleCenterOnRider}
          className="p-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-700 dark:text-slate-200 hover:text-[#2845D6] shadow-lg border border-slate-200/80 dark:border-slate-800 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Center on Rider"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>

      {/* 4. Bottom Interactive Delivery Partner Strip */}
      <div className="absolute bottom-3 inset-x-3 z-10">
        <div className="p-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#2845D6] to-[#F97316] flex items-center justify-center text-white shrink-0 shadow-md">
              <Bike className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider leading-none">
                DELIVERY PARTNER
              </span>
              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">
                {deliveryBoy.name || 'Rahul Verma'}
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {isOutForDelivery ? 'Riding towards your location' : 'Assigned & ready for pickup'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {(deliveryBoy.phone || order?.delivery_boy_phone) && (
              <button
                type="button"
                onClick={() => makePhoneCall(deliveryBoy.phone || order?.delivery_boy_phone)}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LiveOrderTrackingMap
