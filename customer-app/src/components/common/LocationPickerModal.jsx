import React, { useState, useEffect, useRef } from 'react'
import {
  MapPin,
  Crosshair,
  Search,
  Check,
  Building,
  Home,
  Briefcase,
  X,
  Loader2,
  Navigation,
  ArrowRight,
} from 'lucide-react'
import Modal from './Modal'
import Button from './Button'
import { useLocationContext } from '../../context/LocationContext'
import { useLanguage } from '../../context/LanguageContext'
import { useToast } from '../../context/ToastContext'
import { searchPlacesAuto } from '../../utils/geo'

export const LocationPickerModal = ({ isOpen, onClose }) => {
  const { t } = useLanguage()
  const toast = useToast()
  const {
    addresses,
    activeAddress,
    selectAddress,
    detectCurrentLocation,
    saveAddressToBook,
  } = useLocationContext()

  const [detecting, setDetecting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [customAddress, setCustomAddress] = useState('')
  const [landmarkText, setLandmarkText] = useState('')
  const [addressType, setAddressType] = useState('Home')
  const [saving, setSaving] = useState(false)
  const debounceRef = useRef(null)

  // Reset state on modal open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('')
      setSuggestions([])
      setSelectedPlace(null)
      setCustomAddress('')
      setLandmarkText('')
      setAddressType('Home')
      setSaving(false)
    }
  }, [isOpen])

  // Live Auto-search places as user types
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestions([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchPlacesAuto(searchQuery)
        setSuggestions(results || [])
      } catch (e) {
        console.warn('Auto search error:', e)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchQuery])

  if (!isOpen) return null

  // 1-Tap Current Location (GPS) - captures location and opens optional details review
  const handleDetectGPS = async () => {
    setDetecting(true)
    try {
      const detected = await detectCurrentLocation()
      setSelectedPlace({
        main_text: detected.locality || detected.city || 'GPS Detected Location',
        formatted_address: detected.address || detected.full_address || '',
        latitude: detected.latitude,
        longitude: detected.longitude,
        city: detected.city || '',
        isGps: true,
      })
      setCustomAddress(detected.address || detected.full_address || '')
      setLandmarkText('')
      setSearchQuery('')
      toast.success(
        'GPS Location Captured!',
        'You can now review or add optional village/landmark details below.'
      )
    } catch (e) {
      // GpsEnableModal automatically opens via LocationContext
    } finally {
      setDetecting(false)
    }
  }

  // Handle suggestion selection from auto-search
  const handleSelectSuggestion = (place) => {
    setSelectedPlace({
      main_text: place.main_text || place.formatted_address,
      formatted_address: place.formatted_address || place.main_text || '',
      latitude: place.latitude,
      longitude: place.longitude,
      city: place.city || '',
      isGps: false,
    })
    setSuggestions([])
    setSearchQuery('')
    setCustomAddress(place.formatted_address || place.main_text || '')
    setLandmarkText('')
  }

  // Confirm and set location
  const handleConfirmLocation = async (e) => {
    e?.preventDefault()
    if (!selectedPlace) return

    setSaving(true)
    try {
      const finalAddressText =
        customAddress.trim() ||
        selectedPlace.formatted_address ||
        selectedPlace.main_text

      const newLocation = {
        customer_name: activeAddress?.customer_name || 'Valued Customer',
        customer_phone: activeAddress?.customer_phone || '',
        address: finalAddressText,
        full_address: finalAddressText,
        landmark: landmarkText.trim(),
        type: addressType || 'Home',
        latitude: selectedPlace.latitude,
        longitude: selectedPlace.longitude,
        city: selectedPlace.city || '',
        is_default: true,
      }

      if (saveAddressToBook) {
        await saveAddressToBook(newLocation)
      } else {
        selectAddress(newLocation)
      }

      toast.success('Location Saved!', newLocation.address)
      onClose()
    } catch (err) {
      toast.error('Could not save location', err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Choose Delivery Location"
      subtitle="Auto-detect via GPS or search your street / area"
      maxWidth="max-w-lg"
    >
      <div className="space-y-4 text-xs">
        {/* 1. 1-Tap GPS Auto-Detect Button */}
        <button
          type="button"
          onClick={handleDetectGPS}
          disabled={detecting}
          className="w-full p-4 rounded-3xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 border-2 border-dashed border-[#113BD0] dark:border-blue-500 text-[#113BD0] dark:text-blue-400 font-black flex items-center justify-between gap-3 hover:bg-blue-100/70 active:scale-[0.99] transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-2xl bg-[#113BD0] text-white flex items-center justify-center shrink-0 shadow-md">
              {detecting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Navigation className="w-5 h-5" />
              )}
            </div>
            <div>
              <span className="text-sm font-black block">
                {detecting ? 'Locating via GPS...' : 'Use Current GPS Location'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                Instant 1-tap exact location auto-detection
              </span>
            </div>
          </div>

          <span className="text-xs font-black bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl shadow-xs shrink-0">
            Auto Detect →
          </span>
        </button>

        {/* 2. Google Maps / Places Live Auto-Search Bar */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#113BD0] dark:text-blue-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                if (selectedPlace) setSelectedPlace(null)
              }}
              placeholder="Search area, apartment, street, or landmark (e.g. Civil Lines)..."
              autoFocus
              className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#113BD0] dark:focus:border-blue-500 shadow-inner"
            />
            {isSearching ? (
              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
            ) : (
              searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setSuggestions([])
                    setSelectedPlace(null)
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )
            )}
          </div>

          {/* Auto-search Suggestions Dropdown */}
          {suggestions.length > 0 && !selectedPlace && (
            <div className="p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in duration-200">
              {suggestions.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectSuggestion(item)}
                  className="p-3 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-start gap-3 cursor-pointer"
                >
                  <MapPin className="w-4 h-4 text-[#F97316] shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <h5 className="font-black text-xs text-slate-900 dark:text-slate-100 truncate">
                      {item.main_text}
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 leading-snug">
                      {item.sub_text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Selected Location Preview & Confirmation */}
        {selectedPlace && (
          <form
            onSubmit={handleConfirmLocation}
            className="p-4 rounded-3xl bg-emerald-50/70 dark:bg-slate-900 border-2 border-emerald-500/80 dark:border-emerald-500/60 shadow-md space-y-3.5 animate-in slide-in-from-bottom-2"
          >
            {/* Status Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <Navigation className="w-4 h-4" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400 block tracking-wider">
                    {selectedPlace.isGps ? '📍 GPS LOCATION DETECTED' : '📍 SELECTED LOCATION'}
                  </span>
                  <h4 className="font-black text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate">
                    {selectedPlace.main_text}
                  </h4>
                  {selectedPlace.latitude && selectedPlace.longitude && (
                    <span className="text-[10px] font-mono text-emerald-800 dark:text-emerald-300 block">
                      Lat: {Number(selectedPlace.latitude).toFixed(4)}, Lng: {Number(selectedPlace.longitude).toFixed(4)}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPlace(null)}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer shrink-0"
              >
                Change
              </button>
            </div>

            {/* Editable Full Address / Street / Village (Optional) */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex justify-between items-center">
                <span>Full Address / Village Details</span>
                <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Optional</span>
              </label>
              <textarea
                rows={2}
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
                placeholder="Enter village, house number, or street details..."
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF5200]"
              />
              <p className="text-[10px] text-slate-400 font-medium">
                Auto-filled from location. You can edit or add your village/house info.
              </p>
            </div>

            {/* Landmark (Optional) */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex justify-between items-center">
                <span>Nearby Landmark</span>
                <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Optional</span>
              </label>
              <input
                type="text"
                value={landmarkText}
                onChange={(e) => setLandmarkText(e.target.value)}
                placeholder="e.g. Near Primary School / Temple / Panchayat"
                className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF5200]"
              />
            </div>

            {/* Address Type Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Address Type
              </label>
              <div className="flex items-center gap-2">
                {['Home', 'Work', 'Other'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAddressType(type)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      addressType === type
                        ? 'bg-[#FF5200] text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={saving}
              icon={Check}
              className="w-full bg-[#FF5200] hover:bg-[#EA580C] text-white shadow-md shadow-orange-500/25 text-xs sm:text-sm font-black h-11 mt-1 cursor-pointer"
            >
              Confirm & Save Address
            </Button>
          </form>
        )}

        {/* 4. Saved Addresses Quick List */}
        {!selectedPlace && addresses.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
              {t.savedAddresses}
            </span>
            <div className="space-y-2.5">
              {addresses.map((addr) => {
                const isSelected =
                  activeAddress?.id === addr.id ||
                  activeAddress?.address === addr.address

                const typeText = (addr.type?.value || addr.type || 'HOME').toUpperCase()
                const fullAddressStr =
                  addr.address ||
                  [addr.address_line1, addr.address_line2, addr.landmark, addr.city, addr.pincode]
                    .filter(Boolean)
                    .join(', ') ||
                  ''

                const contactNameStr =
                  addr.customer_name || addr.contact_name || addr.name || ''

                return (
                  <div
                    key={addr.id}
                    onClick={() => {
                      const completeAddr = {
                        ...addr,
                        address: fullAddressStr,
                        customer_name: contactNameStr || 'Valued Customer',
                        type: typeText,
                      }
                      selectAddress(completeAddr)
                      toast.success('Address Selected', fullAddressStr)
                      onClose()
                    }}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-orange-50/70 dark:bg-slate-800/90 border-2 border-[#FF5200] shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-[#FF5200] text-white shadow-md shadow-orange-500/25'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {typeText === 'WORK' ? (
                          <Briefcase className="w-4 h-4" />
                        ) : (
                          <Home className="w-4 h-4" />
                        )}
                      </div>

                      <div className="min-w-0 space-y-0.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900 dark:text-slate-100 tracking-tight">
                            {typeText}
                          </span>
                          {contactNameStr && (
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">
                              • {contactNameStr}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium line-clamp-1 leading-normal">
                          {fullAddressStr}
                        </p>
                        {addr.landmark && (
                          <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 line-clamp-1">
                            🚩 {addr.landmark}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-[#FF5200] text-white flex items-center justify-center shadow-md shadow-orange-500/30">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-700" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default LocationPickerModal
