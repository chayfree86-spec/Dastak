import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Store, Lock, Phone, Mail, ArrowRight, ShieldCheck, Eye, EyeOff, KeyRound } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'

export const Login = () => {
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [identifier, setIdentifier] = useState('9628717175')
  const [password, setPassword] = useState('2310')
  const [showPassword, setShowPassword] = useState(false)
  const [pinDigits, setPinDigits] = useState(['2', '3', '1', '0'])
  const [activePinIndex, setActivePinIndex] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const pinRefs = [useRef(null), useRef(null), useRef(null), useRef(null)]

  // Determine if user entered an email or phone number
  const isEmail = identifier.trim().includes('@')

  // Keep password state synchronized when PIN digits change
  useEffect(() => {
    if (!isEmail) {
      setPassword(pinDigits.join(''))
    }
  }, [pinDigits, isEmail])

  // Handle single digit PIN change & auto-advance
  const handlePinChange = (index, value) => {
    const char = value.replace(/[^0-9]/g, '').slice(-1)
    const newPin = [...pinDigits]
    newPin[index] = char
    setPinDigits(newPin)

    // Auto-focus next box if digit was entered
    if (char && index < 3) {
      pinRefs[index + 1].current?.focus()
    }
  }

  // Handle Backspace navigation across PIN boxes
  const handlePinKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!pinDigits[index] && index > 0) {
        pinRefs[index - 1].current?.focus()
      }
    }
  }

  // Handle Pasting 4-digit PIN
  const handlePinPaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 4)
    if (!pasted) return

    const newPin = ['', '', '', '']
    pasted.split('').forEach((digit, idx) => {
      if (idx < 4) newPin[idx] = digit
    })
    setPinDigits(newPin)

    const nextIndex = Math.min(pasted.length, 3)
    pinRefs[nextIndex].current?.focus()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const cleanIdentifier = identifier.trim()
    const cleanPassword = isEmail ? password.trim() : pinDigits.join('')

    if (!cleanIdentifier) {
      setError('Please enter your registered mobile number or email address.')
      return
    }

    if (!isEmail && cleanPassword.length < 4) {
      setError('Please enter your complete 4-digit security PIN.')
      pinRefs[cleanPassword.length]?.current?.focus()
      return
    }

    if (isEmail && !cleanPassword) {
      setError('Please enter your account password.')
      return
    }

    setLoading(true)
    try {
      await login(cleanIdentifier, cleanPassword)
      toast.success('Welcome back!', 'Restaurant kitchen portal is now active.')
      navigate('/new-orders', { replace: true })
    } catch (err) {
      setError(err.message || 'Invalid credentials or account suspended.')
      toast.error('Login Failed', err.message || 'Invalid credentials.')
    } finally {
      setLoading(false)
    }
  }

  const buttonLabel = identifier === '9628717175' ? 'Login (Chay Chaupal)' : 'Login (Restaurant)'

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-radial from-blue-50/50 via-[#F8FAFC] to-[#F8FAFC]">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-[#2845D6] text-white flex items-center justify-center font-black text-2xl mx-auto shadow-xl shadow-blue-500/25">
            D
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dastak Partner</h1>
          <p className="text-xs font-semibold text-slate-400">
            Restaurant Kitchen & POS Operations Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xl shadow-slate-200/40 space-y-5">
          <div>
            <h2 className="text-lg font-black text-slate-900 leading-tight">Restaurant Login</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter your registered mobile or email credentials to access POS.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Identifier Input (Mobile or Email) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Registered Mobile or Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  {isEmail ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                </div>
                <input
                  type="text"
                  placeholder="e.g. 9628717175 or chef@restaurant.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 h-12 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:border-[#2845D6] focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                  required
                />
              </div>
            </div>

            {/* 2A. Password Field for Email Login */}
            {isEmail ? (
              <div className="space-y-1.5 transition-all">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Account Password <span className="text-rose-500">*</span>
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your account password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-11 h-12 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:border-[#2845D6] focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ) : (
              /* 2B. 4-Box Security PIN with Auto-Focus for Mobile Login */
              <div className="space-y-2 transition-all">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#2845D6]" />
                    <span>4-Digit Security PIN</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-slate-400">
                    Auto-advancing boxes
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2.5 sm:gap-3.5" onPaste={handlePinPaste}>
                  {[0, 1, 2, 3].map((index) => (
                    <div
                      key={index}
                      onClick={() => pinRefs[index].current?.focus()}
                      className={`relative w-full h-12 rounded-xl flex items-center justify-center cursor-text transition-all ${
                        activePinIndex === index
                          ? 'border-2 border-[#2845D6] bg-blue-50/40 shadow-md shadow-blue-500/15 ring-4 ring-blue-500/15'
                          : pinDigits[index]
                          ? 'border-2 border-[#2845D6]/80 bg-blue-50/20 shadow-xs'
                          : 'border-2 border-slate-200 bg-slate-50/60 hover:border-slate-300'
                      }`}
                    >
                      {/* Hidden Accessible Input for keyboard & typing */}
                      <input
                        ref={pinRefs[index]}
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={pinDigits[index]}
                        onChange={(e) => handlePinChange(index, e.target.value)}
                        onKeyDown={(e) => handlePinKeyDown(index, e)}
                        onFocus={(e) => {
                          e.target.select()
                          setActivePinIndex(index)
                        }}
                        onBlur={() => setActivePinIndex(null)}
                        className="absolute inset-0 w-full h-full opacity-0 text-center cursor-text select-none"
                        required
                      />

                      {/* Mathematically Centered Orange Dot / Empty Indicator */}
                      {pinDigits[index] ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#F97316] shadow-sm shadow-orange-500/40 pointer-events-none transition-transform duration-150 transform scale-100" />
                      ) : (
                        <span
                          className={`w-1.5 h-1.5 rounded-full pointer-events-none transition-all ${
                            activePinIndex === index ? 'bg-[#2845D6] animate-pulse scale-125' : 'bg-slate-300'
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold leading-relaxed">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              icon={ArrowRight}
              className="w-full h-12 text-sm font-black shadow-lg shadow-blue-500/25 mt-3 cursor-pointer rounded-xl"
            >
              {buttonLabel}
            </Button>
          </form>
        </div>

        {/* Footer Support Notice */}
        <div className="text-center space-y-1 text-xs text-slate-400">
          <p className="flex items-center justify-center gap-1.5 font-bold text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Secure Real-Time Platform Connection</span>
          </p>
          <p className="text-[11px]">Forgot PIN/password or need kitchen staff access? Contact Dastak Support.</p>
        </div>
      </div>
    </div>
  )
}

export default Login
