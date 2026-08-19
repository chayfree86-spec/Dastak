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
    <div className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-[#070D1F] flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-[#2845D6] selection:text-white">
      {/* ======================================================== */}
      {/* 1. DELIVERY LOGISTICS MESH & ROUTE PATTERN BACKGROUND */}
      {/* ======================================================== */}
      {/* Ambient Gradient Mesh Orbs with Soft Pulse */}
      <div className="absolute top-[-10%] left-[-5%] w-[45vw] h-[45vw] max-w-[500px] max-h-[500px] bg-gradient-to-br from-[#2845D6]/15 to-transparent dark:from-[#2845D6]/25 rounded-full blur-3xl pointer-events-none animate-pulse-soft" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[45vw] h-[45vw] max-w-[500px] max-h-[500px] bg-gradient-to-tl from-[#FF5200]/12 to-transparent dark:from-[#FF5200]/20 rounded-full blur-3xl pointer-events-none animate-pulse-soft" style={{ animationDelay: '3s' }} />
      <div className="absolute top-[35%] right-[10%] w-72 h-72 bg-emerald-500/8 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-pulse-soft" style={{ animationDelay: '1.5s' }} />

      {/* SVG Delivery Route & Urban Grid Pattern with Motion Flow */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.07] dark:opacity-[0.09] pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern id="delivery-grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path
              d="M 80 0 L 0 0 0 80"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="4,4"
              className="text-slate-900 dark:text-white"
            />
            <circle cx="40" cy="40" r="1.5" className="fill-slate-900 dark:fill-white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#delivery-grid)" />
        {/* Curving Delivery Route Waypoints with continuous dash flow */}
        <path
          d="M 0 150 Q 300 80 600 240 T 1200 180 T 1800 350"
          fill="none"
          stroke="#2845D6"
          strokeWidth="3"
          strokeDasharray="10,8"
          opacity="0.75"
          className="animate-dash-flow"
        />
        <path
          d="M 100 800 Q 450 650 900 720 T 1600 600"
          fill="none"
          stroke="#FF5200"
          strokeWidth="3"
          strokeDasharray="10,8"
          opacity="0.65"
          className="animate-dash-flow"
          style={{ animationDirection: 'reverse', animationDuration: '24s' }}
        />
      </svg>

      {/* Floating Ambient Delivery Badges with Micro-Motion & Live Pulse Dots */}
      <div className="absolute top-16 left-10 lg:left-20 hidden sm:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 shadow-md text-slate-700 dark:text-slate-200 text-xs font-bold pointer-events-none animate-float-slow select-none">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF5200]" />
        </span>
        <Bike className="w-4 h-4 text-[#FF5200]" />
        <span>Live Express Fleet</span>
      </div>

      <div className="absolute bottom-16 left-12 lg:left-24 hidden sm:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 shadow-md text-slate-700 dark:text-slate-200 text-xs font-bold pointer-events-none animate-float-horizontal select-none">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2845D6]" />
        </span>
        <Package className="w-4 h-4 text-[#2845D6]" />
        <span>10-20 Min Fast Delivery</span>
      </div>

      <div className="absolute top-20 right-10 lg:right-24 hidden sm:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 shadow-md text-slate-700 dark:text-slate-200 text-xs font-bold pointer-events-none animate-float-reverse select-none">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <MapPin className="w-4 h-4 text-emerald-500" />
        <span>Hyperlocal Zones</span>
      </div>

      <div className="absolute bottom-20 right-12 lg:right-28 hidden sm:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 shadow-md text-slate-700 dark:text-slate-200 text-xs font-bold pointer-events-none animate-float-slow select-none" style={{ animationDelay: '1.8s' }}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
        </span>
        <Navigation className="w-4 h-4 text-purple-500" />
        <span>GPS Routing Engine</span>
      </div>

      {/* ======================================================== */}
      {/* 2. LOGIN CARD & BRAND HEADER */}
      {/* ======================================================== */}
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
