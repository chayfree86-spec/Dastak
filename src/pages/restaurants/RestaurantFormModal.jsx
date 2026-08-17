import React, { useState, useRef, useEffect } from 'react'
import { Box } from 'lucide-react'
import { Modal } from '../../components/common/Modal'
import Input from '../../components/common/Input'
import AmountInput from '../../components/common/AmountInput'
import CustomSelect from '../../components/common/CustomSelect'
import Switch from '../../components/common/Switch'
import Button from '../../components/common/Button'
import ImageUpload from '../../components/common/ImageUpload'
import AddressAutocomplete from '../../components/common/AddressAutocomplete'
import { useToast } from '../../context/ToastContext'
import { useKeyboardNav } from '../../hooks/useKeyboardNav'
import restaurantsApi from '../../api/restaurants.api'
import { reverseGeocodeCoordinates, forwardGeocodeAddress, detectCurrentLocationWithFallback } from '../../utils/geocoding'
import { loadGoogleMaps } from '../../utils/googleMapsLoader'

export const RestaurantFormModal = ({
  isOpen,
  onClose,
  restaurant = null,
  onSaved,
}) => {
  const [name, setName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [mobile, setMobile] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('Kanpur')
  const [commission, setCommission] = useState('15')
  const [settlementCycle, setSettlementCycle] = useState('WEEKLY')
  const [minOrder, setMinOrder] = useState('150')
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState('7')
  const [isActive, setIsActive] = useState(true)
  const [isVegOnly, setIsVegOnly] = useState(false)
  const [image, setImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [latitude, setLatitude] = useState(26.8467)
  const [longitude, setLongitude] = useState(80.9462)
  const [geocodeLoading, setGeocodeLoading] = useState(false)
  const [gpsLocating, setGpsLocating] = useState(false)
  const [is3DMode, setIs3DMode] = useState(false)

  const mapRef = useRef(null)
  const markerRef = useRef(null)

  const toggle3DMode = () => {
    if (!mapRef.current) return
    const next = !is3DMode
    setIs3DMode(next)
    if (next) {
      mapRef.current.setMapTypeId('hybrid')
      mapRef.current.setTilt(45)
      toast.success('3D View Enabled', '3D Satellite & Building perspective active.')
    } else {
      mapRef.current.setMapTypeId('roadmap')
      mapRef.current.setTilt(0)
      toast.success('2D View Enabled', 'Standard roadmap view active.')
    }
  }

  const toast = useToast()
  const formRef = useRef(null)

  const prefill = (r) => {
    if (!r) return
    setName(r.name || '')
    setOwnerName(r.owner_name || '')
    setMobile(r.mobile || '')
    setEmail(r.email || '')
    setAddress(r.address && r.address !== 'N/A' ? r.address : '')
    setCity(r.city || 'Kanpur')
    setCommission(r.commission != null ? String(r.commission) : '15')
    setSettlementCycle(r.settlement_cycle || 'WEEKLY')
    setMinOrder(r.min_order != null ? String(r.min_order) : '150')
    setDeliveryRadiusKm(r.delivery_radius_km != null ? String(r.delivery_radius_km) : '7')
    setIsActive(r.status ? r.status === 'ACTIVE' : true)
    setIsVegOnly(!!r.is_veg_only)
    if (r.latitude != null && r.longitude != null) {
      setLatitude(Number(r.latitude))
      setLongitude(Number(r.longitude))
    }
  }

  useEffect(() => {
    if (!isOpen) return
    setErrors({})

    if (restaurant?.id) {
      // Always load the freshest data from the API on open — never show stale/mock values.
      restaurantsApi.getRestaurantDetails(restaurant.id)
        .then((res) => prefill(res?.data ?? res))
        .catch(() => prefill(restaurant))
    } else {
      // Create mode — clean blank form.
      setName('')
      setOwnerName('')
      setMobile('')
      setEmail('')
      setAddress('')
      setCity('Kanpur')
      setCommission('15')
      setSettlementCycle('WEEKLY')
      setMinOrder('150')
      setDeliveryRadiusKm('7')
      setIsActive(true)
      setIsVegOnly(false)
      setImage(null)
      setLatitude(26.8467)
      setLongitude(80.9462)
    }
  }, [isOpen, restaurant?.id])

  // Keep the modal map/marker in sync whenever coordinates change (incl. after fresh fetch).
  useEffect(() => {
    if (mapRef.current && markerRef.current) {
      mapRef.current.setCenter({ lat: latitude, lng: longitude })
      markerRef.current.setPosition({ lat: latitude, lng: longitude })
    }
  }, [latitude, longitude])

  const updateMapMarker = (lat, lng) => {
    setLatitude(lat)
    setLongitude(lng)
    if (mapRef.current) {
      mapRef.current.setCenter({ lat, lng })
      mapRef.current.setZoom(14)
    }
    if (markerRef.current) {
      markerRef.current.setPosition({ lat, lng })
    }
  }

  const handleAutoFetchLocation = async () => {
    setGpsLocating(true)
    try {
      const loc = await detectCurrentLocationWithFallback({ gpsOnly: true })
      if (loc && loc.latitude && loc.longitude) {
        updateMapMarker(loc.latitude, loc.longitude)
        if (loc.formattedAddress) setAddress(loc.formattedAddress)
        if (loc.city) setCity(loc.city)
        toast.success(
          'GPS Location Detected',
          `${loc.formattedAddress || loc.city}`
        )
      } else {
        toast.warning('Unable to Detect', 'Could not determine GPS position. Please drag map pin.')
      }
    } catch (error) {
      toast.error('GPS Error', error?.message || 'Unable to retrieve GPS location.')
    } finally {
      setGpsLocating(false)
    }
  }

  const handleAddressSelect = (item) => {
    if (!item) return
    const formatted = item.formattedAddress || item.displayName
    setAddress(formatted)
    if (item.city) setCity(item.city)
    if (item.latitude && item.longitude) {
      updateMapMarker(item.latitude, item.longitude)
      toast.success('Address & Map Updated', formatted)
    }
  }

  const handleGeocodeAddress = async () => {
    if (!address.trim()) return
    setGeocodeLoading(true)
    try {
      const data = await forwardGeocodeAddress(`${address}, ${city}`)
      if (data) {
        updateMapMarker(data.latitude, data.longitude)
        toast.success('Address Located', 'Map center updated based on address lookup.')
      } else {
        toast.warning('Not Found', 'Could not locate address on map. Please try a different query or drag pin manually.')
      }
    } catch (err) {
      toast.error('Search Failed', 'Unable to reach geocoding service.')
    } finally {
      setGeocodeLoading(false)
    }
  }

  const [modalMapError, setModalMapError] = useState(null)

  useEffect(() => {
    if (!isOpen) return

    let isMounted = true
    let dragListener = null

    const initModalMap = async () => {
      let gmaps
      try {
        gmaps = await loadGoogleMaps()
      } catch (err) {
        if (isMounted) setModalMapError(err.message || 'Failed to load Google Maps.')
        return
      }
      if (!isMounted) return
      setModalMapError(null)

      const lat = Number(latitude) || 26.8467
      const lng = Number(longitude) || 80.9462

      if (mapRef.current) {
        mapRef.current.setCenter({ lat, lng })
        if (markerRef.current) markerRef.current.setPosition({ lat, lng })
        window.google.maps.event.trigger(mapRef.current, 'resize')
        return
      }

      const mapDiv = document.getElementById('modal-delivery-map')
      if (!mapDiv) {
        setTimeout(() => {
          if (isMounted) initModalMap()
        }, 100)
        return
      }

      const map = new gmaps.Map(mapDiv, {
        center: { lat, lng },
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        clickableIcons: false,
      })
      mapRef.current = map

      const marker = new gmaps.Marker({
        position: { lat, lng },
        map,
        draggable: true,
      })
      markerRef.current = marker

      // The modal animates in, so recompute the map size once laid out (fixes blank map).
      setTimeout(() => { if (mapRef.current) gmaps.event.trigger(mapRef.current, 'resize') }, 250)
      setTimeout(() => { if (mapRef.current) gmaps.event.trigger(mapRef.current, 'resize') }, 600)

      dragListener = marker.addListener('dragend', async () => {
        const position = marker.getPosition()
        const newLat = position.lat()
        const newLng = position.lng()
        setLatitude(newLat)
        setLongitude(newLng)
        const geo = await reverseGeocodeCoordinates(newLat, newLng)
        if (geo && geo.formattedAddress) {
          setAddress(geo.formattedAddress)
          if (geo.city) setCity(geo.city)
          toast.success('Address Auto-Updated', `${geo.formattedAddress}`)
        }
      })
    }

    initModalMap()

    return () => {
      isMounted = false
      if (dragListener) window.google?.maps?.event?.removeListener(dragListener)
      mapRef.current = null
      markerRef.current = null
    }
  }, [isOpen])

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    setErrors({})

    const newErrors = {}
    if (!name.trim()) newErrors.name = 'Restaurant name is required.'
    if (!ownerName.trim()) newErrors.ownerName = 'Owner name is required.'
    if (!mobile.trim()) newErrors.mobile = 'Mobile number is required.'
    if (!commission) newErrors.commission = 'Commission is required.'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    try {
      const payload = {
        name,
        owner_name: ownerName,
        mobile,
        email,
        address,
        city,
        commission: Number(commission),
        settlement_cycle: settlementCycle,
        min_order: Number(minOrder),
        delivery_radius_km: Number(deliveryRadiusKm),
        status: isActive ? 'ACTIVE' : 'INACTIVE',
        is_veg_only: isVegOnly,
        latitude: Number(latitude),
        longitude: Number(longitude),
      }

      if (restaurant?.id) {
        await restaurantsApi.updateRestaurant(restaurant.id, payload)
        toast.success('Restaurant Updated', `${name} details updated successfully.`)
      } else {
        await restaurantsApi.createRestaurant(payload)
        toast.success('Restaurant Added', `${name} has been onboarded successfully.`)
      }

      if (onSaved) onSaved()
      onClose()
    } catch (err) {
      toast.error('Operation Failed', err.message || 'Unable to save restaurant.')
    } finally {
      setLoading(false)
    }
  }

  useKeyboardNav(formRef, { autoFocusFirst: true, onSubmit: handleSubmit })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={restaurant ? 'Edit Restaurant' : 'Add New Restaurant'}
      subtitle="Configure partner restaurant details, location, and commission structure."
      maxWidth="max-w-2xl"
    >
      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col max-h-[78vh] sm:max-h-[82vh] -m-1">
        {/* Scrollable Container for inputs to prevent screen overflow */}
        <div className="overflow-y-auto px-1.5 py-1 space-y-4 flex-1 pr-2 max-h-[calc(78vh-70px)] sm:max-h-[calc(82vh-70px)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Restaurant Name"
              required
              placeholder="e.g. Biryani Central"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
            />
            <Input
              label="Owner / Contact Person"
              required
              placeholder="e.g. Rajesh Sharma"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              error={errors.ownerName}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Mobile Number"
              required
              placeholder="e.g. 9876543210"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              error={errors.mobile}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. contact@biryani.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="modal-address-input" className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Full Address <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2 select-none">
                <button
                  type="button"
                  onClick={handleAutoFetchLocation}
                  disabled={gpsLocating}
                  className="px-2 py-0.5 text-[9px] font-bold bg-[#2845D6]/10 hover:bg-[#2845D6]/20 text-[#2845D6] dark:bg-blue-900/30 dark:text-blue-400 rounded-md transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <span className={`w-1.5 h-1.5 rounded-full bg-[#2845D6] ${gpsLocating ? 'animate-ping' : 'animate-pulse'}`}></span>
                  {gpsLocating ? 'Detecting GPS (12s)...' : 'Auto-Detect GPS'}
                </button>
                {address.trim().length > 3 && (
                  <button
                    type="button"
                    onClick={handleGeocodeAddress}
                    className="px-2 py-0.5 text-[9px] font-bold bg-emerald-50 hover:bg-emerald-100/60 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-md transition-all cursor-pointer"
                    disabled={geocodeLoading}
                  >
                    {geocodeLoading ? 'Locating...' : 'Locate on Map'}
                  </button>
                )}
              </div>
            </div>
            <AddressAutocomplete
              id="modal-address-input"
              placeholder="Search or type address (e.g. Swaroop Nagar, Kanpur)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onSelect={handleAddressSelect}
              error={errors.address}
            />
          </div>

          {/* Map Container in Modal */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex justify-between select-none">
              <span>Coordinates (Drag Pin to refine)</span>
              <span className="font-mono">Lat: {Number(latitude).toFixed(5)}, Lng: {Number(longitude).toFixed(5)}</span>
            </div>
            <div className="h-[200px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative bg-slate-50 dark:bg-slate-900">
              <div id="modal-delivery-map" className="w-full h-full z-0" />
              {modalMapError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-slate-50 dark:bg-slate-900 text-center p-4">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Map failed to load</p>
                  <p className="text-[11px] text-slate-400 max-w-xs">{modalMapError}</p>
                </div>
              )}
              <button
                type="button"
                onClick={toggle3DMode}
                title={is3DMode ? "Switch to 2D Roadmap View" : "Enable 3D Aerial Satellite View"}
                className={`absolute top-2 right-2 z-[1000] flex items-center gap-1 px-2 py-1 rounded-md border shadow-md font-bold text-[10px] transition-all cursor-pointer select-none ${
                  is3DMode
                    ? 'bg-[#2845D6] text-white border-[#2845D6] ring-2 ring-[#2845D6]/30 shadow-blue-500/20'
                    : 'bg-white/95 dark:bg-slate-800/95 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-[#2845D6] hover:bg-white'
                }`}
              >
                <Box className={`w-3 h-3 ${is3DMode ? 'animate-pulse' : ''}`} />
                <span>{is3DMode ? '3D Active' : '3D View'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Commission (%)"
              type="number"
              required
              min="0"
              max="100"
              placeholder="15"
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
              error={errors.commission}
            />
            <CustomSelect
              label="Settlement Cycle"
              value={settlementCycle}
              onChange={setSettlementCycle}
              options={[
                { value: 'DAILY', label: 'Daily Settlement' },
                { value: 'WEEKLY', label: 'Weekly (Every Monday)' },
                { value: 'MONTHLY', label: 'Monthly' },
              ]}
            />
            <AmountInput
              label="Minimum Order"
              placeholder="150.00"
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <Input
              label="Delivery Radius (KM)"
              type="number"
              min="1"
              max="50"
              value={deliveryRadiusKm}
              onChange={(e) => setDeliveryRadiusKm(e.target.value)}
            />
            <ImageUpload
              label="Restaurant Logo / Storefront Photo"
              value={image}
              onChange={setImage}
              onRemove={() => setImage(null)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-2 pb-1 border-t border-slate-100 dark:border-slate-700/60">
            <Switch
              checked={isActive}
              onChange={setIsActive}
              label="Active on Platform"
              description="Allow restaurant to take customer orders"
            />
            <Switch
              checked={isVegOnly}
              onChange={setIsVegOnly}
              label="Pure Veg Outlet"
              description="Mark as 100% vegetarian"
            />
          </div>
        </div>

        {/* Pinned/Sticky Footer containing actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 shrink-0">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {restaurant ? 'Update Restaurant' : 'Onboard Restaurant'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default RestaurantFormModal
