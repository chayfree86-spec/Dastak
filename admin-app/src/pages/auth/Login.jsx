import React, { useState, useRef, useEffect, useMemo } from 'react'
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
  Sun,
  Moon,
  Store,
  TrendingUp,
  Zap,
  Activity,
  Layers,
  BarChart3,
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

  // Mouse Parallax Offset
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 })

  const { login, isAuthenticated } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const toast = useToast()
  const navigate = useNavigate()

  // Track Mouse Movement for 3D Dynamic Parallax
  useEffect(() => {
    let animationFrameId
    const handleMouseMove = (e) => {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = requestAnimationFrame(() => {
        const normX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2)
        const normY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2)
        setMouseOffset({ x: normX, y: normY })
      })
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  // Intelligent Realtime Type Detection:
  const isEmail = /[a-zA-Z@]/.test(identifier.trim())

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

  // Scattered Multi-Depth Constellation with Half-Hidden Background Elements
  const bgElements = useMemo(() => [
    // 1. Far Top-Left
    {
      icon: Bike,
      pos: { top: '8%', left: '7%' },
      speed: { x: 38, y: 32 },
      rotate: '-8deg',
      color: 'text-[#FF5200]',
      border: 'border-orange-200/70 dark:border-orange-900/40',
      shadow: 'shadow-orange-500/10',
      size: 'w-6 h-6',
      delay: '0s',
    },
    // 2. Top-Center Left (Mid-Field)
    {
      icon: Package,
      pos: { top: '12%', left: '26%' },
      speed: { x: -22, y: -18 },
      rotate: '12deg',
      color: 'text-[#2845D6] dark:text-blue-400',
      border: 'border-blue-200/70 dark:border-blue-900/40',
      shadow: 'shadow-blue-500/10',
      size: 'w-5 h-5',
      delay: '1.2s',
    },
    // 3. Top-Right Corner
    {
      icon: TrendingUp,
      pos: { top: '9%', right: '8%' },
      speed: { x: 32, y: 28 },
      rotate: '-6deg',
      color: 'text-emerald-500',
      border: 'border-emerald-200/70 dark:border-emerald-900/40',
      shadow: 'shadow-emerald-500/10',
      size: 'w-6 h-6',
      delay: '2s',
    },
    // 4. Top-Center Right (Mid-Field)
    {
      icon: Activity,
      pos: { top: '16%', right: '25%' },
      speed: { x: -28, y: -24 },
      rotate: '8deg',
      color: 'text-rose-500',
      border: 'border-rose-200/70 dark:border-rose-900/40',
      shadow: 'shadow-rose-500/10',
      size: 'w-5 h-5',
      delay: '0.8s',
    },
    // 5. HALF-HIDDEN BEHIND LOGIN BOX: Top-Left Edge Behind Box
    {
      icon: Layers,
      pos: { top: '34%', left: '33%' },
      speed: { x: 14, y: 12 },
      rotate: '-15deg',
      color: 'text-indigo-500 dark:text-indigo-400',
      border: 'border-indigo-200/80 dark:border-indigo-900/50',
      shadow: 'shadow-indigo-500/15',
      size: 'w-6 h-6',
      delay: '3s',
      halfHide: true,
    },
    // 6. HALF-HIDDEN BEHIND LOGIN BOX: Bottom-Right Edge Behind Box
    {
      icon: BarChart3,
      pos: { bottom: '26%', right: '32%' },
      speed: { x: -16, y: -14 },
      rotate: '14deg',
      color: 'text-amber-500',
      border: 'border-amber-200/80 dark:border-amber-900/50',
      shadow: 'shadow-amber-500/15',
      size: 'w-6 h-6',
      delay: '1.5s',
      halfHide: true,
    },
    // 7. HALF-HIDDEN BEHIND LOGIN BOX: Mid-Right Peeking Under Edge
    {
      icon: ShieldCheck,
      pos: { top: '50%', right: '34%' },
      speed: { x: 18, y: 15 },
      rotate: '-10deg',
      color: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200/80 dark:border-blue-900/50',
      shadow: 'shadow-blue-500/15',
      size: 'w-5 h-5',
      delay: '2.5s',
      halfHide: true,
    },
    // 8. Mid-Left Scattered
    {
      icon: MapPin,
      pos: { top: '48%', left: '6%' },
      speed: { x: -35, y: 28 },
      rotate: '6deg',
      color: 'text-emerald-500',
      border: 'border-emerald-200/70 dark:border-emerald-900/40',
      shadow: 'shadow-emerald-500/10',
      size: 'w-6 h-6',
      delay: '1.8s',
    },
    // 9. Mid-Right Scattered
    {
      icon: Navigation,
      pos: { top: '44%', right: '6%' },
      speed: { x: 36, y: -26 },
      rotate: '-14deg',
      color: 'text-purple-500',
      border: 'border-purple-200/70 dark:border-purple-900/40',
      shadow: 'shadow-purple-500/10',
      size: 'w-6 h-6',
      delay: '2.2s',
    },
    // 10. Bottom-Left Corner
    {
      icon: Compass,
      pos: { bottom: '10%', left: '8%' },
      speed: { x: 30, y: -34 },
      rotate: '12deg',
      color: 'text-[#2845D6] dark:text-blue-400',
      border: 'border-blue-200/70 dark:border-blue-900/40',
      shadow: 'shadow-blue-500/10',
      size: 'w-6 h-6',
      delay: '0.5s',
    },
    // 11. Bottom-Center Left
    {
      icon: Store,
      pos: { bottom: '16%', left: '28%' },
      speed: { x: -22, y: 20 },
      rotate: '-8deg',
      color: 'text-orange-500',
      border: 'border-orange-200/70 dark:border-orange-900/40',
      shadow: 'shadow-orange-500/10',
      size: 'w-5 h-5',
      delay: '3.5s',
    },
    // 12. Bottom-Right Corner
    {
      icon: Zap,
      pos: { bottom: '9%', right: '8%' },
      speed: { x: -38, y: 32 },
      rotate: '15deg',
      color: 'text-amber-500',
      border: 'border-amber-200/70 dark:border-amber-900/40',
      shadow: 'shadow-amber-500/10',
      size: 'w-6 h-6',
      delay: '1s',
    },
  ], [])

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#F8FAFC] dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-[#2845D6] selection:text-white transition-colors duration-200">
      {/* Theme Toggle in Top Right */}
      <div className="absolute top-4 right-4 z-30">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 shadow-sm transition-all cursor-pointer"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* FULL-VIEWPORT MOUSE-REACTIVE 3D PARALLAX ICON CONSTELLATION */}
      {/* ========================================================================= */}
      <div className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden select-none z-0">
        {/* Soft Ambient Mesh Background */}
        <div
          style={{
            transform: `translate3d(${mouseOffset.x * -15}px, ${mouseOffset.y * -15}px, 0)`,
          }}
          className="absolute -top-24 -left-24 w-[480px] h-[480px] bg-blue-600/10 dark:bg-blue-600/15 rounded-full blur-3xl transition-transform duration-700 ease-out"
        />
        <div
          style={{
            transform: `translate3d(${mouseOffset.x * 20}px, ${mouseOffset.y * 20}px, 0)`,
          }}
          className="absolute -bottom-24 -right-24 w-[480px] h-[480px] bg-orange-500/10 dark:bg-orange-500/15 rounded-full blur-3xl transition-transform duration-700 ease-out"
        />

        {/* Scattered Dynamic Floating Icons */}
        {bgElements.map((item, idx) => {
          const Icon = item.icon
          const transX = mouseOffset.x * item.speed.x
          const transY = mouseOffset.y * item.speed.y

          return (
            <div
              key={idx}
              style={{
                ...item.pos,
                transform: `translate3d(${transX}px, ${transY}px, 0) rotate(${item.rotate})`,
                animationDelay: item.delay,
              }}
              className="absolute pointer-events-none transition-transform duration-500 ease-out"
            >
              <div
                className={`p-3.5 rounded-2xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border ${item.border} ${item.shadow} ${item.color} animate-float-slow transition-colors`}
              >
                <Icon className={item.size} />
              </div>
            </div>
          )
        })}
      </div>

      {/* ========================================================================= */}
      {/* BRAND HEADER */}
      {/* ========================================================================= */}
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

      {/* ========================================================================= */}
      {/* AUTHENTICATION CARD (Layers ABOVE background icons, creating half-hidden overlap) */}
      {/* ========================================================================= */}
      <div className="relative z-10 mt-7 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl py-8 px-6 sm:px-8 shadow-2xl border border-slate-200/90 dark:border-slate-800 rounded-3xl transition-colors">
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
