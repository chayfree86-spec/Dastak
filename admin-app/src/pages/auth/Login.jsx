import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Mail,
  Lock,
  Phone,
  KeyRound,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Bike,
  Package,
  MapPin,
  Compass,
  Navigation,
  Clock,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useToast } from '../../context/ToastContext'
import Button from '../../components/common/Button'

export const Login = () => {
  // Single Unified Identifier with Automatic Last-Login Prefill
  const [identifier, setIdentifier] = useState(() => {
    return localStorage.getItem('dastak_last_login_identifier') || '9628717175'
  })

  // 4-PIN Digits (When Mobile)
  const [pinDigits, setPinDigits] = useState(['', '', '', ''])
  const [focusedIndex, setFocusedIndex] = useState(null)
  const pinInputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)]

  // Password (When Email)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const passwordInputRef = useRef(null)

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const { login, isAuthenticated } = useAuth()
  const { isDark } = useTheme()
  const toast = useToast()
  const navigate = useNavigate()

  // Intelligent Realtime Type Detection:
  const isEmail = /[a-zA-Z@]/.test(identifier.trim())
  const isMobile = !isEmail && identifier.trim().length > 0 && /^\+?[0-9\s-]+$/.test(identifier.trim())

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  // Auto-focus PIN box 1 or password when pre-filled
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isEmail) {
        passwordInputRef.current?.focus()
      } else if (identifier.trim().length >= 10) {
        pinInputRefs[0].current?.focus()
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [isEmail])

  // Handle PIN input changes with auto-advance and backspace
  const handlePinChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const newPin = [...pinDigits]
    newPin[index] = digit
    setPinDigits(newPin)

    // Auto focus next box
    if (digit && index < 3) {
      pinInputRefs[index + 1].current?.focus()
    }
  }

  const handlePinKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      pinInputRefs[index - 1].current?.focus()
    } else if (e.key === 'Enter') {
      handleSubmit(e)
    }
  }

  const handlePinPaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    if (pastedData) {
      const newPin = ['', '', '', '']
      for (let i = 0; i < pastedData.length; i++) {
        newPin[i] = pastedData[i]
      }
      setPinDigits(newPin)
      const focusIndex = Math.min(pastedData.length, 3)
      pinInputRefs[focusIndex].current?.focus()
    }
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    setErrorMsg('')

    const cleanId = identifier.trim()
    if (!cleanId) {
      setErrorMsg('Please enter your mobile number or email address.')
      return
    }

    let secret = ''
    if (isEmail) {
      secret = password.trim()
      if (!secret) {
        setErrorMsg('Please enter your password.')
        return
      }
    } else {
      secret = pinDigits.join('')
      if (cleanId.replace(/\D/g, '').length < 10) {
        setErrorMsg('Please enter a valid 10-digit mobile number.')
        return
      }
      if (secret.length !== 4) {
        setErrorMsg('Please enter your 4-digit Security PIN.')
        return
      }
    }

    setLoading(true)
    try {
      localStorage.setItem('dastak_last_login_identifier', cleanId)

      await login({
        login: cleanId.replace(/\s+/g, ''),
        password: secret,
      })
      toast.success('Welcome back', 'Successfully authenticated into Dastak Admin.')
      navigate('/dashboard')
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }



  return (
    <div className="min-h-screen relative overflow-hidden bg-[#F8FAFC] dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-[#2845D6] selection:text-white transition-colors duration-200">
      <div className="absolute top-4 right-4 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 shadow-sm transition-all cursor-pointer"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>

      <div className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden select-none z-0">
        <div className="absolute -top-24 -left-24 w-[450px] h-[450px] bg-blue-600/10 dark:bg-blue-600/15 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute -bottom-24 -right-24 w-[450px] h-[450px] bg-orange-500/10 dark:bg-orange-500/15 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '3s' }} />

        <div className="absolute top-12 left-6 sm:left-14 lg:left-24 p-3.5 rounded-2xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-orange-200/70 dark:border-orange-900/40 shadow-lg shadow-orange-500/10 text-[#FF5200] animate-float-slow">
          <Bike className="w-6 h-6" />
        </div>

        <div className="absolute top-16 right-6 sm:right-14 lg:right-28 p-3.5 rounded-2xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-blue-200/70 dark:border-blue-900/40 shadow-lg shadow-blue-500/10 text-[#2845D6] dark:text-blue-400 animate-float-reverse">
          <Package className="w-6 h-6" />
        </div>

        <div className="absolute top-1/2 -translate-y-16 left-4 sm:left-10 lg:left-20 p-3.5 rounded-2xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-emerald-200/70 dark:border-emerald-900/40 shadow-lg shadow-emerald-500/10 text-emerald-500 animate-float-horizontal">
          <MapPin className="w-6 h-6" />
        </div>

        <div className="absolute top-1/2 -translate-y-12 right-4 sm:right-10 lg:right-20 p-3.5 rounded-2xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-purple-200/70 dark:border-purple-900/40 shadow-lg shadow-purple-500/10 text-purple-500 animate-float-slow" style={{ animationDelay: '1.5s' }}>
          <Navigation className="w-6 h-6" />
        </div>

        <div className="absolute bottom-14 left-6 sm:left-14 lg:left-24 p-3.5 rounded-2xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-blue-200/70 dark:border-blue-900/40 shadow-lg shadow-blue-500/10 text-[#2845D6] dark:text-blue-400 animate-float-horizontal">
          <ShieldCheck className="w-6 h-6" />
        </div>

        <div className="absolute bottom-14 right-6 sm:right-14 lg:right-28 p-3.5 rounded-2xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-amber-200/70 dark:border-amber-900/40 shadow-lg shadow-amber-500/10 text-amber-500 animate-float-slow" style={{ animationDelay: '2.5s' }}>
          <Compass className="w-6 h-6" />
        </div>
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <div className="flex justify-center mb-4">
          <img
            src="/logo-horizontal.svg"
            alt="Dastak"
            className="h-12 max-h-12 w-auto object-contain drop-shadow-xs"
            style={{ height: '48px', maxHeight: '48px', width: 'auto' }}
            onError={(e) => {
              e.target.onerror = null
              e.target.src = '/logo-horizontal.png'
            }}
          />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Dastak Admin Portal
        </h2>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 font-semibold">
          “Jo Chahiye, Ghar Par” &bull; Operations & Logistics Control
        </p>
      </div>

      <div className="relative z-10 mt-7 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl py-8 px-6 sm:px-8 shadow-2xl border border-slate-200/80 dark:border-slate-800 rounded-3xl">
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="flex-1 font-medium">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. AUTO-DETECTED IDENTIFIER INPUT */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Email or Mobile Number <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] font-bold text-[#2845D6] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md">
                  {isEmail ? 'Email Login' : 'Mobile PIN Login'}
                </span>
              </div>

              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  {isEmail ? (
                    <Mail className="w-4 h-4 text-[#2845D6]" />
                  ) : (
                    <Phone className="w-4 h-4 text-[#2845D6]" />
                  )}
                </div>
                <input
                  type="text"
                  required
                  placeholder="9628717175 or admin@dastak.in"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value)
                    setErrorMsg('')
                  }}
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2845D6] transition-all"
                />
              </div>
            </div>

            {/* 2. DYNAMIC AUTO-SWITCHED SECRET INPUT */}
            {isEmail ? (
              /* EMAIL PASSWORD FIELD */
              <div className="space-y-1.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-[11px] font-semibold text-[#2845D6] dark:text-blue-400 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    ref={passwordInputRef}
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-10 rounded-xl bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2845D6] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ) : (
              /* MOBILE 4-PIN BOXES */
              <div className="space-y-1.5 pt-1 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#2845D6]" />
                    <span>4-Digit Security PIN</span> <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">4 Digits</span>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  {pinDigits.map((digit, idx) => {
                    const isFocused = focusedIndex === idx
                    return (
                      <div
                        key={idx}
                        onClick={() => pinInputRefs[idx].current?.focus()}
                        className={`relative w-full h-11 rounded-xl flex items-center justify-center transition-all cursor-text ${
                          isFocused
                            ? 'bg-white dark:bg-slate-900 border-2 border-[#FF5200] ring-4 ring-[#FF5200]/20 shadow-xs'
                            : digit
                            ? 'bg-slate-50/90 dark:bg-slate-800/90 border border-orange-300/80 dark:border-orange-950/80 shadow-xs'
                            : 'bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <input
                          ref={pinInputRefs[idx]}
                          type="tel"
                          maxLength={1}
                          inputMode="numeric"
                          value={digit}
                          onFocus={() => setFocusedIndex(idx)}
                          onBlur={() => setFocusedIndex(null)}
                          onChange={(e) => handlePinChange(idx, e.target.value)}
                          onKeyDown={(e) => handlePinKeyDown(idx, e)}
                          onPaste={idx === 0 ? handlePinPaste : undefined}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-text"
                        />

                        {digit ? (
                          <span className="w-3.5 h-3.5 rounded-full bg-[#FF5200] shadow-xs shadow-[#FF5200]/50 pointer-events-none transition-transform animate-in zoom-in-75 duration-100" />
                        ) : isFocused ? (
                          <span className="w-0.5 h-4 bg-[#FF5200] animate-pulse pointer-events-none rounded-full" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 pointer-events-none" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-3 font-bold h-11 cursor-pointer shadow-md shadow-[#2845D6]/25"
              icon={ArrowRight}
              iconPosition="right"
            >
              Sign In to Dashboard
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Secure Real-Data API Authentication</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
