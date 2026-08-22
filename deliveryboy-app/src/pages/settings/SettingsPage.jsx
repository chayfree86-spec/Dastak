import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Lock,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Shield,
  HelpCircle,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Music,
  Upload,
  Play,
  Trash2,
  FileAudio,
  Sparkles,
  Check,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Phone,
  MessageSquare,
  Mail,
  Globe,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useSound, SOUND_PRESETS } from '../../context/SoundContext'
import { useToast } from '../../context/ToastContext'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import authApi from '../../api/auth.api'
import deliveryApi from '../../api/delivery.api'

export const SettingsPage = () => {
  const navigate = useNavigate()
  const { user, logout, changeDevice } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [platformConfig, setPlatformConfig] = useState(null)

  useEffect(() => {
    deliveryApi.getConfig?.().then((res) => {
      setPlatformConfig(res?.data?.data || res?.data || null)
    }).catch(() => {})
  }, [])
  const {
    soundEnabled,
    soundPreset,
    customAudioData,
    customAudioName,
    setSoundPreset,
    setCustomAudio,
    removeCustomAudio,
    toggleSound,
    playAlert,
    playPreview,
  } = useSound()
  const toast = useToast()

  const fileInputRef = useRef(null)
  const [soundStudioExpanded, setSoundStudioExpanded] = useState(false)

  const activeSoundTitle = customAudioData
    ? customAudioName || 'Custom Ringtone'
    : SOUND_PRESETS.find((p) => p.id === soundPreset)?.name || 'Royal Chime'

  const activeSoundDesc = customAudioData
    ? 'Custom audio file active for order assignments'
    : SOUND_PRESETS.find((p) => p.id === soundPreset)?.desc || 'Harmonic chime'

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const [showChangeDeviceModal, setShowChangeDeviceModal] = useState(false)
  const [changeDeviceLoading, setChangeDeviceLoading] = useState(false)

  // Custom Audio File Upload Handler
  const handleAudioFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 10MB size limit
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File Too Large', 'Please choose an audio file under 10MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result
      if (dataUrl) {
        setCustomAudio(dataUrl, file.name)
        toast.success('Custom Alert Set', `"${file.name}" is now your active assignment ringtone.`)
      }
    }
    reader.onerror = () => {
      toast.error('Upload Error', 'Could not process audio file. Please try another audio format.')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPasswordError('')

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.')
      return
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.')
      return
    }

    setPasswordLoading(true)
    try {
      await authApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      })
      toast.success('Password Changed', 'Security credentials updated successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password.')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleConfirmChangeDevice = async () => {
    setChangeDeviceLoading(true)
    try {
      await changeDevice()
      setShowChangeDeviceModal(false)
      toast.success('Device Changed', 'Rider device session removed. Please verify on this or a new device.')
      navigate('/login')
    } catch (err) {
      toast.error('Action Failed', err.message || 'Could not revoke rider device session.')
    } finally {
      setChangeDeviceLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    toast.success('Signed Out', 'You have been signed out.')
    navigate('/login')
  }

  return (
    <div className="w-full max-w-full space-y-4 sm:space-y-6 pb-28 md:pb-12">
      <div>
        <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          App Settings & Preferences
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure security, alert sounds, and user interface preferences
        </p>
      </div>

      {/* 2-Column Responsive Layout: Left (Audio Studio) / Right (Display & Security) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* ========================================================================= */}
        {/* Left Primary Column: Audio Alert & Ringtone Studio                        */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            {/* Studio Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div>
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Music className="w-4 h-4 text-[#113BD0] dark:text-blue-400" />
                  <span>Assignment Audio Alert</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Customize ringtones and sound alerts for incoming delivery trips
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => playAlert()}
                  disabled={!soundEnabled}
                  className="text-xs font-bold"
                  icon={Play}
                >
                  Test Sound
                </Button>
                <Button
                  variant={soundEnabled ? 'primary' : 'outline'}
                  size="sm"
                  onClick={toggleSound}
                  className="text-xs font-black"
                  icon={soundEnabled ? Volume2 : VolumeX}
                >
                  {soundEnabled ? 'Audio Enabled' : 'Muted'}
                </Button>
              </div>
            </div>

            {/* Current Active Sound Compact Row */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 text-[#113BD0] dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs">
                  {customAudioData ? <FileAudio className="w-5 h-5" /> : <Music className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 truncate">
                      {activeSoundTitle}
                    </span>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shrink-0">
                      Active
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate block">
                    {activeSoundDesc}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto pt-1 sm:pt-0">
                {/* Mobile-Only Accordion Button */}
                <button
                  type="button"
                  onClick={() => setSoundStudioExpanded(!soundStudioExpanded)}
                  className={`lg:hidden flex-1 sm:flex-initial px-3.5 py-2 min-h-[38px] rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer ${
                    soundStudioExpanded
                      ? 'bg-[#113BD0] text-white border-[#113BD0]'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-[#113BD0] dark:text-blue-400'
                  }`}
                >
                  <span>{soundStudioExpanded ? 'Close' : 'Change Tone'}</span>
                  {soundStudioExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Sound Studio Body (Always visible on Desktop lg:block, Collapsible on Mobile) */}
            <div
              className={`space-y-4 pt-1 ${
                soundStudioExpanded ? 'block' : 'hidden lg:block'
              }`}
            >
              {/* Built-in Tone Presets */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-black text-slate-700 dark:text-slate-200">
                  <span>Built-in Alert Tones</span>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Fast & Offline Ready</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {SOUND_PRESETS.map((preset) => {
                    const isSelected = soundPreset === preset.id && !customAudioData
                    return (
                      <div
                        key={preset.id}
                        onClick={() => setSoundPreset(preset.id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 touch-manipulation active:scale-[0.98] ${
                          isSelected
                            ? 'bg-blue-50/80 dark:bg-blue-950/40 border-[#113BD0] dark:border-blue-500 shadow-2xs'
                            : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'border-[#113BD0] bg-[#113BD0] text-white'
                                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-black text-slate-900 dark:text-slate-100 block truncate">
                              {preset.name}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate block">
                              {preset.desc}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            playPreview(preset.id)
                          }}
                          className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-[#113BD0] dark:hover:text-blue-400 hover:scale-105 transition-all shadow-2xs shrink-0 cursor-pointer"
                          title="Play Preview"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Custom Audio Upload Studio */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-black text-slate-700 dark:text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
                    <span>Custom Sound / Ringtone</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">MP3, WAV, M4A, AAC, OGG, FLAC</span>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAudioFileUpload}
                  accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.webm"
                  className="hidden"
                />

                {customAudioData ? (
                  /* Uploaded Sound Active State Card */
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/60 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-[#113BD0] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <FileAudio className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h5 className="font-black text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate">
                          {customAudioName || 'Custom Audio Alert'}
                        </h5>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                          Playing for all delivery trip alerts
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => playPreview('custom')}
                        className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 text-xs font-bold text-[#113BD0] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/40 flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Preview</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750 flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Replace</span>
                      </button>

                      <button
                        type="button"
                        onClick={removeCustomAudio}
                        className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 shadow-2xs transition-all shrink-0 cursor-pointer"
                        title="Remove Custom Sound & Reset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Upload Trigger Dropzone */
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-[#113BD0] dark:hover:border-blue-500 bg-slate-50/60 dark:bg-slate-900/40 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-all cursor-pointer text-center space-y-1.5 group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/60 text-slate-400 group-hover:text-[#113BD0] dark:group-hover:text-blue-400 flex items-center justify-center mx-auto transition-colors">
                      <Upload className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 group-hover:text-[#113BD0] dark:group-hover:text-blue-400 block transition-colors">
                        Upload Custom Sound / Ringtone
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Tap to browse audio file (.mp3, .wav, .m4a, .aac, .ogg, .flac)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Right Column: Display Appearance & Device / Account Security               */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1. Display Appearance (Dark / Light Theme) */}
          <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3.5">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2.5">
              Display Appearance
            </h3>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 shadow-2xs">
                  {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-amber-500" />}
                </div>
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 block">
                    Dark Mode Theme
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {isDark ? 'Dark theme is active' : 'Light theme is active'}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTheme}
                className="w-full sm:w-auto shrink-0 font-black text-xs"
              >
                {isDark ? 'Switch Light' : 'Switch Dark'}
              </Button>
            </div>
          </div>

          {/* 2. Device Management */}
          <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3.5">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2.5">
              Device & Session Security
            </h3>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-2xs">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h5 className="font-black text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                    Change Device
                  </h5>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                    Switch session to another device
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowChangeDeviceModal(true)}
                className="w-full sm:w-auto shrink-0 font-black text-xs text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50"
              >
                Change Device
              </Button>
            </div>
          </div>

          {/* 3. Change Password / Security PIN */}
          <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3.5">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2.5">
              Change Password / PIN
            </h3>

            <form onSubmit={handlePasswordChange} className="space-y-3 text-xs">
              <Input
                label="Current Password / PIN"
                type="password"
                icon={Lock}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <Input
                label="New Password"
                type="password"
                icon={Lock}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <Input
                label="Confirm New Password"
                type="password"
                icon={Lock}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              {passwordError && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="pt-1">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={passwordLoading}
                  icon={CheckCircle2}
                  className="w-full py-3 font-black text-xs rounded-2xl"
                >
                  Update Password
                </Button>
              </div>
            </form>
          </div>

          {/* 4. Help & Support Multi-Channel Section */}
          {(() => {
            const riderPhone = platformConfig?.rider_support_phone || platformConfig?.support_phone || '9005271986'
            const commonPhone = platformConfig?.support_phone || '9005271986'
            const whatsappPhone = platformConfig?.support_whatsapp || riderPhone
            const supportEmail = platformConfig?.support_email || 'support@dastakdelivery.com'

            const cleanCall = riderPhone.replace(/[^0-9+]/g, '')
            const cleanWhatsapp = whatsappPhone.replace(/[^0-9]/g, '')

            return (
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 dark:text-slate-100 text-xs">
                        Rider Fleet Support & Helpline
                      </h4>
                      <p className="text-slate-400 text-[10px] font-medium">
                        Emergency dispatch & fleet assistance
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                    24x7 Fleet Hub
                  </span>
                </div>

                {/* Channels Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Call Fleet Hub */}
                  <a
                    href={`tel:${cleanCall}`}
                    className="p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50/80 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 transition-all flex flex-col justify-between gap-3 min-h-[104px] group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <Phone className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:underline">
                        Call Hub ↗
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Rider Helpline
                      </span>
                      <span className="font-black text-sm text-slate-900 dark:text-slate-100 block truncate mt-0.5">
                        {riderPhone}
                      </span>
                    </div>
                  </a>

                  {/* WhatsApp Fleet Dispatch */}
                  <a
                    href={`https://wa.me/${cleanWhatsapp.startsWith('91') ? cleanWhatsapp : '91' + cleanWhatsapp}?text=Hello%20Dastak%20Fleet%20Support,%20I%20am%20a%20delivery%20partner%20and%20need%20assistance.`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50/80 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 transition-all flex flex-col justify-between gap-3 min-h-[104px] group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:underline">
                        WhatsApp ↗
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Fleet WhatsApp
                      </span>
                      <span className="font-black text-sm text-slate-900 dark:text-slate-100 block truncate mt-0.5">
                        +91 {whatsappPhone}
                      </span>
                    </div>
                  </a>

                  {/* Email Support */}
                  <a
                    href={`mailto:${supportEmail}?subject=Rider%20Support%20Request%20-%20Delivery%20Partner`}
                    className="p-4 rounded-2xl bg-slate-50 hover:bg-blue-50/80 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 transition-all flex flex-col justify-between gap-3 min-h-[104px] group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-[#113BD0] dark:text-blue-400 flex items-center justify-center">
                        <Mail className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-[#113BD0] dark:text-blue-400 group-hover:underline">
                        Email ↗
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Operations Mail
                      </span>
                      <span className="font-black text-sm text-slate-900 dark:text-slate-100 block truncate mt-0.5">
                        {supportEmail}
                      </span>
                    </div>
                  </a>
                </div>

                {/* Global Common Toll-Free Helpline Footer */}
                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#113BD0]" />
                    <span>Common Helpline: <strong className="text-slate-700 dark:text-slate-300 font-bold">{commonPhone}</strong></span>
                  </span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Toll-Free 24x7</span>
                </div>
              </div>
            )
          })()}

          {/* 5. Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full p-3.5 min-h-[46px] rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200/90 dark:border-rose-800/70 text-rose-600 dark:text-rose-400 text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer touch-manipulation active:scale-[0.98] shadow-2xs"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Rider Account</span>
          </button>

          {/* App Version Info */}
          <div className="text-center text-xs text-slate-400 pt-1 space-y-1">
            <p className="font-bold text-slate-500 dark:text-slate-400 text-xs">
              Dastak Rider PWA v1.0.0 (Production Fleet Build)
            </p>
            <p className="text-[11px]">Designed for high-speed multi-drop deliveries</p>
          </div>
        </div>
      </div>

      {/* Change Device Confirmation Modal */}
      {showChangeDeviceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center mx-auto">
              <Smartphone className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h4 className="text-lg font-black text-slate-900 dark:text-white">
                Change Rider Device?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Your current device session will be removed. You will need to verify your mobile number again on this or another device.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowChangeDeviceModal(false)}
                disabled={changeDeviceLoading}
                className="flex-1 font-bold text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleConfirmChangeDevice}
                loading={changeDeviceLoading}
                className="flex-1 font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white"
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SettingsPage
