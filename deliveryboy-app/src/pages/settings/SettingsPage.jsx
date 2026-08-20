import React, { useState } from 'react'
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
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useSound } from '../../context/SoundContext'
import { useToast } from '../../context/ToastContext'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import authApi from '../../api/auth.api'

export const SettingsPage = () => {
  const navigate = useNavigate()
  const { user, logout, changeDevice } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const { soundEnabled, toggleSound, playAlert } = useSound()
  const toast = useToast()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const [showChangeDeviceModal, setShowChangeDeviceModal] = useState(false)
  const [changeDeviceLoading, setChangeDeviceLoading] = useState(false)

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
    <div className="space-y-4">
      <div>
        <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          App Settings & Preferences
        </h2>
        <p className="text-xs text-slate-400">
          Configure security, alerts, and user interface preferences
        </p>
      </div>

      {/* 1. App Interface & Audio Preferences Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700/60 pb-3">
          App Preferences
        </h3>

        <div className="space-y-3">
          {/* Theme Option */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Dark Mode Theme
                </span>
                <span className="text-[11px] text-slate-400">
                  {isDark ? 'Dark theme is currently active' : 'Light theme is currently active'}
                </span>
              </div>
            </div>
            <Button variant="outline" size="xs" onClick={toggleTheme}>
              {isDark ? 'Switch Light' : 'Switch Dark'}
            </Button>
          </div>

          {/* Sound Alert Option */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-[#113BD0] dark:text-blue-400">
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  New Assignment Audio Alert
                </span>
                <span className="text-[11px] text-slate-400">
                  High-priority sound chime when a trip is assigned
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="xs"
                onClick={playAlert}
                className="text-[11px]"
              >
                Test Sound
              </Button>
              <Button
                variant={soundEnabled ? 'primary' : 'outline'}
                size="xs"
                onClick={toggleSound}
              >
                {soundEnabled ? 'Mute' : 'Enable'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Device Management & Change Device */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700/60 pb-3">
          Device & Session Security
        </h3>

        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-black text-slate-900 dark:text-slate-100 text-xs">
                Change Device
              </h5>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Switch your active rider session to another phone or tablet
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="xs"
            onClick={() => setShowChangeDeviceModal(true)}
            className="font-bold text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50"
          >
            Change Device
          </Button>
        </div>
      </div>

      {/* 3. Change Password / Security PIN Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700/60 pb-3">
          Change Password / Security PIN
        </h3>

        <form onSubmit={handlePasswordChange} className="space-y-3 max-w-md text-xs">
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
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={passwordLoading}
              icon={CheckCircle2}
            >
              Update Password
            </Button>
          </div>
        </form>
      </div>

      {/* Logout Button */}
      <button
        type="button"
        onClick={handleLogout}
        className="w-full p-4 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-black flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        <span>Sign Out of Rider Account</span>
      </button>

      {/* App Version Info */}
      <div className="text-center text-xs text-slate-400 pt-2 space-y-1">
        <p className="font-bold text-slate-500 dark:text-slate-400">
          Dastak Rider PWA v1.0.0 (Production Fleet Build)
        </p>
        <p className="text-[11px]">Designed for high-speed multi-drop deliveries</p>
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
