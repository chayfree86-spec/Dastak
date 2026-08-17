import React, { useState, useEffect, useRef } from 'react'
import { MapPin, Navigation, Compass, Globe } from 'lucide-react'
import Modal from '../../components/common/Modal'
import Input from '../../components/common/Input'
import AddressAutocomplete from '../../components/common/AddressAutocomplete'
import Button from '../../components/common/Button'
import Switch from '../../components/common/Switch'
import { useToast } from '../../context/ToastContext'
import settingsApi from '../../api/settings.api'
import { reverseGeocodeCoordinates, detectCurrentLocationWithFallback } from '../../utils/geocoding'

export const ZoneFormModal = ({ isOpen, onClose, zone, onSaveSuccess, existingAreas = [] }) => {
  const toast = useToast()
  const formRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [errors, setErrors] = useState({})

  // Form Fields
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [radiusKm, setRadiusKm] = useState('10')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (zone) {
      setName(zone.name || '')
      setCity(zone.city || 'Kanpur')
      setRadiusKm(zone.radius_km ? String(zone.radius_km) : '10')
      setLatitude(zone.center_latitude !== null && zone.center_latitude !== undefined ? String(zone.center_latitude) : '')
      setLongitude(zone.center_longitude !== null && zone.center_longitude !== undefined ? String(zone.center_longitude) : '')
      setIsActive(zone.is_active ?? true)
    } else {
      setName('')
      setCity('Kanpur')
      setRadiusKm('10')
      setLatitude('26.4499')
      setLongitude('80.3319')
      setIsActive(true)
    }
    setErrors({})
  }, [zone, isOpen])

  // Auto-focus and keyboard navigation
  useEffect(() => {
    if (!isOpen) return
    const firstInput = formRef.current?.querySelector('input')
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100)
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
        e.preventDefault()
        const inputs = Array.from(
          formRef.current?.querySelectorAll('input, select, textarea, button[type="submit"]') || []
        )
        const idx = inputs.indexOf(e.target)
        if (idx > -1 && idx < inputs.length - 1) {
          inputs[idx + 1].focus()
        }
      }
    }

    const formEl = formRef.current
    formEl?.addEventListener('keydown', handleKeyDown)
    return () => {
      formEl?.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleAutoLocate = async () => {
    setLocating(true)
    try {
      const loc = await detectCurrentLocationWithFallback({ gpsOnly: true })
      if (loc && loc.latitude && loc.longitude) {
        setLatitude(Number(loc.latitude).toFixed(6))
        setLongitude(Number(loc.longitude).toFixed(6))
        if (loc.city) setCity(loc.city)
        if (!name.trim() && loc.formattedAddress) {
          setName(loc.formattedAddress)
        }
        toast.success(
          'GPS Location Detected',
          `${loc.city || loc.formattedAddress} (${Number(loc.latitude).toFixed(4)}, ${Number(loc.longitude).toFixed(4)})`
        )
      } else {
        toast.warning('Unable to Detect', 'Could not detect GPS position.')
      }
    } catch (err) {
      toast.error('GPS Error', err?.message || 'Unable to retrieve GPS location.')
    } finally {
      setLocating(false)
    }
  }

  const handleZoneSelect = (item) => {
    if (!item) return
    setName(item.formattedAddress || item.displayName)
    if (item.city) setCity(item.city)
    if (item.latitude) setLatitude(Number(item.latitude).toFixed(6))
    if (item.longitude) setLongitude(Number(item.longitude).toFixed(6))
    toast.success('Zone Coordinates Set', `${item.formattedAddress || item.displayName}`)
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    setErrors({})

    const newErrors = {}
    if (!name.trim()) newErrors.name = 'Service area name is required.'
    if (!city.trim()) newErrors.city = 'City name is required.'
    if (!radiusKm || Number(radiusKm) <= 0) newErrors.radiusKm = 'Please enter a valid radius (> 0 km).'

    const trimmedName = name.trim().toLowerCase()
    const trimmedCity = city.trim().toLowerCase()
    const isDuplicate = (existingAreas || []).some(
      (a) =>
        a.id !== zone?.id &&
        a.name?.trim().toLowerCase() === trimmedName &&
        (a.city || 'Kanpur').trim().toLowerCase() === trimmedCity
    )

    if (isDuplicate) {
      newErrors.name = `"${name.trim()}" already exists in ${city.trim()}. Duplicate areas are not allowed.`
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast.error('Validation Error', newErrors.name || 'Please check highlighted fields.')
      return
    }

    setLoading(true)
    try {
      const payload = {
        name: name.trim(),
        city: city.trim(),
        radius_km: Number(radiusKm),
        center_latitude: latitude ? Number(latitude) : null,
        center_longitude: longitude ? Number(longitude) : null,
        is_active: isActive,
      }

      if (zone?.id) {
        await settingsApi.updateServiceArea(zone.id, payload)
        toast.success('Area Updated', `${name} details updated successfully.`)
      } else {
        await settingsApi.createServiceArea(payload)
        toast.success('Area Created', `${name} created and added to delivery network.`)
      }

      if (onSaveSuccess) onSaveSuccess()
      onClose()
    } catch (err) {
      toast.error('Operation Failed', err.message || 'Unable to save service area.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={zone ? 'Edit Service Area' : 'Add New Service Area'}
      subtitle="Define delivery boundary, coverage radius, and operational status."
      maxWidth="max-w-xl"
    >
      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col max-h-[78vh] -m-1">
        {/* Scrollable Form Body */}
        <div className="overflow-y-auto px-1.5 py-1 space-y-4 flex-1 pr-2 max-h-[calc(78vh-70px)]">
          <AddressAutocomplete
            label="Service Area / Zone Name"
            required
            placeholder="Search area (e.g. Swaroop Nagar, Kanpur)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onSelect={handleZoneSelect}
            error={errors.name}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="City"
              required
              placeholder="e.g. Kanpur"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              error={errors.city}
            />
            <Input
              label="Delivery Radius (KM)"
              type="number"
              min="0.5"
              max="100"
              step="0.5"
              required
              placeholder="e.g. 12"
              value={radiusKm}
              onChange={(e) => setRadiusKm(e.target.value)}
              error={errors.radiusKm}
            />
          </div>

          {/* Coordinates & GPS auto-fetch */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Compass className="w-4 h-4 text-[#2845D6]" />
                <span>Zone Center Coordinates</span>
              </div>
              <button
                type="button"
                onClick={handleAutoLocate}
                disabled={locating}
                className="flex items-center gap-1 text-[11px] font-bold text-[#2845D6] dark:text-blue-400 hover:underline cursor-pointer disabled:opacity-50"
              >
                <Navigation className={`w-3 h-3 ${locating ? 'animate-spin' : ''}`} />
                <span>{locating ? 'Detecting GPS (12s)...' : 'Auto Detect GPS'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Center Latitude"
                placeholder="26.449900"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
              />
              <Input
                label="Center Longitude"
                placeholder="80.331900"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <Switch
              checked={isActive}
              onChange={setIsActive}
              label="Active Delivery Zone"
              description="Enable ordering and delivery fleet dispatch in this area"
            />
          </div>
        </div>

        {/* Pinned Sticky Actions Footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {zone ? 'Update Area' : 'Create Service Area'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default ZoneFormModal
