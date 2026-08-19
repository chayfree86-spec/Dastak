import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Store,
  Star,
  MapPin,
  Navigation,
  Maximize2,
  Phone,
  Mail,
  Clock,
  Percent,
  Wallet,
  ShoppingBag,
  UtensilsCrossed,
  Bike,
  BarChart3,
  Settings as SettingsIcon,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Edit2,
  Search,
  Box,
  RotateCw,
  RotateCcw,
  Layers,
} from 'lucide-react'
import restaurantsApi from '../../api/restaurants.api'
import { useApi } from '../../hooks/useApi'
import { formatCurrency, formatPhone, formatDateTime } from '../../utils/formatters'
import Tabs from '../../components/common/Tabs'
import StatusBadge from '../../components/common/StatusBadge'
import Button from '../../components/common/Button'
import DataTable from '../../components/common/DataTable'
import Switch from '../../components/common/Switch'
import Input from '../../components/common/Input'
import AmountInput from '../../components/common/AmountInput'
import CustomSelect from '../../components/common/CustomSelect'
import Modal from '../../components/common/Modal'
import AddressAutocomplete from '../../components/common/AddressAutocomplete'
import RestaurantFormModal from './RestaurantFormModal'
import MenuManager from './MenuManager'
import { useToast } from '../../context/ToastContext'
import { reverseGeocodeCoordinates, forwardGeocodeAddress, detectCurrentLocationWithFallback } from '../../utils/geocoding'
import { loadGoogleMaps } from '../../utils/googleMapsLoader'

export const RestaurantDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('overview')
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [editAddressText, setEditAddressText] = useState('')
  const [editCityText, setEditCityText] = useState('Kanpur')
  const [editRadiusText, setEditRadiusText] = useState('10')
  const [addressSaving, setAddressSaving] = useState(false)

  const { data: settlements, loading: settlementsLoading, retry: retrySettlements } = useApi(
    () => restaurantsApi.getRestaurantSettlements(id),
    [id],
    { initialData: [] }
  )

  const { data: restaurant, loading, error, retry, setData: setRestaurantData } = useApi(
    () => restaurantsApi.getRestaurantDetails(id),
    [id],
    { initialData: null }
  )

  const { data: menuData, loading: menuLoading } = useApi(
    () => restaurantsApi.getRestaurantMenu(id),
    [id],
    {
      initialData: [
        {
          category: 'Biryani Specials',
          items: [
            { id: 'M1', name: 'Hyderabadi Dum Biryani', is_veg: false, price: 340.00, discount_price: 299.00, is_available: true, prep_time: '25 mins', variants: ['Half', 'Full'], addons: ['Extra Raita', 'Mirchi Ka Salan'] },
            { id: 'M2', name: 'Lucknowi Paneer Biryani', is_veg: true, price: 280.00, discount_price: 260.00, is_available: true, prep_time: '20 mins', variants: ['Regular', 'Large'], addons: ['Extra Gravy'] },
            { id: 'M3', name: 'Kolkata Chicken Biryani', is_veg: false, price: 360.00, discount_price: 360.00, is_available: false, prep_time: '30 mins', variants: ['Standard'], addons: ['Extra Boiled Egg'] },
          ],
        },
        {
          category: 'Starters & Kebabs',
          items: [
            { id: 'M4', name: 'Chicken Tikka Kebab (6 Pcs)', is_veg: false, price: 290.00, discount_price: 270.00, is_available: true, prep_time: '18 mins', variants: [], addons: ['Mint Chutney'] },
            { id: 'M5', name: 'Dahi Ke Kebab (4 Pcs)', is_veg: true, price: 220.00, discount_price: 220.00, is_available: true, prep_time: '15 mins', variants: [], addons: [] },
          ],
        },
      ],
    }
  )

  const { data: ordersData, loading: ordersLoading } = useApi(
    () => restaurantsApi.getRestaurantOrders(id, { limit: 5 }),
    [id],
    {
      initialData: [
        { id: 'D4829', customer: 'Aarav Sharma', amount: 640.00, status: 'NEW', time: new Date().toISOString() },
        { id: 'D4815', customer: 'Deepak Rao', amount: 820.00, status: 'DELIVERED', time: new Date(Date.now() - 3600000).toISOString() },
        { id: 'D4790', customer: 'Kunal Kapoor', amount: 490.00, status: 'DELIVERED', time: new Date(Date.now() - 86400000).toISOString() },
      ],
    }
  )

  // Settings Tab States
  const [settingsActive, setSettingsActive] = useState(false)
  const [settingsVegOnly, setSettingsVegOnly] = useState(false)
  const [settingsRadius, setSettingsRadius] = useState('')
  const [settingsMinOrder, setSettingsMinOrder] = useState('')
  const [settingsCommission, setSettingsCommission] = useState('')
  const [settingsCycle, setSettingsCycle] = useState('WEEKLY')
  const [settingsName, setSettingsName] = useState('')
  const [settingsOwnerName, setSettingsOwnerName] = useState('')
  const [settingsMobile, setSettingsMobile] = useState('')

  // Login credentials state
  const [settingsEmail, setSettingsEmail] = useState('')
  const [settingsOwnerMobile, setSettingsOwnerMobile] = useState('')
  const [settingsPassword, setSettingsPassword] = useState('')
  const [settingsPin, setSettingsPin] = useState('')
  const [settingsLoginActive, setSettingsLoginActive] = useState(true)

  // Operating Hours state
  const [hoursList, setHoursList] = useState([])

  const [saveSpecsLoading, setSaveSpecsLoading] = useState(false)
  const [saveHoursLoading, setSaveHoursLoading] = useState(false)
  const [saveLoginLoading, setSaveLoginLoading] = useState(false)

  // Coordinate and map state
  const [mapRadius, setMapRadius] = useState(7)
  const [mapLat, setMapLat] = useState(26.8467)
  const [mapLng, setMapLng] = useState(80.9462)
  const [mapDetectedAddress, setMapDetectedAddress] = useState('')
  const [mapDetectedCity, setMapDetectedCity] = useState('')
  const [mapModified, setMapModified] = useState(false)
  const [mapSaveLoading, setMapSaveLoading] = useState(false)

  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const circleRef = useRef(null)
  const mapContainerRef = useRef(null)

  // Initialize coordinates from restaurant details
  useEffect(() => {
    if (restaurant) {
      setMapRadius(restaurant.delivery_radius_km ?? 7)
      setMapLat(Number(restaurant.latitude) || 26.8467)
      setMapLng(Number(restaurant.longitude) || 80.9462)
      setMapDetectedAddress('')
      setMapDetectedCity('')
    }
  }, [restaurant])

  // Fit the map to EXACTLY the delivery radius circle (no extra surrounding map),
  // and lock zoom-out so only the coverage area stays visible (zoom IN still free).
  const fitToCircle = () => {
    const map = mapRef.current
    const circle = circleRef.current
    const gmaps = window.google?.maps
    if (!map || !circle || !gmaps) return
    try {
      const bounds = circle.getBounds()
      if (!bounds) return

      map.setOptions({ minZoom: null, restriction: null })
      map.fitBounds(bounds)

      gmaps.event.addListenerOnce(map, 'idle', () => {
        const fitZoom = map.getZoom()
        if (Number.isFinite(fitZoom)) {
          map.setOptions({
            minZoom: Math.max(2, Math.min(fitZoom, 18)),
            maxZoom: 20,
            restriction: { latLngBounds: bounds, strictBounds: false },
          })
        }
      })
    } catch (e) {
      // Never let a map-fit error blank the page.
    }
  }

  // Synchronize radius changes from range slider
  const handleMapRadiusChange = (e) => {
    const r = Number(e.target.value)
    setMapRadius(r)
    setMapModified(true)
    if (circleRef.current) {
      circleRef.current.setRadius(r * 1000)
      fitToCircle()
    }
  }

  // Geocode the restaurant's saved address -> move the pin + circle to that location.
  const [geoLoading, setGeoLoading] = useState(false)
  const fetchLocationFromAddress = async () => {
    const query = [restaurant?.address, restaurant?.city].filter(Boolean).join(', ').trim()
    if (!query) {
      toast.warning('No Address', 'This restaurant has no address to locate. Add one via Edit Profile first.')
      return
    }
    setGeoLoading(true)
    try {
      const data = await forwardGeocodeAddress(query)
      if (!data) {
        toast.warning('Not Found', 'Could not locate that address on the map.')
        return
      }
      const lat = data.latitude
      const lng = data.longitude
      setMapLat(lat)
      setMapLng(lng)
      setMapModified(true)
      if (markerRef.current) markerRef.current.setPosition({ lat, lng })
      if (circleRef.current) circleRef.current.setCenter({ lat, lng })
      fitToCircle()

      // Reverse geocode to get clean address
      const geo = await reverseGeocodeCoordinates(lat, lng)
      if (geo && geo.formattedAddress) {
        setMapDetectedAddress(geo.formattedAddress)
        setMapDetectedCity(geo.city)
      }
      toast.success('Location Fetched', 'Pin moved to the address location.')
    } catch (err) {
      toast.error('Failed', 'Geocoding service is unreachable right now.')
    } finally {
      setGeoLoading(false)
    }
  }

  // Auto-detect the device's current GPS location and reverse-geocode address
  const [locating, setLocating] = useState(false)
  const [pinResolving, setPinResolving] = useState(false)

  // Resolve address directly from current map pin coordinates
  const resolveAddressFromMapPin = async (customLat, customLng) => {
    const lat = customLat ?? mapLat
    const lng = customLng ?? mapLng
    setPinResolving(true)
    try {
      const geo = await reverseGeocodeCoordinates(lat, lng)
      if (geo && geo.formattedAddress) {
        setMapDetectedAddress(geo.formattedAddress)
        setMapDetectedCity(geo.city)
        setMapModified(true)
        toast.success('Address Resolved from Pin', `${geo.formattedAddress} (${geo.city})`)
      } else {
        toast.warning('Unable to Resolve', 'Could not get postal address for these coordinates.')
      }
    } catch (err) {
      toast.error('Resolution Error', 'Unable to resolve address.')
    } finally {
      setPinResolving(false)
    }
  }

  const detectCurrentLocation = async () => {
    setLocating(true)
    try {
      const loc = await detectCurrentLocationWithFallback({ gpsOnly: true })
      if (loc && loc.latitude && loc.longitude) {
        setMapLat(loc.latitude)
        setMapLng(loc.longitude)
        setMapModified(true)
        if (markerRef.current) markerRef.current.setPosition({ lat: loc.latitude, lng: loc.longitude })
        if (circleRef.current) circleRef.current.setCenter({ lat: loc.latitude, lng: loc.longitude })
        fitToCircle()

        setMapDetectedAddress(loc.formattedAddress)
        setMapDetectedCity(loc.city)
        toast.success(
          'GPS Location Detected',
          `${loc.formattedAddress} (${loc.city})`
        )
      } else {
        toast.warning('Unable to Detect', 'Could not detect GPS position. You can drag the pin on map.')
      }
    } catch (err) {
      console.error('Detection error:', err)
      toast.error('GPS Error', err?.message || 'Unable to auto-detect GPS location.')
    } finally {
      setLocating(false)
    }
  }

  const handleMapSearchSelect = (item) => {
    if (!item) return
    const lat = item.latitude
    const lng = item.longitude
    setMapLat(lat)
    setMapLng(lng)
    setMapModified(true)
    if (markerRef.current) markerRef.current.setPosition({ lat, lng })
    if (circleRef.current) circleRef.current.setCenter({ lat, lng })
    fitToCircle()

    setMapDetectedAddress(item.formattedAddress || item.displayName)
    if (item.city) setMapDetectedCity(item.city)
    toast.success('Location Selected', `Pin moved to ${item.formattedAddress || item.displayName}`)
  }

  // 3D Map View State & Controls
  const [is3DMode, setIs3DMode] = useState(false)
  const [mapHeading, setMapHeading] = useState(0)

  const toggle3DMode = () => {
    if (!mapRef.current) return
    const nextState = !is3DMode
    setIs3DMode(nextState)

    if (nextState) {
      mapRef.current.setMapTypeId('hybrid')
      mapRef.current.setTilt(45)
      mapRef.current.setHeading(mapHeading)
      toast.success('3D View Enabled', '3D Satellite & Building perspective active.')
    } else {
      mapRef.current.setMapTypeId('roadmap')
      mapRef.current.setTilt(0)
      mapRef.current.setHeading(0)
      setMapHeading(0)
      toast.success('2D View Enabled', 'Standard roadmap view active.')
    }
  }

  const rotate3D = (direction = 1) => {
    if (!mapRef.current) return
    const newHeading = (mapHeading + direction * 45 + 360) % 360
    setMapHeading(newHeading)
    mapRef.current.setHeading(newHeading)
  }

  // Fullscreen view of the coverage map.
  const toggleFullscreen = () => {
    const el = mapContainerRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      const req = el.requestFullscreen || el.webkitRequestFullscreen
      if (req) req.call(el)
      else toast.warning('Not Supported', 'Fullscreen is not available in this browser.')
    } else {
      document.exitFullscreen?.()
    }
  }

  // On entering/leaving fullscreen, let Google Maps recompute its size and re-fit the circle.
  useEffect(() => {
    const onFsChange = () => {
      setTimeout(() => {
        if (mapRef.current && window.google?.maps) {
          window.google.maps.event.trigger(mapRef.current, 'resize')
          if (circleRef.current) {
            mapRef.current.setCenter(circleRef.current.getCenter())
          }
          fitToCircle()
        }
      }, 180)
    }
    document.addEventListener('fullscreenchange', onFsChange)
    document.addEventListener('webkitfullscreenchange', onFsChange)
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange)
      document.removeEventListener('webkitfullscreenchange', onFsChange)
    }
  }, [])

  // Open address modal with fresh data
  const handleOpenAddressModal = () => {
    setEditAddressText(restaurant?.address && restaurant?.address !== 'N/A' ? restaurant.address : '')
    setEditCityText(restaurant?.city || 'Kanpur')
    setEditRadiusText(String(restaurant?.delivery_radius_km || 10))
    setAddressModalOpen(true)
  }

  const [addressLocating, setAddressLocating] = useState(false)
  const handleLocateAddressInModal = async () => {
    if (!editAddressText.trim()) return
    setAddressLocating(true)
    try {
      const query = [editAddressText, editCityText].filter(Boolean).join(', ')
      const data = await forwardGeocodeAddress(query)
      if (data && data.latitude && data.longitude) {
        setMapLat(data.latitude)
        setMapLng(data.longitude)
        setMapModified(true)
        if (data.city) setEditCityText(data.city)
        if (data.formattedAddress) setEditAddressText(data.formattedAddress)
        if (markerRef.current) markerRef.current.setPosition({ lat: data.latitude, lng: data.longitude })
        if (circleRef.current) circleRef.current.setCenter({ lat: data.latitude, lng: data.longitude })
        toast.success('Address Located on Map', `${data.formattedAddress || query}`)
      } else {
        toast.warning('Not Found', 'Could not find coordinates for this address on map.')
      }
    } catch (e) {
      toast.error('Search Error', 'Unable to geocode address on map.')
    } finally {
      setAddressLocating(false)
    }
  }

  // Populate address modal fields directly from current map pin
  const handleAutoPopulateFromPin = async () => {
    setPinResolving(true)
    try {
      const geo = await reverseGeocodeCoordinates(mapLat, mapLng)
      if (geo && geo.formattedAddress) {
        setEditAddressText(geo.formattedAddress)
        if (geo.city) setEditCityText(geo.city)
        toast.success('Address Resolved from Pin', `${geo.formattedAddress} (${geo.city})`)
      } else {
        toast.warning('Unable to Resolve', 'Could not get postal address for these coordinates.')
      }
    } catch (err) {
      toast.error('Resolution Error', 'Unable to resolve address.')
    } finally {
      setPinResolving(false)
    }
  }

  // Save address from dedicated modal
  const handleSaveAddressModal = async (e) => {
    if (e) e.preventDefault()
    if (!editAddressText.trim()) {
      toast.warning('Address Required', 'Please enter restaurant full address.')
      return
    }
    setAddressSaving(true)
    try {
      const payload = {
        address: editAddressText.trim(),
        city: editCityText.trim() || 'Kanpur',
        delivery_radius_km: Number(editRadiusText) || 10,
        latitude: mapLat,
        longitude: mapLng,
      }
      const res = await restaurantsApi.updateRestaurant(id, payload)
      const updated = res?.data || res
      if (updated) {
        setRestaurantData(updated)
      }
      toast.success('Operating Specs Updated', 'Address and location updated successfully.')
      setAddressModalOpen(false)
      retry()
    } catch (err) {
      toast.error('Update Failed', err.message || 'Unable to update address.')
    } finally {
      setAddressSaving(false)
    }
  }

  // Save map settings and auto-detected address
  const handleSaveMapSettings = async () => {
    setMapSaveLoading(true)
    try {
      let finalAddress = mapDetectedAddress
      let finalCity = mapDetectedCity

      // If user moved the pin or has pin coordinates, auto-resolve address if not already resolved!
      if (!finalAddress) {
        const geo = await reverseGeocodeCoordinates(mapLat, mapLng)
        if (geo && geo.formattedAddress) {
          finalAddress = geo.formattedAddress
          finalCity = geo.city
        }
      }

      const payload = {
        latitude: mapLat,
        longitude: mapLng,
        delivery_radius_km: mapRadius,
      }
      if (finalAddress) {
        payload.address = finalAddress
      }
      if (finalCity) {
        payload.city = finalCity
      }

      const res = await restaurantsApi.updateRestaurant(id, payload)
      const updated = res?.data || res
      if (updated) {
        setRestaurantData(updated)
      }
      toast.success('Operating Specs & Address Updated', `Saved address: ${finalAddress || restaurant?.address}`)
      setMapModified(false)
      setMapDetectedAddress('')
      setMapDetectedCity('')
      retry()
    } catch (err) {
      toast.error('Failed', err.message || 'Unable to save delivery area.')
    } finally {
      setMapSaveLoading(false)
    }
  }

  // Google Maps initialization
  const [mapLoadError, setMapLoadError] = useState(null)

  useEffect(() => {
    if (activeTab !== 'overview' || !restaurant) return

    let isMounted = true
    let dragListener = null

    const initMap = async () => {
      let gmaps
      try {
        gmaps = await loadGoogleMaps()
      } catch (err) {
        if (isMounted) setMapLoadError(err.message || 'Failed to load Google Maps.')
        return
      }
      if (!isMounted) return
      setMapLoadError(null)

      const lat = Number(restaurant.latitude) || 26.8467
      const lng = Number(restaurant.longitude) || 80.9462
      const radiusKm = restaurant.delivery_radius_km ?? 7

      if (mapRef.current) {
        mapRef.current.setCenter({ lat, lng })
        if (markerRef.current) markerRef.current.setPosition({ lat, lng })
        if (circleRef.current) {
          circleRef.current.setCenter({ lat, lng })
          circleRef.current.setRadius(radiusKm * 1000)
        }
        fitToCircle()
        return
      }

      const mapDiv = document.getElementById('delivery-map')
      if (!mapDiv) return

      const map = new gmaps.Map(mapDiv, {
        center: { lat, lng },
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false, // custom fullscreen button is used instead
        clickableIcons: false,
      })
      mapRef.current = map

      const marker = new gmaps.Marker({
        position: { lat, lng },
        map,
        draggable: true,
      })
      markerRef.current = marker

      const circle = new gmaps.Circle({
        center: { lat, lng },
        radius: radiusKm * 1000,
        map,
        strokeColor: '#2845D6',
        strokeWeight: 2,
        fillColor: '#2845D6',
        fillOpacity: 0.15,
      })
      circleRef.current = circle

      gmaps.event.addListenerOnce(map, 'idle', () => fitToCircle())

      dragListener = marker.addListener('dragend', async () => {
        const position = marker.getPosition()
        const newLat = position.lat()
        const newLng = position.lng()
        setMapLat(newLat)
        setMapLng(newLng)
        circle.setCenter({ lat: newLat, lng: newLng })
        setMapModified(true)
        fitToCircle()

        // Auto reverse-geocode on pin drag
        const geo = await reverseGeocodeCoordinates(newLat, newLng)
        if (geo && geo.formattedAddress) {
          setMapDetectedAddress(geo.formattedAddress)
          setMapDetectedCity(geo.city)
          toast.success('Address Detected for Pin', `${geo.formattedAddress} (${geo.city})`)
        }
      })
    }

    initMap()

    return () => {
      isMounted = false
      if (dragListener) window.google?.maps?.event?.removeListener(dragListener)
      // Null the refs so re-mounting the tab creates a fresh map against the new DOM node.
      mapRef.current = null
      markerRef.current = null
      circleRef.current = null
    }
  }, [activeTab, restaurant])


  const handleToggleOnline = async (val) => {
    try {
      await restaurantsApi.toggleStatus(id, { is_online: val })
      toast.success('Store State Updated', `Restaurant is now ${val ? 'Online' : 'Offline'}.`)
      retry()
    } catch (err) {
      toast.error('Failed', err.message || 'Unable to toggle store state.')
    }
  }

  useEffect(() => {
    if (restaurant) {
      setSettingsActive(restaurant.status === 'ACTIVE')
      setSettingsVegOnly(!!restaurant.is_veg_only)
      setSettingsRadius(String(restaurant.delivery_radius_km ?? '7'))
      setSettingsMinOrder(String(restaurant.min_order ?? '150'))
      setSettingsCommission(String(restaurant.commission ?? '15'))
      setSettingsCycle(restaurant.settlement_cycle ?? 'WEEKLY')
      setSettingsName(restaurant.name || '')
      setSettingsOwnerName(restaurant.owner_name || '')
      setSettingsMobile(restaurant.mobile || '')
      setSettingsEmail(restaurant.owner_email || restaurant.email || '')
      setSettingsOwnerMobile(restaurant.owner_mobile || restaurant.mobile || '')
      setSettingsPassword('')
      setSettingsPin('')
      setSettingsLoginActive(restaurant.owner_status === 'ACTIVE')

      if (restaurant.operating_hours && restaurant.operating_hours.length > 0) {
        const sorted = [...restaurant.operating_hours].sort((a, b) => a.day_of_week - b.day_of_week)
        setHoursList(sorted.map(h => ({
          day_of_week: h.day_of_week,
          opening_time: h.opening_time ? h.opening_time.substring(0, 5) : '09:00',
          closing_time: h.closing_time ? h.closing_time.substring(0, 5) : '23:00',
          is_closed: !!h.is_closed
        })))
      } else {
        const defaults = []
        for (let d = 0; d <= 6; d++) {
          defaults.push({ day_of_week: d, opening_time: '09:00', closing_time: '23:00', is_closed: false })
        }
        setHoursList(defaults)
      }
    }
  }, [restaurant])

  const handleSaveSpecs = async (e) => {
    e?.preventDefault()
    setSaveSpecsLoading(true)
    try {
      const payload = {
        name: settingsName,
        owner_name: settingsOwnerName,
        mobile: settingsMobile,
        email: restaurant.email,
        status: settingsActive ? 'ACTIVE' : 'SUSPENDED',
        is_veg_only: settingsVegOnly,
        delivery_radius_km: Number(settingsRadius),
        min_order: Number(settingsMinOrder),
        commission: Number(settingsCommission),
        settlement_cycle: settingsCycle,
      }
      await restaurantsApi.updateRestaurant(id, payload)
      toast.success('Settings Updated', 'Operational specs and status updated successfully.')
      retry()
    } catch (err) {
      toast.error('Failed', err.message || 'Unable to update operational specs.')
    } finally {
      setSaveSpecsLoading(false)
    }
  }

  const handleSaveHours = async (e) => {
    e?.preventDefault()
    setSaveHoursLoading(true)
    try {
      const formattedHours = hoursList.map(h => ({
        day_of_week: h.day_of_week,
        opening_time: h.opening_time.length === 5 ? `${h.opening_time}:00` : h.opening_time,
        closing_time: h.closing_time.length === 5 ? `${h.closing_time}:00` : h.closing_time,
        is_closed: h.is_closed
      }))
      await restaurantsApi.updateOperatingHours(id, formattedHours)
      toast.success('Hours Updated', 'Restaurant timing and weekly off days updated successfully.')
      retry()
    } catch (err) {
      toast.error('Failed', err.message || 'Unable to update operating hours.')
    } finally {
      setSaveHoursLoading(false)
    }
  }

  const handleSaveLogin = async (e) => {
    e?.preventDefault()
    if (!settingsEmail.trim()) {
      toast.warning('Email Required', 'Please enter a login email address.')
      return
    }
    if (!settingsOwnerMobile.trim()) {
      toast.warning('Mobile Required', 'Please enter a login mobile number.')
      return
    }
    if (settingsPin.trim() && !/^\d{4,6}$/.test(settingsPin.trim())) {
      toast.warning('Invalid PIN', 'Login PIN must be between 4 and 6 numeric digits.')
      return
    }
    setSaveLoginLoading(true)
    try {
      const payload = {
        owner_email: settingsEmail.trim(),
        owner_mobile: settingsOwnerMobile.trim(),
        owner_status: settingsLoginActive ? 'ACTIVE' : 'SUSPENDED',
      }
      if (settingsPassword.trim()) {
        payload.password = settingsPassword.trim()
      }
      if (settingsPin.trim()) {
        payload.login_pin = settingsPin.trim()
      }
      await restaurantsApi.updateRestaurant(id, payload)
      toast.success('Credentials Updated', 'Restaurant login credentials updated successfully.')
      setSettingsPassword('')
      setSettingsPin('')
      retry()
    } catch (err) {
      toast.error('Failed', err.message || 'Unable to update login credentials.')
    } finally {
      setSaveLoginLoading(false)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Store },
    { id: 'menu', label: 'Menu & Items', icon: UtensilsCrossed },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'earnings', label: 'Earnings & Commission', icon: Wallet },
    { id: 'settlements', label: 'Settlements', icon: Clock },
    { id: 'reports', label: 'Performance', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ]

  if (loading && !restaurant) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-3 border-slate-200 border-t-[#2845D6] rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Loading restaurant details...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/restaurants')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Restaurants</span>
        </button>
      </div>

      {/* Restaurant Header Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#2845D6]/10 text-[#2845D6] dark:bg-blue-900/40 dark:text-blue-400 text-2xl font-black flex items-center justify-center shadow-xs">
            {restaurant?.name?.charAt(0) || 'R'}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">{restaurant?.name}</h2>
              <StatusBadge status={restaurant?.status} size="xs" />
              <StatusBadge status={restaurant?.is_online ? 'ONLINE' : 'OFFLINE'} size="xs" />
              {restaurant?.is_veg_only && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  Pure Veg
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
              <span className="flex items-center gap-1 font-bold text-amber-500">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {restaurant?.rating || '4.5'} ({restaurant?.total_reviews || 0} reviews)
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {restaurant?.city}
              </span>
              <span>&bull;</span>
              <span>Commission: <strong>{restaurant?.commission}%</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2 p-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs">
            <span className="text-slate-600 dark:text-slate-300 font-semibold">Store State:</span>
            <button
              type="button"
              onClick={() => handleToggleOnline(!restaurant?.is_online)}
              className={`font-bold ${restaurant?.is_online ? 'text-emerald-600' : 'text-slate-400'}`}
            >
              {restaurant?.is_online ? 'OPEN' : 'CLOSED'}
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={Edit2}
            onClick={() => setEditModalOpen(true)}
          >
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Contact & Owner</h4>
              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="text-slate-400 block">Owner Name:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{restaurant?.owner_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Mobile:</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{formatPhone(restaurant?.mobile)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Email:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{restaurant?.email || '-'}</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Operating Specs</h4>
                <button
                  type="button"
                  onClick={handleOpenAddressModal}
                  className="flex items-center gap-1 text-[11px] font-bold text-[#2845D6] dark:text-blue-400 hover:underline cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit Address</span>
                </button>
              </div>
              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="text-slate-400 block">Address:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 leading-snug">{restaurant?.address || 'Address not set'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">City:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 leading-snug">{restaurant?.city || 'Kanpur'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Operating Hours:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{restaurant?.timing}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Delivery Radius:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{restaurant?.delivery_radius_km} KM</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Commercial Terms</h4>
              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="text-slate-400 block">Dastak Commission:</span>
                  <span className="text-base font-black text-[#2845D6] dark:text-blue-400">{restaurant?.commission}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Settlement Cycle:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{restaurant?.settlement_cycle}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Minimum Order Amount:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(restaurant?.min_order)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Area Map */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#2845D6]" />
                  Delivery Area Coverage Map
                </h3>
                <p className="text-[11px] text-slate-400">
                  Shows where this restaurant can deliver. Adjust the radius slider or drag the marker to set custom location.
                </p>
              </div>
              <div className="w-full sm:w-72">
                <AddressAutocomplete
                  placeholder="Search location to move pin..."
                  onSelect={handleMapSearchSelect}
                  className="!py-1.5 text-xs"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
              {/* Map controls */}
              <div className="lg:col-span-1 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex justify-between">
                      <span>Delivery Radius</span>
                      <span className="font-bold text-[#2845D6]">{mapRadius} KM</span>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="30"
                      value={mapRadius}
                      onChange={handleMapRadiusChange}
                      className="w-full accent-[#2845D6] cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400 font-medium">
                      <span>1 KM</span>
                      <span>15 KM</span>
                      <span>30 KM</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Coordinates</span>
                    <div className="font-mono text-[11px] bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 space-y-1">
                      <div className="flex justify-between">
                        <span>Latitude:</span>
                        <span className="font-bold text-slate-850 dark:text-slate-200">{mapLat.toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Longitude:</span>
                        <span className="font-bold text-slate-850 dark:text-slate-200">{mapLng.toFixed(6)}</span>
                      </div>
                    </div>
                    {mapDetectedAddress && (
                      <div className="p-2.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900 text-[11px] space-y-1">
                        <span className="text-[10px] font-bold text-[#2845D6] dark:text-blue-400 uppercase tracking-wider block">Auto-Detected Address</span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 leading-snug">{mapDetectedAddress}</p>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{mapDetectedCity}</span>
                      </div>
                    )}
                    <span className="text-[10px] text-slate-400 leading-normal block">
                      *Drag the marker or click auto-detect to adjust location & reverse-geocode address.
                    </span>
                  </div>

                  <div className="space-y-2 pt-1">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Navigation}
                      className="w-full bg-[#2845D6] hover:bg-[#1f37b0] text-white font-bold"
                      onClick={detectCurrentLocation}
                      loading={locating}
                    >
                      {locating ? 'Detecting GPS…' : 'Auto-Detect Current GPS'}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      icon={MapPin}
                      className="w-full border-blue-200 text-[#2845D6] hover:bg-blue-50 dark:hover:bg-blue-950 font-bold"
                      onClick={() => resolveAddressFromMapPin(mapLat, mapLng)}
                      loading={pinResolving}
                    >
                      {pinResolving ? 'Resolving…' : 'Detect Address from Map Pin'}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-slate-600 dark:text-slate-300"
                      onClick={fetchLocationFromAddress}
                      loading={geoLoading}
                    >
                      {geoLoading ? 'Locating…' : 'Find Pin from Saved Address'}
                    </Button>
                  </div>
                </div>

                {mapModified && (
                  <Button
                    onClick={handleSaveMapSettings}
                    variant="primary"
                    size="sm"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md animate-bounce"
                    loading={mapSaveLoading}
                  >
                    Save Delivery Area & Address
                  </Button>
                )}
              </div>

              {/* Map container */}
              <div
                ref={mapContainerRef}
                className="lg:col-span-3 h-[320px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative bg-slate-50 dark:bg-slate-900"
              >
                <div id="delivery-map" className="w-full h-full z-0" />
                {mapLoadError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-50 dark:bg-slate-900 text-center p-4">
                    <MapPin className="w-6 h-6 text-slate-300" />
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Map failed to load</p>
                    <p className="text-[11px] text-slate-400 max-w-xs">{mapLoadError}</p>
                  </div>
                )}
                {/* Map Overlay Controls */}
                <div className="absolute top-2 right-2 z-[1000] flex items-center gap-1.5 select-none">
                  {is3DMode && (
                    <div className="flex items-center gap-1 bg-white/95 dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 shadow-md">
                      <button
                        type="button"
                        onClick={() => rotate3D(-1)}
                        title="Rotate View Left (-45°)"
                        className="p-1.5 rounded-md text-slate-600 dark:text-slate-200 hover:text-[#2845D6] hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] font-mono font-bold px-1 text-slate-500">{mapHeading}°</span>
                      <button
                        type="button"
                        onClick={() => rotate3D(1)}
                        title="Rotate View Right (+45°)"
                        className="p-1.5 rounded-md text-slate-600 dark:text-slate-200 hover:text-[#2845D6] hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={toggle3DMode}
                    title={is3DMode ? "Switch to 2D Roadmap View" : "Enable 3D Aerial Satellite View"}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border shadow-md font-bold text-xs transition-all cursor-pointer ${
                      is3DMode
                        ? 'bg-[#2845D6] text-white border-[#2845D6] ring-2 ring-[#2845D6]/30 shadow-blue-500/20'
                        : 'bg-white/95 dark:bg-slate-800/95 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-[#2845D6] hover:bg-white'
                    }`}
                  >
                    <Box className={`w-3.5 h-3.5 ${is3DMode ? 'animate-pulse' : ''}`} />
                    <span>{is3DMode ? '3D Active' : '3D View'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    title="View map in fullscreen"
                    className="p-2 rounded-lg bg-white/95 dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 shadow-md text-slate-600 dark:text-slate-200 hover:text-[#2845D6] hover:bg-white transition-colors cursor-pointer"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Menu */}
      {activeTab === 'menu' && <MenuManager restaurantId={id} />}

      {/* Tab 3: Orders */}
      {activeTab === 'orders' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Recent Restaurant Orders</h3>
          <DataTable
            columns={[
              { key: 'id', header: 'Order ID', render: (r) => <span className="font-mono font-bold text-[#2845D6]">#{r.id}</span> },
              { key: 'customer', header: 'Customer' },
              { key: 'amount', header: 'Amount', align: 'right', render: (r) => <span className="font-bold">{formatCurrency(r.amount)}</span> },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} size="xs" /> },
              { key: 'time', header: 'Time', render: (r) => <span className="text-slate-400">{formatDateTime(r.time)}</span> },
            ]}
            data={ordersData || []}
            loading={ordersLoading}
            emptyTitle="No orders yet"
          />
        </div>
      )}

      {/* Tab 4: Earnings */}
      {activeTab === 'earnings' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Lifetime Gross Sales</span>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
              {formatCurrency(restaurant?.lifetime_sales)}
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Dastak Commission</span>
            <div className="text-2xl font-black text-[#2845D6] dark:text-blue-400 mt-2">
              {formatCurrency((restaurant?.lifetime_sales || 0) * ((restaurant?.commission || 15) / 100))}
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Settlement</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
              {formatCurrency(restaurant?.pending_settlement)}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Settlements */}
      {activeTab === 'settlements' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Settlement History</h3>
          <DataTable
            columns={[
              { key: 'reference', header: 'Reference ID', render: (r) => <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{r.reference}</span> },
              { key: 'period', header: 'Period', render: (r) => <span className="font-medium">{r.period || 'N/A'}</span> },
              { key: 'amount', header: 'Amount', align: 'right', render: (r) => <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(r.amount)}</span> },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} size="xs" /> },
              { key: 'created_at', header: 'Settled At', render: (r) => <span className="text-slate-400">{formatDateTime(r.created_at)}</span> },
            ]}
            data={settlements || []}
            loading={settlementsLoading}
            emptyTitle="No settlements yet"
            emptyDescription="Payout records will show up here once processed."
          />
        </div>
      )}

      {/* Tab 6: Performance */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Key Metrics Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Gross Sales</span>
              <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">{formatCurrency(restaurant?.lifetime_sales)}</div>
              <span className="text-[10px] text-emerald-500 font-semibold block mt-1">↑ 12.5% from last month</span>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Completed Orders</span>
              <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">{restaurant?.total_orders || 0}</div>
              <span className="text-[10px] text-emerald-500 font-semibold block mt-1">↑ 8.3% from last month</span>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Avg. Order Value (AOV)</span>
              <div className="text-xl font-black text-[#2845D6] dark:text-blue-400 mt-1">
                {formatCurrency(restaurant?.total_orders > 0 ? (restaurant.lifetime_sales / restaurant.total_orders) : 0)}
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">Based on lifetime orders</span>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Customer Satisfaction</span>
              <div className="text-xl font-black text-amber-500 mt-1 flex items-center gap-1.5">
                ★ {restaurant?.rating || '4.5'}
                <span className="text-xs text-slate-400 font-normal">({restaurant?.total_reviews || 0} reviews)</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">Overall rating on app</span>
            </div>
          </div>

          {/* Sales Breakdown by Category & Order Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4 lg:col-span-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recent Order Performance</h3>
              <DataTable
                columns={[
                  { key: 'id', header: 'Order ID', render: (r) => <span className="font-mono font-bold text-[#2845D6]">#{r.id}</span> },
                  { key: 'customer', header: 'Customer' },
                  { key: 'amount', header: 'Amount', align: 'right', render: (r) => <span className="font-bold">{formatCurrency(r.amount)}</span> },
                  { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} size="xs" /> },
                ]}
                data={ordersData?.slice(0, 5) || []}
                loading={ordersLoading}
                emptyTitle="No recent orders"
              />
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Menu Category Volume</h3>
              <div className="space-y-3.5">
                {(menuData || []).map((cat, i) => {
                  const count = cat.items?.length || 0;
                  const maxCount = Math.max(...(menuData || []).map(c => c.items?.length || 1));
                  const percent = Math.round((count / maxCount) * 100);
                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{cat.category}</span>
                        <span className="text-slate-400 font-mono">{count} items</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                        <div className="h-full bg-[#2845D6] rounded-full" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
                {(menuData || []).length === 0 && (
                  <div className="text-center py-6 text-xs text-slate-400">No categories found in menu.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: Settings */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Operational Status & General Settings */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4 h-fit">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Operational Specs</h3>
              <p className="text-[11px] text-slate-400">Manage status, commission, delivery radius, and minimum order values.</p>
            </div>
            <form onSubmit={handleSaveSpecs} className="space-y-4">
              <div className="space-y-3 pb-3 border-b border-slate-100 dark:border-slate-700/60">
                <Switch
                  checked={settingsActive}
                  onChange={setSettingsActive}
                  label="Visible on User App (Active)"
                  description="When turned off, the restaurant is hidden from users."
                />
                <Switch
                  checked={settingsVegOnly}
                  onChange={setSettingsVegOnly}
                  label="Pure Veg Outlet"
                  description="Mark as 100% vegetarian restaurant"
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <Input
                  label="Restaurant Name"
                  required
                  value={settingsName}
                  onChange={(e) => setSettingsName(e.target.value)}
                />
                <Input
                  label="Owner Name"
                  required
                  value={settingsOwnerName}
                  onChange={(e) => setSettingsOwnerName(e.target.value)}
                />
                <Input
                  label="Mobile Number"
                  required
                  value={settingsMobile}
                  onChange={(e) => setSettingsMobile(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Commission (%)"
                  type="number"
                  required
                  value={settingsCommission}
                  onChange={(e) => setSettingsCommission(e.target.value)}
                />
                <CustomSelect
                  label="Settlement Cycle"
                  value={settingsCycle}
                  onChange={setSettingsCycle}
                  options={[
                    { value: 'DAILY', label: 'Daily' },
                    { value: 'WEEKLY', label: 'Weekly' },
                    { value: 'MONTHLY', label: 'Monthly' },
                  ]}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <AmountInput
                  label="Min Order"
                  value={settingsMinOrder}
                  onChange={(e) => setSettingsMinOrder(e.target.value)}
                />
                <Input
                  label="Radius (KM)"
                  type="number"
                  value={settingsRadius}
                  onChange={(e) => setSettingsRadius(e.target.value)}
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex justify-end">
                <Button type="submit" variant="primary" size="sm" loading={saveSpecsLoading}>
                  Save Specs
                </Button>
              </div>
            </form>
          </div>

          {/* Card 2: Weekly Holidays & Timing */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4 lg:col-span-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Restaurant Timing & Weekly Offs</h3>
              <p className="text-[11px] text-slate-400">Configure daily opening/closing hours. Uncheck day to mark it as weekly off (holiday).</p>
            </div>
            <form onSubmit={handleSaveHours} className="space-y-4">
              <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {hoursList.map((day, idx) => {
                  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                  return (
                    <div key={day.day_of_week} className="py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 w-40">
                        <input
                          type="checkbox"
                          checked={!day.is_closed}
                          onChange={(e) => {
                            const updated = [...hoursList];
                            updated[idx].is_closed = !day.is_closed; // wait, let's toggle properly
                            updated[idx].is_closed = !e.target.checked;
                            setHoursList(updated);
                          }}
                          className="rounded text-[#2845D6] focus:ring-[#2845D6]"
                        />
                        <span className={`font-bold ${day.is_closed ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-200'}`}>
                          {dayNames[day.day_of_week]}
                        </span>
                        {day.is_closed && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 font-bold text-[9px]">Closed</span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 sm:ml-auto">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">Open:</span>
                          <input
                            type="time"
                            disabled={day.is_closed}
                            value={day.opening_time}
                            onChange={(e) => {
                              const updated = [...hoursList];
                              updated[idx].opening_time = e.target.value;
                              setHoursList(updated);
                            }}
                            className="p-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 disabled:opacity-50 text-[11px] focus:outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">Close:</span>
                          <input
                            type="time"
                            disabled={day.is_closed}
                            value={day.closing_time}
                            onChange={(e) => {
                              const updated = [...hoursList];
                              updated[idx].closing_time = e.target.value;
                              setHoursList(updated);
                            }}
                            className="p-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 disabled:opacity-50 text-[11px] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex justify-end">
                <Button type="submit" variant="primary" size="sm" loading={saveHoursLoading}>
                  Save Timings
                </Button>
              </div>
            </form>
          </div>

          {/* Card 3: Login Credentials */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4 h-fit">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Login Credentials</h3>
              <p className="text-[11px] text-slate-400">Update login email, password, mobile number, and security PIN for the restaurant owner.</p>
            </div>
            <form onSubmit={handleSaveLogin} className="space-y-4">
              <div className="space-y-3">
                <div className="pb-3 border-b border-slate-100 dark:border-slate-700/60">
                  <Switch
                    checked={settingsLoginActive}
                    onChange={setSettingsLoginActive}
                    label="Allow Partner App Login"
                    description="If turned off, the restaurant owner cannot log in to the app."
                  />
                </div>
                <Input
                  label="Login Email"
                  type="email"
                  required
                  placeholder="owner@restaurant.com"
                  value={settingsEmail}
                  onChange={(e) => setSettingsEmail(e.target.value)}
                />
                <Input
                  label="Email Login Password"
                  type="password"
                  placeholder="•••••••• (leave blank to keep current)"
                  value={settingsPassword}
                  onChange={(e) => setSettingsPassword(e.target.value)}
                />
                <div className="pt-1.5 border-t border-slate-100 dark:border-slate-700/60" />
                <Input
                  label="Login Mobile"
                  type="text"
                  required
                  placeholder="e.g. 9876543210"
                  value={settingsOwnerMobile}
                  onChange={(e) => setSettingsOwnerMobile(e.target.value)}
                />
                <Input
                  label="Mobile Login PIN (4-6 digits)"
                  type="password"
                  placeholder="e.g. 1234 (leave blank to keep current)"
                  value={settingsPin}
                  onChange={(e) => setSettingsPin(e.target.value)}
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex justify-end">
                <Button type="submit" variant="primary" size="sm" loading={saveLoginLoading}>
                  Update Credentials
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Full Profile Modal */}
      <RestaurantFormModal
        isOpen={editModalOpen}
        restaurant={restaurant}
        onClose={() => setEditModalOpen(false)}
        onSaved={retry}
      />

      {/* Quick Edit Operating Address & Specs Modal */}
      <Modal
        isOpen={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        title="Update Operating Address & Specs"
        subtitle="Manage restaurant physical address, operating city, and delivery radius."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveAddressModal} className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Full Physical Address
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleLocateAddressInModal}
                disabled={addressLocating || !editAddressText.trim()}
                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Search className={`w-3 h-3 ${addressLocating ? 'animate-spin' : ''}`} />
                <span>{addressLocating ? 'Locating...' : 'Locate on Map'}</span>
              </button>
              <button
                type="button"
                onClick={handleAutoPopulateFromPin}
                disabled={pinResolving}
                className="text-[11px] font-bold text-[#2845D6] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Navigation className={`w-3 h-3 ${pinResolving ? 'animate-spin' : ''}`} />
                <span>{pinResolving ? 'Resolving...' : 'Auto-Fill from Map Pin'}</span>
              </button>
            </div>
          </div>

          <AddressAutocomplete
            placeholder="Type address or landmark to auto-suggest (e.g. Swaroop Nagar, Kanpur)"
            value={editAddressText}
            onChange={(e) => setEditAddressText(e.target.value)}
            onSelect={(item) => {
              if (!item) return
              setEditAddressText(item.formattedAddress || item.displayName)
              if (item.city) setEditCityText(item.city)
              if (item.latitude && item.longitude) {
                setMapLat(item.latitude)
                setMapLng(item.longitude)
                setMapModified(true)
                if (markerRef.current) markerRef.current.setPosition({ lat: item.latitude, lng: item.longitude })
                if (circleRef.current) circleRef.current.setCenter({ lat: item.latitude, lng: item.longitude })
              }
            }}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="City"
              placeholder="e.g. Lalganj"
              value={editCityText}
              onChange={(e) => setEditCityText(e.target.value)}
              required
            />
            <Input
              label="Delivery Radius (KM)"
              type="number"
              min="1"
              max="50"
              placeholder="10"
              value={editRadiusText}
              onChange={(e) => setEditRadiusText(e.target.value)}
              required
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 font-mono flex items-center justify-between">
            <span>Center Coordinates:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{mapLat.toFixed(6)}, {mapLng.toFixed(6)}</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddressModalOpen(false)}
              disabled={addressSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={addressSaving}
            >
              Save Address & Specs
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default RestaurantDetails
