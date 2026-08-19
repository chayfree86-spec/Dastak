import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  Navigation,
  Compass,
  MapPin,
  Store,
  User,
  Clock,
  Crosshair,
  ShieldCheck,
  Radio,
} from 'lucide-react'
import {
  openGoogleMapsNavigation,
  calculateDistanceKm,
  calculateEtaMinutes,
  fetchOsrmRoute,
} from '../../utils/geo'
import { useTheme } from '../../context/ThemeContext'

export const DeliveryRouteMap = ({
  order,
  riderPosition = null,
  isOutForDelivery = false,
  onOpenFullscreen = null,
  className = '',
}) => {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const layerGroupRef = useRef(null)
  const { isDark } = useTheme()

  const [distanceKm, setDistanceKm] = useState(null)
  const [etaMinutes, setEtaMinutes] = useState(null)
  const [roadPath, setRoadPath] = useState([])

  const restaurant = order?.restaurant || {}
  const customerAddress = order?.delivery_address || {}

  // Standard Local Kanpur Coordinates
  const restLat = Number(restaurant.latitude) || 26.4520
  const restLng = Number(restaurant.longitude) || 80.3340

  const custLat = Number(customerAddress.latitude || order?.delivery_address_json?.latitude) || 26.4560
  const custLng = Number(customerAddress.longitude || order?.delivery_address_json?.longitude) || 80.3390

  // Keep Rider strictly within the local delivery circle (~800m away in the same neighborhood)
  const rawRiderLat = Number(riderPosition?.latitude)
  const rawRiderLng = Number(riderPosition?.longitude)
  const isFarAway = !rawRiderLat || Math.abs(rawRiderLat - restLat) > 0.1

  const riderLat = isFarAway ? restLat - 0.0035 : rawRiderLat
  const riderLng = isFarAway ? restLng - 0.0025 : rawRiderLng

  // Current active destination
  const targetLat = isOutForDelivery ? custLat : restLat
  const targetLng = isOutForDelivery ? custLng : restLng
  const targetLabel = isOutForDelivery
    ? (customerAddress.customer_name || 'Customer Address')
    : (restaurant.name || 'Restaurant Outlet')

  // Fetch OSRM Road Route from Rider to Target
  useEffect(() => {
    let isMounted = true

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
      }
    }

    getRoute()
    return () => {
      isMounted = false
    }
  }, [riderLat, riderLng, targetLat, targetLng])

  // Initialize and render the Local Delivery Circle Map
  useEffect(() => {
    if (!mapContainerRef.current) return

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [restLat, restLng],
        zoom: 15,
        minZoom: 13,
        maxZoom: 18,
        zoomControl: false,
        attributionControl: false,
      })

      L.control.zoom({ position: 'topright' }).addTo(map)

      // Clean, clutter-free tile style (Voyager tiles)
      const tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'

      L.tileLayer(tileUrl, {
        maxZoom: 18,
        subdomains: 'abcd',
      }).addTo(map)

      layerGroupRef.current = L.featureGroup().addTo(map)
      mapInstanceRef.current = map
    }

    const map = mapInstanceRef.current
    const group = layerGroupRef.current
    group.clearLayers()

    // 1. DELIVERY CIRCLE ZONE (3.0 km Radius around Restaurant)
    const deliveryZoneCircle = L.circle([restLat, restLng], {
      radius: 2500, // 2.5 km operational circle
      color: '#2845D6',
      weight: 2,
      dashArray: '5, 5',
      fillColor: '#2845D6',
      fillOpacity: 0.05,
    }).addTo(group)

    // 2. Rider Marker (Pulsing Dastak Bike)
    const riderIcon = L.divIcon({
      className: 'dastak-rider-marker',
      html: `
        <div class="relative flex items-center justify-center">
          <span class="absolute w-9 h-9 rounded-full bg-blue-500/30 animate-ping"></span>
          <div class="w-8 h-8 rounded-full bg-[#2845D6] text-white flex items-center justify-center shadow-xl border-2 border-white ring-2 ring-blue-500/50">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div class="absolute -bottom-5 px-1.5 py-0.5 rounded bg-slate-900 text-white text-[9px] font-black shadow whitespace-nowrap">
            You (Rider)
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    })

    // 3. Restaurant Pickup Marker
    const restIcon = L.divIcon({
      className: 'dastak-store-marker',
      html: `
        <div class="flex flex-col items-center">
          <div class="px-2 py-0.5 rounded-md bg-[#2845D6] text-white text-[10px] font-black shadow-lg border border-white whitespace-nowrap mb-0.5">
            🏪 ${restaurant.name || 'Kitchen'}
          </div>
          <div class="w-7 h-7 rounded-full bg-[#2845D6] text-white flex items-center justify-center shadow-lg border-2 border-white">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h18v18H3z" />
            </svg>
          </div>
        </div>
      `,
      iconSize: [30, 44],
      iconAnchor: [15, 44],
    })

    // 4. Customer Drop Location Marker
    const custIcon = L.divIcon({
      className: 'dastak-cust-marker',
      html: `
        <div class="flex flex-col items-center">
          <div class="px-2 py-0.5 rounded-md bg-[#F97316] text-white text-[10px] font-black shadow-lg border border-white whitespace-nowrap mb-0.5">
            📍 ${customerAddress.customer_name || 'Customer'}
          </div>
          <div class="w-7 h-7 rounded-full bg-[#F97316] text-white flex items-center justify-center shadow-lg border-2 border-white">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 21s-8-7.5-8-12a8 8 0 1116 0c0 4.5-8 12-8 12z" />
            </svg>
          </div>
        </div>
      `,
      iconSize: [30, 44],
      iconAnchor: [15, 44],
    })

    // Add Markers to map group
    L.marker([riderLat, riderLng], { icon: riderIcon }).addTo(group)
    L.marker([restLat, restLng], { icon: restIcon }).addTo(group)
    L.marker([custLat, custLng], { icon: custIcon }).addTo(group)

    // 5. Connect Real OSRM Road Route Polyline
    const activeRouteCoordinates = roadPath.length > 0
      ? roadPath
      : isOutForDelivery
      ? [
          [riderLat, riderLng],
          [custLat, custLng],
        ]
      : [
          [riderLat, riderLng],
          [restLat, restLng],
        ]

    // Base road polyline
    L.polyline(activeRouteCoordinates, {
      color: isOutForDelivery ? '#F97316' : '#2845D6',
      weight: 5,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(group)

    // Inner glowing dashed line
    L.polyline(activeRouteCoordinates, {
      color: '#FFFFFF',
      weight: 2,
      dashArray: '6, 10',
      opacity: 0.95,
      lineCap: 'round',
    }).addTo(group)

    // Fit strictly to the circle and markers (Padding ensures it stays within ~2-3 km view)
    const bounds = L.latLngBounds([
      [riderLat, riderLng],
      [restLat, restLng],
      [custLat, custLng],
    ])
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, minZoom: 14 })

    setTimeout(() => {
      map.invalidateSize()
    }, 200)
  }, [riderLat, riderLng, restLat, restLng, custLat, custLng, isOutForDelivery, isDark, roadPath])

  const handleCenterRider = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([riderLat, riderLng], 16)
    }
  }

  const handleOpenGoogleMaps = () => {
    openGoogleMapsNavigation(targetLat, targetLng, targetLabel)
  }

  return (
    <div className={`relative rounded-3xl overflow-hidden border-2 border-blue-200 dark:border-slate-700 shadow-md ${className}`}>
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-52 sm:h-64 md:h-72 lg:h-80 z-0 bg-slate-100 dark:bg-slate-900" />

      {/* Top Floating App Info Header: Circle Radius & Live Distance Badge */}
      <div className="absolute top-2.5 left-2.5 right-12 z-[1000] flex items-center justify-between gap-1.5 pointer-events-none">
        <div className="pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2.5 sm:px-3.5 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md flex items-center gap-1.5 sm:gap-2 max-w-[calc(100%-48px)]">
          <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
          <div className="text-[10px] sm:text-[11px] font-black text-slate-900 dark:text-slate-100 flex items-center gap-1 sm:gap-1.5 truncate">
            <span className="truncate">Dastak Zone</span>
            <span className="text-[#2845D6] dark:text-blue-400 font-black shrink-0">
              • {distanceKm !== null ? `${distanceKm} km (~${etaMinutes}m)` : 'Local'}
            </span>
          </div>
        </div>
      </div>

      {/* Center on Rider GPS Button */}
      <button
        type="button"
        onClick={handleCenterRider}
        className="absolute bottom-14 sm:bottom-16 right-2.5 sm:right-3 z-[1000] p-2 sm:p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-md hover:bg-slate-50 cursor-pointer touch-manipulation"
        title="Focus My Location"
      >
        <Crosshair className="w-4 h-4 text-[#2845D6]" />
      </button>

      {/* Bottom Floating Navigation Action: Clean local destination link */}
      <div className="absolute bottom-2.5 sm:bottom-3 inset-x-2.5 sm:inset-x-3 z-[1000] flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenFullscreen || handleOpenGoogleMaps}
          className="flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-2xl bg-gradient-to-r from-[#2845D6] to-[#1E3A8A] hover:from-[#F97316] hover:to-[#EA580C] text-white font-black text-[11px] sm:text-xs md:text-sm flex items-center justify-center gap-2 shadow-xl shadow-blue-600/30 transition-all active:scale-[0.98] cursor-pointer touch-manipulation truncate"
        >
          <Navigation className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white shrink-0" />
          <span className="truncate">FULLSCREEN NAV MAP ({targetLabel.slice(0, 18)})</span>
        </button>
      </div>
    </div>
  )
}

export default DeliveryRouteMap
