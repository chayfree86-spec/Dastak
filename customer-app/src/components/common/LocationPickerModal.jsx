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
  const { addresses, activeAddress, selectAddress, detectCurrentLocation } =
    useLocationContext()

  const [detecting, setDetecting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [flatNumber, setFlatNumber] = useState('')
  const [landmarkText, setLandmarkText] = useState('')
  const debounceRef = useRef(null)

  // Reset state on modal open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('')
      setSuggestions([])
      setSelectedPlace(null)
      setFlatNumber('')
      setLandmarkText('')
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

  // 1-Tap Current Location (GPS)
  const handleDetectGPS = async () => {
    setDetecting(true)
    try {
      const detected = await detectCurrentLocation()
      toast.success(
        'Current Location Set!',
        detected.address || 'Delivery address updated via GPS.'
      )
      onClose()
    } catch (e) {
      toast.error(
        'Location Permission Needed',
        'Please allow location access in your browser or search your area below.'
      )
    } finally {
      setDetecting(false)
    }
  }

  // Handle suggestion selection from auto-search
  const handleSelectSuggestion = (place) => {
    setSelectedPlace(place)
    setSuggestions([])
    setSearchQuery(place.main_text || place.formatted_address)
  }

  // Confirm and set location
  const handleConfirmLocation = () => {
    if (!selectedPlace) return

    const combinedAddress = flatNumber.trim()
      ? `${flatNumber.trim()}, ${selectedPlace.formatted_address}`
      : selectedPlace.formatted_address

    const newLocation = {
      customer_name: activeAddress?.customer_name || 'My Location',
      customer_phone: activeAddress?.customer_phone || '',
      address: combinedAddress,
      full_address: selectedPlace.formatted_address,
      landmark: landmarkText.trim() || selectedPlace.main_text || '',
      latitude: selectedPlace.latitude,
      longitude: selectedPlace.longitude,
      city: selectedPlace.city || 'Kanpur',
    }

    selectAddress(newLocation)
    toast.success('Location Set!', newLocation.address)
    onClose()
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
          className="w-full p-4 rounded-3xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 border-2 border-dashed border-[#2845D6] dark:border-blue-500 text-[#2845D6] dark:text-blue-400 font-black flex items-center justify-between gap-3 hover:bg-blue-100/70 active:scale-[0.99] transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-2xl bg-[#2845D6] text-white flex items-center justify-center shrink-0 shadow-md">
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
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2845D6] dark:text-blue-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                if (selectedPlace) setSelectedPlace(null)
              }}
              placeholder="Search area, apartment, street, or landmark (e.g. Civil Lines)..."
              autoFocus
              className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#2845D6] dark:focus:border-blue-500 shadow-inner"
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
          <div className="p-4 rounded-3xl bg-blue-50/70 dark:bg-slate-900 border-2 border-[#2845D6] dark:border-blue-500 shadow-md space-y-3 animate-in slide-in-from-bottom-2">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#2845D6] text-white flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <span className="text-[10px] font-black uppercase text-[#2845D6] dark:text-blue-400 block tracking-wider">
                  SELECTED LOCATION
                </span>
                <h4 className="font-black text-slate-900 dark:text-slate-100 text-sm">
                  {selectedPlace.main_text}
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedPlace.formatted_address}
                </p>
              </div>
            </div>

            {/* Optional Flat / Floor and Landmark */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-blue-200/60 dark:border-slate-800">
              <input
                type="text"
                value={flatNumber}
                onChange={(e) => setFlatNumber(e.target.value)}
                placeholder="House / Flat / Floor (Optional)"
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#2845D6]"
              />
              <input
                type="text"
                value={landmarkText}
                onChange={(e) => setLandmarkText(e.target.value)}
                placeholder="Nearby Landmark (Optional)"
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#2845D6]"
              />
            </div>

            <Button
              variant="primary"
              size="md"
              icon={Check}
              onClick={handleConfirmLocation}
              className="w-full shadow-md text-xs font-black"
            >
              Confirm & Set Delivery Address
            </Button>
          </div>
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
                  'Lalganj, Azamgarh 276202'

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
