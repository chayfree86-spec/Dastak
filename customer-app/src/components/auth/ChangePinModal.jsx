import React, { useState, useEffect, useRef } from 'react'
import { KeyRound, Lock, X, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react'
import Button from '../common/Button'
import customerApi from '../../api/customer.api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

export const ChangePinModal = ({ isOpen, onClose, onSuccess }) => {
  const { user, updateSessionUser } = useAuth()
  const toast = useToast()

  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const currentPinRef = useRef(null)
  const newPinRef = useRef(null)
  const confirmPinRef = useRef(null)

  const mobile = user?.mobile || ''
  const hasCustomPin = Boolean(user?.has_custom_pin)
  const defaultPinHint = mobile ? mobile.slice(-4) : '••••'

  // Reset and auto focus first field when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentPin('')
      setNewPin('')
      setConfirmPin('')
      setError('')
      const timer = setTimeout(() => {
        currentPinRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e?.preventDefault()
    setError('')

    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setError('New PIN must be exactly 4 numeric digits.')
      newPinRef.current?.focus()
      return
    }

    if (newPin !== confirmPin) {
      setError('New PIN and Confirm PIN do not match.')
      confirmPinRef.current?.focus()
      return
    }

    setLoading(true)
    try {
      await customerApi.changePin({
        current_pin: currentPin.trim() || undefined,
        new_pin: newPin.trim(),
        new_pin_confirmation: confirmPin.trim(),
      })
      if (user) {
        updateSessionUser({ ...user, has_custom_pin: true })
      }
      toast.success('PIN Updated Successfully', 'Your new 4-digit login PIN is active.')
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          (hasCustomPin
            ? 'Current PIN is incorrect. Please enter your valid 4-digit PIN.'
            : `Current PIN is incorrect. Default PIN is the last 4 digits (${defaultPinHint}) of your mobile.`)
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose()
      }}
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-[#FF5200] flex items-center justify-center font-bold shadow-xs">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                Change 4-Digit Login PIN
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Fast & secure 1-tap login credentials
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Current PIN */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Current 4-Digit PIN</span>
              {!hasCustomPin && (
                <span className="text-[10px] text-slate-400 font-normal">
                  Default: <strong>{defaultPinHint}</strong>
                </span>
              )}
            </label>
            <div className="relative">
              <input
                ref={currentPinRef}
                type="password"
                maxLength={4}
                inputMode="numeric"
                placeholder="Enter current 4-digit PIN"
                value={currentPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                  setCurrentPin(val)
                  setError('')
                  if (val.length === 4) newPinRef.current?.focus()
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    newPinRef.current?.focus()
                  }
                }}
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF5200] tracking-widest"
              />
            </div>
          </div>

          {/* New PIN */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              New 4-Digit PIN <span className="text-rose-500">*</span>
            </label>
            <input
              ref={newPinRef}
              type="password"
              required
              maxLength={4}
              inputMode="numeric"
              placeholder="Enter new 4-digit PIN"
              value={newPin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                setNewPin(val)
                setError('')
                if (val.length === 4) confirmPinRef.current?.focus()
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  confirmPinRef.current?.focus()
                }
              }}
              className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF5200] tracking-widest"
            />
          </div>

          {/* Confirm New PIN */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Confirm New PIN <span className="text-rose-500">*</span>
            </label>
            <input
              ref={confirmPinRef}
              type="password"
              required
              maxLength={4}
              inputMode="numeric"
              placeholder="Re-enter new 4-digit PIN"
              value={confirmPin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                setConfirmPin(val)
                setError('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
              className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF5200] tracking-widest"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>PIN is encrypted and stored safely for instant device login.</span>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={CheckCircle2}
              loading={loading}
              className="flex-1 bg-[#FF5200] hover:bg-[#EA580C] text-white shadow-md shadow-orange-500/25 cursor-pointer"
            >
              Update PIN
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ChangePinModal
