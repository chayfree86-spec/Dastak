import React, { useState } from 'react'
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
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useSound } from '../../context/SoundContext'
import { useToast } from '../../context/ToastContext'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import authApi from '../../api/auth.api'

export const SettingsPage = () => {
  const { user } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const { soundEnabled, toggleSound, playAlert } = useSound()
  const toast = useToast()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')

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
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-[#2845D6] dark:text-blue-400">
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

      {/* 2. Change Password / Security PIN Card */}
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

      {/* App Version Info */}
      <div className="text-center text-xs text-slate-400 pt-2 space-y-1">
        <p className="font-bold text-slate-500 dark:text-slate-400">
          Dastak Rider PWA v1.0.0 (Production Fleet Build)
        </p>
        <p className="text-[11px]">Designed for high-speed multi-drop deliveries</p>
      </div>
    </div>
  )
}

export default SettingsPage
