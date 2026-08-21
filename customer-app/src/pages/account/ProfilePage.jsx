import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Heart,
  Check,
  Flame,
  Cake,
  Salad,
  Save,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  Info,
  Camera,
  Trash2,
  Upload,
  Lock,
  KeyRound,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import customerApi from '../../api/customer.api'
import Button from '../../components/common/Button'
import CustomDatePicker from '../../components/common/CustomDatePicker'
import ChangePinModal from '../../components/auth/ChangePinModal'

const GENDER_OPTIONS = [
  { id: 'MALE', label: 'Male' },
  { id: 'FEMALE', label: 'Female' },
  { id: 'OTHER', label: 'Other' },
  { id: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
]

const DIETARY_OPTIONS = [
  { id: 'ALL', label: 'All Foods' },
  { id: 'VEG', label: 'Pure Veg 🌱' },
  { id: 'NON_VEG', label: 'Non-Veg 🍗' },
  { id: 'EGG', label: 'Eggitarian 🥚' },
  { id: 'VEGAN', label: 'Vegan 🥑' },
  { id: 'JAIN', label: 'Jain Friendly 🌿' },
]

const TASTE_TAGS = [
  { id: 'spicy', label: 'Spicy & Masala', icon: '🌶️' },
  { id: 'sweet', label: 'Sweet Tooth', icon: '🍯' },
  { id: 'tangy', label: 'Tangy & Chaat', icon: '🍋' },
  { id: 'cheesy', label: 'Cheesy & Creamy', icon: '🧀' },
  { id: 'crispy', label: 'Crispy & Crunchy', icon: '🥨' },
  { id: 'healthy', label: 'Healthy & Low Oil', icon: '🥗' },
  { id: 'desi', label: 'Desi North Indian', icon: '🍲' },
  { id: 'south_indian', label: 'South Indian', icon: '🥥' },
  { id: 'street_food', label: 'Street Food & Momos', icon: '🥟' },
  { id: 'chai_coffee', label: 'Chai & Coffee', icon: '☕' },
  { id: 'high_protein', label: 'High Protein', icon: '🥩' },
  { id: 'fast_food', label: 'Pizza & Fast Food', icon: '🍕' },
  { id: 'chinese', label: 'Noodles & Chinese', icon: '🍜' },
  { id: 'biryani', label: 'Biryani Lover', icon: '🍚' },
]

export const ProfilePage = () => {
  const navigate = useNavigate()
  const { user, updateSessionUser } = useAuth()
  const toast = useToast()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [avatar, setAvatar] = useState('')
  const [avatarPreview, setAvatarPreview] = useState('')
  const [altMobile, setAltMobile] = useState('')
  const [gender, setGender] = useState('')
  const [dob, setDob] = useState('')
  const [anniversary, setAnniversary] = useState('')
  const [dietary, setDietary] = useState('ALL')
  const [selectedTastes, setSelectedTastes] = useState([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  // 4-Digit Security PIN Modal State
  const [showPinModal, setShowPinModal] = useState(false)

  const nameInputRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await customerApi.getProfile()
        const data = res?.data || res
        if (data) {
          setName(data.name || '')
          setEmail(data.email || '')
          setMobile(data.mobile || '')
          setAvatar(data.avatar || '')
          setAvatarPreview(data.avatar || '')

          const p = data.customer_profile || {}
          setGender(p.gender || '')
          setDob(p.date_of_birth || '')
          setAnniversary(p.anniversary_date || '')
          setDietary(p.dietary_preference || 'ALL')
          setAltMobile(p.alternate_mobile || '')
          setSelectedTastes(Array.isArray(p.taste_preferences) ? p.taste_preferences : [])
        }
      } catch (e) {
        if (user) {
          setName(user.name || '')
          setEmail(user.email || '')
          setMobile(user.mobile || '')
          setAvatar(user.avatar || '')
          setAvatarPreview(user.avatar || '')
          const p = user.customer_profile || {}
          setGender(p.gender || '')
          setDob(p.date_of_birth || '')
          setAnniversary(p.anniversary_date || '')
          setDietary(p.dietary_preference || 'ALL')
          setAltMobile(p.alternate_mobile || '')
          setSelectedTastes(Array.isArray(p.taste_preferences) ? p.taste_preferences : [])
        }
      } finally {
        setInitialLoading(false)
      }
    }

    fetchProfile()
  }, [])

  // Auto-focus first input when component mounts
  useEffect(() => {
    if (!initialLoading && nameInputRef.current) {
      nameInputRef.current.focus()
    }
  }, [initialLoading])

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File Too Large', 'Please choose an image under 5MB.')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatar(reader.result)
      setAvatarPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveAvatar = () => {
    setAvatar('')
    setAvatarPreview('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Calculate live completion score
  const calculateLiveScore = () => {
    let score = 0
    if (name.trim()) score += 15
    if (email.trim()) score += 15
    if (mobile.trim()) score += 15
    if (gender) score += 10
    if (dob) score += 15
    if (anniversary) score += 10
    if (dietary !== 'ALL' || selectedTastes.length > 0) score += 20
    return Math.min(100, score)
  }

  const completionPercentage = calculateLiveScore()

  const toggleTaste = (tasteId) => {
    setSelectedTastes((prev) =>
      prev.includes(tasteId) ? prev.filter((id) => id !== tasteId) : [...prev, tasteId]
    )
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    setLoading(true)

    const payload = {
      name: name.trim(),
      email: email.trim() || null,
      avatar: avatar || null,
      gender: gender || null,
      date_of_birth: dob || null,
      anniversary_date: anniversary || null,
      dietary_preference: dietary || null,
      alternate_mobile: altMobile.trim() || null,
      taste_preferences: selectedTastes,
    }

    try {
      const res = await customerApi.updateProfile(payload)
      const updatedUser = res?.data || res
      if (updatedUser) {
        updateSessionUser(updatedUser)
      }
      toast.success('Profile Saved', 'Your personal details and taste preferences have been updated.')
      navigate('/account')
    } catch (err) {
      toast.error('Save Failed', err.response?.data?.message || err.message || 'Unable to update profile.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/account')}
          className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Personal Details & Taste
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Optional info to personalize your food delivery experience
          </p>
        </div>
      </div>

      {/* Visual Profile Completion Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-blue-900 via-[#0F30A8] to-[#113BD0] text-white shadow-lg relative overflow-hidden flex items-stretch gap-4">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        {/* Full-Height Centered Percentage Box */}
        <div className="w-20 sm:w-24 shrink-0 self-stretch rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center p-3 text-center shadow-inner relative z-10">
          <span className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">
            {completionPercentage}%
          </span>
          <span className="text-[9px] sm:text-[10px] uppercase font-black tracking-wider text-blue-200 mt-1 opacity-80">
            Profile
          </span>
        </div>

        {/* Title, Subtitle & Progress Bar Column */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 space-y-2 relative z-10">
          <div className="space-y-0.5">
            <h4 className="font-black text-sm sm:text-base text-white truncate">
              {completionPercentage === 100 ? 'Profile Complete! 🎉' : 'Profile Completion Status'}
            </h4>
            <p className="text-[11px] sm:text-xs text-blue-100/90 font-medium line-clamp-2">
              {completionPercentage === 100
                ? 'All details saved for personalized offers & treats.'
                : 'Add your birthday, anniversary & food taste for curated recommendations.'}
            </p>
          </div>

          {/* Visual Progress Bar */}
          <div className="w-full h-2.5 bg-black/25 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-amber-300 via-emerald-300 to-emerald-400 rounded-full transition-all duration-500 ease-out shadow-xs"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Section 1: Basic Information & Profile Photo */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-[#113BD0]" />
              <span>Basic Information & Photo</span>
            </h3>
          </div>

          {/* Profile Photo Uploader */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
            <div className="relative group shrink-0">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-white dark:border-slate-700 shadow-md bg-gradient-to-tr from-[#113BD0] to-[#F97316] text-white flex items-center justify-center font-black text-2xl cursor-pointer select-none relative transition-transform group-hover:scale-105"
              >
                {avatarPreview || avatar ? (
                  <img
                    src={avatarPreview || avatar}
                    alt={name || 'Profile'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{name ? name[0].toUpperCase() : 'C'}</span>
                )}

                {/* Dark Overlay on Hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Camera className="w-5 h-5" />
                </div>
              </div>

              {/* Camera Badge */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-6 h-6 rounded-full bg-[#113BD0] text-white flex items-center justify-center absolute -bottom-1 -right-1 shadow-md border-2 border-white dark:border-slate-800 cursor-pointer"
                title="Change Photo"
              >
                <Camera className="w-3 h-3" />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />

            <div className="space-y-1 flex-1 min-w-0">
              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">
                Profile Photo
              </h4>
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                Upload a clear profile photo (JPG, PNG or WEBP, max 5MB).
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1 rounded-xl bg-[#113BD0] text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-2xs cursor-pointer"
                >
                  {avatar || avatarPreview ? 'Change Photo' : 'Upload Photo'}
                </button>
                {(avatar || avatarPreview) && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="px-3 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Full Name
              </label>
              <input
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full h-11 px-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#113BD0]/30 focus:border-[#113BD0] transition-all font-medium"
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex justify-between">
                <span>Email Address</span>
                <span className="text-[10px] text-slate-400 font-normal">Optional</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. name@example.com"
                className="w-full h-11 px-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#113BD0]/30 focus:border-[#113BD0] transition-all font-medium"
              />
            </div>

            {/* Mobile (Verified / Primary) */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                <span>Primary Mobile</span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  disabled
                  value={mobile ? `+91 ${mobile}` : ''}
                  className="w-full h-11 pl-3.5 pr-8 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 text-slate-500 font-medium cursor-not-allowed"
                />
              </div>
            </div>

            {/* Alternate Phone */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex justify-between">
                <span>Alternate Phone</span>
                <span className="text-[10px] text-slate-400 font-normal">Optional</span>
              </label>
              <input
                type="tel"
                value={altMobile}
                onChange={(e) => setAltMobile(e.target.value)}
                placeholder="Secondary contact number"
                className="w-full h-11 px-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#113BD0]/30 focus:border-[#113BD0] transition-all font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Personal Milestones (DOB, Anniversary & Gender) */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
              <Cake className="w-3.5 h-3.5 text-rose-500" />
              <span>Personal Details (100% Optional)</span>
            </h3>
            <span className="text-[10px] text-slate-400">For birthday treats & anniversary surprises</span>
          </div>

          {/* Gender Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
              Gender
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {GENDER_OPTIONS.map((g) => {
                const isSelected = gender === g.id
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGender(isSelected ? '' : g.id)}
                    className={`h-10 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#113BD0] text-white border-[#113BD0] shadow-sm shadow-blue-500/20'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                    <span>{g.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Date of Birth */}
            <CustomDatePicker
              label="Date of Birth (DOB)"
              icon={Cake}
              value={dob}
              onChange={setDob}
              placeholder="Select date of birth..."
              helperText="Receive special birthday discounts & treats!"
              maxYear={new Date().getFullYear()}
              minYear={1930}
            />

            {/* Anniversary Date */}
            <CustomDatePicker
              label="Anniversary Date"
              icon={Heart}
              value={anniversary}
              onChange={setAnniversary}
              placeholder="Select anniversary date..."
              helperText="Celebrate your special day with surprise offers!"
              maxYear={new Date().getFullYear()}
              minYear={1960}
            />
          </div>
        </div>

        {/* Section 3: Dietary Lifestyle & Food Taste Preferences */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span>Food Lifestyle & Taste Preferences</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Select flavors you love so we can highlight dishes made just for your palate.
            </p>
          </div>

          {/* Dietary Type Chips */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
              Dietary Preference
            </label>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map((d) => {
                const isSelected = dietary === d.id
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDietary(d.id)}
                    className={`h-9 px-3 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-500/20'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                    <span>{d.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Taste & Flavor Tags */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
              <span>Taste Profiles & Cravings (Multi-select)</span>
              <span className="text-[10px] text-slate-400 font-normal">
                {selectedTastes.length} selected
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              {TASTE_TAGS.map((t) => {
                const isSelected = selectedTastes.includes(t.id)
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTaste(t.id)}
                    className={`h-9 px-3 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#113BD0] to-[#1E3A8A] text-white border-[#113BD0] shadow-sm shadow-blue-500/20'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                    }`}
                  >
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
                    {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* SECTION 4: SECURITY & 4-DIGIT LOGIN PIN */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-[#FF5200] flex items-center justify-center">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  4-Digit Security PIN
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Used for fast, secure login without waiting for SMS OTP
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={Lock}
              onClick={() => {
                setPinError('')
                setShowPinModal(true)
              }}
              className="text-xs font-bold border-orange-200 dark:border-orange-900/60 text-[#FF5200] hover:bg-orange-50 dark:hover:bg-orange-950/40"
            >
              Change PIN
            </Button>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              {user?.has_custom_pin ? (
                <span>Custom 4-Digit Security PIN is active & protected</span>
              ) : (
                <span>
                  Default PIN: <strong>••••{mobile ? mobile.slice(-4) : 'Last 4 digits'}</strong>
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
              {user?.has_custom_pin ? 'Custom PIN' : 'Default PIN'}
            </span>
          </div>
        </div>

        {/* Pinned Sticky Bottom Action Bar */}
        <div className="sticky bottom-4 z-20 pt-2">
          <div className="p-2 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xl flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => navigate('/account')}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={Save}
              loading={loading}
              className="flex-1"
            >
              Save Profile
            </Button>
          </div>
        </div>
      </form>

      {/* Standalone Reusable Change PIN Modal */}
      <ChangePinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
      />
    </div>
  )
}

export default ProfilePage
