import React, { useState, useRef, useEffect } from 'react'
import { Modal } from '../../components/common/Modal'
import Input from '../../components/common/Input'
import AmountInput from '../../components/common/AmountInput'
import CustomSelect from '../../components/common/CustomSelect'
import Switch from '../../components/common/Switch'
import Button from '../../components/common/Button'
import ImageUpload from '../../components/common/ImageUpload'
import { useToast } from '../../context/ToastContext'
import { useKeyboardNav } from '../../hooks/useKeyboardNav'
import restaurantsApi from '../../api/restaurants.api'

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
  const [city, setCity] = useState('Delhi NCR')
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

  const mapRef = useRef(null)
  const markerRef = useRef(null)

  const toast = useToast()
  const formRef = useRef(null)

  useEffect(() => {
    if (restaurant) {
      setName(restaurant.name || '')
      setOwnerName(restaurant.owner_name || '')
      setMobile(restaurant.mobile || '')
      setEmail(restaurant.email || '')
      setAddress(restaurant.address || '')
      setCity(restaurant.city || 'Delhi NCR')
      setCommission(String(restaurant.commission || '15'))
      setSettlementCycle(restaurant.settlement_cycle || 'WEEKLY')
      setMinOrder(String(restaurant.min_order || '150'))
      setDeliveryRadiusKm(String(restaurant.delivery_radius_km || '7'))
      setIsActive(restaurant.status === 'ACTIVE')
      setIsVegOnly(!!restaurant.is_veg_only)
      setLatitude(Number(restaurant.latitude) || 26.8467)
      setLongitude(Number(restaurant.longitude) || 80.9462)
    } else {
      setName('')
      setOwnerName('')
      setMobile('')
      setEmail('')
      setAddress('')
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
    setErrors({})
  }, [restaurant, isOpen])

  const updateMapMarker = (lat, lng) => {
    setLatitude(lat)
    setLongitude(lng)
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 14)
    }
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng])
    }
  }

  const handleAutoFetchLocation = () => {
    if (!navigator.geolocation) {
      toast.warning('Not Supported', 'Geolocation is not supported by your browser.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        updateMapMarker(lat, lng)
        toast.success('Location Fetched', 'Device coordinates loaded successfully.')
      },
      (error) => {
        toast.error('Location Error', error.message || 'Unable to retrieve location.')
      },
      { enableHighAccuracy: true }
    )
  }

  const handleGeocodeAddress = async () => {
    if (!address.trim()) return
    setGeocodeLoading(true)
    try {
      const query = encodeURIComponent(`${address}, ${city}`)
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`)
      const data = await res.json()
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat)
        const lng = parseFloat(data[0].lon)
        updateMapMarker(lat, lng)
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

  useEffect(() => {
    if (!isOpen) return

    let isMounted = true

    const initModalMap = () => {
      if (!window.L) return

      const lat = Number(latitude) || 26.8467
      const lng = Number(longitude) || 80.9462

      if (mapRef.current) {
        mapRef.current.setView([lat, lng], 13)
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng])
        }
        return
      }

      const mapDiv = document.getElementById('modal-delivery-map')
      if (!mapDiv) {
        setTimeout(() => {
          if (isMounted) initModalMap()
        }, 100)
        return
      }

      const map = window.L.map('modal-delivery-map').setView([lat, lng], 13)
      mapRef.current = map

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map)

      const customIcon = window.L.divIcon({
        html: `
          <div class="flex items-center justify-center w-8 h-8 rounded-full bg-[#2845D6]/20 border-2 border-[#2845D6] shadow-lg animate-pulse">
            <div class="w-3.5 h-3.5 rounded-full bg-[#2845D6] border-2 border-white"></div>
          </div>
        `,
        className: 'custom-div-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      })

      const marker = window.L.marker([lat, lng], { draggable: true, icon: customIcon }).addTo(map)
      markerRef.current = marker

      marker.on('dragend', () => {
        const position = marker.getLatLng()
        setLatitude(position.lat)
        setLongitude(position.lng)
      })
    }

    if (!window.L) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)

      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = () => {
        if (isMounted) initModalMap()
      }
      document.body.appendChild(script)
    } else {
      const timer = setTimeout(() => {
        if (isMounted) initModalMap()
      }, 200)
      return () => clearTimeout(timer)
    }

    return () => {
      isMounted = false
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markerRef.current = null
      }
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
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
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
                className="px-2 py-0.5 text-[9px] font-bold bg-[#2845D6]/10 hover:bg-[#2845D6]/20 text-[#2845D6] dark:bg-blue-900/30 dark:text-blue-400 rounded-md transition-all flex items-center gap-1 cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#2845D6] animate-pulse"></span>
                Fetch Location
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
          <Input
            id="modal-address-input"
            placeholder="Shop No, Street, Landmark, Area"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
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

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/60">
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
