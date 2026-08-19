import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Phone,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  AlertCircle,
  RefreshCw,
  KeyRound,
  CheckCircle2,
  UtensilsCrossed,
  ShoppingBag,
  Coffee,
  Pizza,
  Soup,
  Sandwich,
  Cake,
  Apple,
  IceCream,
  Salad,
  Flame,
  CookingPot,
  Moon,
  Sun,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useTheme } from '../../context/ThemeContext'
import Button from '../../components/common/Button'

export const LoginPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

  const { startVerification, resendOtp, verifyDeviceOtp, isAuthenticated } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const toast = useToast()

  // Steps: 'mobile' | 'otp' | 'active_elsewhere'
  const [step, setStep] = useState('mobile')
  const [mobile, setMobile] = useState('9876543210')
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [generatedOtp, setGeneratedOtp] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [activeDeviceInfo, setActiveDeviceInfo] = useState({ deviceName: '', instructions: '' })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [focusedOtpIdx, setFocusedOtpIdx] = useState(null)

  // Mouse Parallax Offset
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 })

  const otpInputsRef = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)]

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

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirect, { replace: true })
    }
  }, [isAuthenticated, navigate, redirect])

  // Helper to prefill and store OTP
  const applyOtp = (rawOtp) => {
    const code = String(rawOtp || '').trim().slice(0, 6)
    if (code) {
      setGeneratedOtp(code)
      const split = code.split('')
      while (split.length < 6) split.push('')
      setOtpDigits(split)
    }
  }

  // 1. Submit Mobile Number & Start Device Verification
  const handleStartVerification = async (e) => {
    e?.preventDefault()
    setError('')
    const cleanMobile = mobile.replace(/\D/g, '')

    if (cleanMobile.length < 10) {
      setError('Please enter a valid 10-digit Indian mobile number.')
      return
    }

    setLoading(true)
    try {
      const res = await startVerification(cleanMobile)
      const data = res?.data?.data || res?.data || res

      if (data.session_active_elsewhere) {
        setActiveDeviceInfo({
          deviceName: data.active_device_name || 'Another Mobile Phone',
          instructions: data.instructions || 'Open Dastak on your existing phone and go to Settings → Change Device.',
        })
        setStep('active_elsewhere')
      } else {
        setSessionId(data.verification_session_id)
        applyOtp(data.otp)
        setStep('otp')
        toast.success('Verification Code Ready', `Code ${data.otp || ''} generated.`)
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Verification could not be initiated.')
    } finally {
      setLoading(false)
    }
  }

  // 2. Resend / Regenerate OTP
  const handleResendOtp = async () => {
    if (!sessionId) return
    setError('')
    setLoading(true)
    try {
      const res = await resendOtp(sessionId)
      const data = res?.data?.data || res?.data || res
      applyOtp(data.otp)
      toast.success('New Code Generated', `Code ${data.otp || ''} is ready.`)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to regenerate code.')
    } finally {
      setLoading(false)
    }
  }

  // 3. Handle OTP Input Changes
  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const newOtp = [...otpDigits]
    newOtp[index] = digit
    setOtpDigits(newOtp)

    if (digit && index < 5) {
      otpInputsRef[index + 1].current?.focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef[index - 1].current?.focus()
    } else if (e.key === 'Enter') {
      handleVerifyOtp(e)
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted) {
      const newOtp = ['', '', '', '', '', '']
      for (let i = 0; i < pasted.length; i++) {
        newOtp[i] = pasted[i]
      }
      setOtpDigits(newOtp)
      const targetIdx = Math.min(pasted.length, 5)
      otpInputsRef[targetIdx].current?.focus()
    }
  }

  // 4. Verify OTP & Establish Permanent Session
  const handleVerifyOtp = async (e) => {
    e?.preventDefault()
    setError('')
    const code = otpDigits.join('')

    if (code.length < 6) {
      setError('Please enter the full 6-digit verification code.')
      return
    }

    setLoading(true)
    try {
      await verifyDeviceOtp(sessionId, code)
      toast.success('Welcome to Dastak!', 'Successfully authenticated.')
      navigate(redirect, { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Verification failed. Please check the code.')
    } finally {
      setLoading(false)
    }
  }

  // Scattered Multi-Depth Constellation with Half-Hidden Background Food Elements
  const bgElements = useMemo(() => [
    // 1. Far Top-Left
    {
      icon: Pizza,
      pos: { top: '8%', left: '7%' },
      speed: { x: 36, y: 30 },
      rotate: '-10deg',
      color: 'text-[#FF5200]',
      border: 'border-orange-200/70 dark:border-orange-900/40',
      shadow: 'shadow-orange-500/10',
      size: 'w-6 h-6',
      delay: '0s',
    },
    // 2. Top-Center Left (Mid-Field)
    {
      icon: Soup,
      pos: { top: '12%', left: '26%' },
      speed: { x: -24, y: -20 },
      rotate: '10deg',
      color: 'text-amber-500',
      border: 'border-amber-200/70 dark:border-amber-900/40',
      shadow: 'shadow-amber-500/10',
      size: 'w-5 h-5',
      delay: '1.2s',
    },
    // 3. Top-Right Corner
    {
      icon: Sandwich,
      pos: { top: '9%', right: '8%' },
      speed: { x: 30, y: 26 },
      rotate: '-8deg',
      color: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-200/70 dark:border-amber-900/40',
      shadow: 'shadow-amber-500/10',
      size: 'w-6 h-6',
      delay: '2s',
    },
    // 4. Top-Center Right (Mid-Field)
    {
      icon: IceCream,
      pos: { top: '16%', right: '25%' },
      speed: { x: -28, y: -22 },
      rotate: '12deg',
      color: 'text-pink-500',
      border: 'border-pink-200/70 dark:border-pink-900/40',
      shadow: 'shadow-pink-500/10',
      size: 'w-5 h-5',
      delay: '0.8s',
    },
    // 5. HALF-HIDDEN BEHIND LOGIN BOX: Top-Left Edge Behind Box
    {
      icon: Flame,
      pos: { top: '34%', left: '33%' },
      speed: { x: 14, y: 12 },
      rotate: '-14deg',
      color: 'text-rose-500',
      border: 'border-rose-200/80 dark:border-rose-900/50',
      shadow: 'shadow-rose-500/15',
      size: 'w-6 h-6',
      delay: '3s',
      halfHide: true,
    },
    // 6. HALF-HIDDEN BEHIND LOGIN BOX: Bottom-Right Edge Behind Box
    {
      icon: CookingPot,
      pos: { bottom: '26%', right: '32%' },
      speed: { x: -16, y: -14 },
      rotate: '15deg',
      color: 'text-[#FF5200]',
      border: 'border-orange-200/80 dark:border-orange-900/50',
      shadow: 'shadow-orange-500/15',
      size: 'w-6 h-6',
      delay: '1.5s',
      halfHide: true,
    },
    // 7. HALF-HIDDEN BEHIND LOGIN BOX: Mid-Right Peeking Under Edge
    {
      icon: UtensilsCrossed,
      pos: { top: '50%', right: '34%' },
      speed: { x: 18, y: 15 },
      rotate: '-10deg',
      color: 'text-[#FF5200]',
      border: 'border-orange-200/80 dark:border-orange-900/50',
      shadow: 'shadow-orange-500/15',
      size: 'w-5 h-5',
      delay: '2.5s',
      halfHide: true,
    },
    // 8. Mid-Left Scattered
    {
      icon: ShoppingBag,
      pos: { top: '48%', left: '6%' },
      speed: { x: -34, y: 28 },
      rotate: '6deg',
      color: 'text-emerald-500',
      border: 'border-emerald-200/70 dark:border-emerald-900/40',
      shadow: 'shadow-emerald-500/10',
      size: 'w-6 h-6',
      delay: '1.8s',
    },
    // 9. Mid-Right Scattered
    {
      icon: Coffee,
      pos: { top: '44%', right: '6%' },
      speed: { x: 35, y: -26 },
      rotate: '-12deg',
      color: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200/70 dark:border-amber-900/40',
      shadow: 'shadow-amber-500/10',
      size: 'w-6 h-6',
      delay: '2.2s',
    },
    // 10. Bottom-Left Corner
    {
      icon: Cake,
      pos: { bottom: '10%', left: '8%' },
      speed: { x: 28, y: -32 },
      rotate: '10deg',
      color: 'text-purple-500',
      border: 'border-purple-200/70 dark:border-purple-900/40',
      shadow: 'shadow-purple-500/10',
      size: 'w-6 h-6',
      delay: '0.5s',
    },
    // 11. Bottom-Center Left
    {
      icon: Apple,
      pos: { bottom: '16%', left: '28%' },
      speed: { x: -22, y: 20 },
      rotate: '-8deg',
      color: 'text-rose-500',
      border: 'border-rose-200/70 dark:border-rose-900/40',
      shadow: 'shadow-rose-500/10',
      size: 'w-5 h-5',
      delay: '3.5s',
    },
    // 12. Bottom-Right Corner
    {
      icon: Salad,
      pos: { bottom: '9%', right: '8%' },
      speed: { x: -36, y: 30 },
      rotate: '14deg',
      color: 'text-emerald-500',
      border: 'border-emerald-200/70 dark:border-emerald-900/40',
      shadow: 'shadow-emerald-500/10',
      size: 'w-6 h-6',
      delay: '1s',
    },
  ], [])

  return (
    <div className="relative min-h-screen w-full bg-[#F8FAFC] dark:bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 transition-colors duration-200 font-sans antialiased overflow-hidden selection:bg-[#FF5200] selection:text-white">
      {/* Theme Toggle Top Right */}
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
      {/* FULL-VIEWPORT MOUSE-REACTIVE 3D PARALLAX FOOD CONSTELLATION */}
      {/* ========================================================================= */}
      <div className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden select-none z-0">
        {/* Soft Ambient Mesh */}
        <div
          style={{
            transform: `translate3d(${mouseOffset.x * -15}px, ${mouseOffset.y * -15}px, 0)`,
          }}
          className="absolute -top-24 -left-24 w-[480px] h-[480px] bg-orange-500/10 dark:bg-orange-500/15 rounded-full blur-3xl transition-transform duration-700 ease-out"
        />
        <div
          style={{
            transform: `translate3d(${mouseOffset.x * 20}px, ${mouseOffset.y * 20}px, 0)`,
          }}
          className="absolute -bottom-24 -right-24 w-[480px] h-[480px] bg-blue-600/10 dark:bg-blue-600/15 rounded-full blur-3xl transition-transform duration-700 ease-out"
        />

        {/* Scattered Dynamic Floating Food Icons */}
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
      {/* 2. AUTHENTICATION CARD (Layers ABOVE background icons) */}
      {/* ========================================================================= */}
      <div className="relative z-10 w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 transition-colors">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <img
              src="/logo-horizontal.svg"
              alt="Dastak"
              className="h-10 max-h-10 w-auto object-contain"
              onError={(e) => {
                e.target.onerror = null
                e.target.src = '/logo-horizontal.png'
              }}
            />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {step === 'active_elsewhere'
              ? 'Active On Another Device'
              : step === 'otp'
              ? 'Verify Mobile Number'
              : 'Customer Sign In'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {step === 'active_elsewhere'
              ? 'Single-phone security policy is active'
              : step === 'otp'
              ? `Verification code for +91 ${mobile.replace(/\D/g, '')}`
              : 'Enter your 10-digit mobile number to continue'}
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* CASE C: ACTIVE ON ANOTHER DEVICE NOTICE */}
        {step === 'active_elsewhere' && (
          <div className="space-y-5 animate-in fade-in">
            <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-xs">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-amber-900 dark:text-amber-200">
                  This mobile number is already active on another phone.
                </h4>
                <p className="text-xs text-amber-700 dark:text-amber-300/90 leading-relaxed font-medium">
                  {activeDeviceInfo.instructions}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-2">
              <p className="font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>How to switch to this phone:</span>
              </p>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                <li>Open Dastak App on your existing active phone</li>
                <li>Go to <strong>Settings</strong></li>
                <li>Tap <strong>Change Device</strong> and confirm</li>
                <li>Come back here and enter your mobile number again</li>
              </ol>
            </div>

            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                setStep('mobile')
                setError('')
              }}
              className="w-full font-bold h-11"
              icon={ArrowLeft}
            >
              Back to Mobile Input
            </Button>
          </div>
        )}

        {/* STEP 1: MOBILE NUMBER INPUT */}
        {step === 'mobile' && (
          <form onSubmit={handleStartVerification} className="space-y-4 animate-in fade-in">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 flex items-center gap-1.5 text-slate-500 font-bold text-xs pointer-events-none">
                  <Phone className="w-4 h-4 text-[#FF5200]" />
                  <span>+91</span>
                </div>
                <input
                  type="tel"
                  required
                  autoFocus
                  maxLength={10}
                  placeholder="9876543210"
                  value={mobile}
                  onChange={(e) => {
                    setMobile(e.target.value.replace(/\D/g, ''))
                    setError('')
                  }}
                  className="w-full h-11 pl-16 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF5200]"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full font-bold h-11 mt-2 bg-[#FF5200] hover:bg-[#EA580C] text-white shadow-md shadow-orange-500/25 cursor-pointer"
              icon={ArrowRight}
              iconPosition="right"
            >
              Continue
            </Button>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Device-Bound Permanent Security</span>
            </div>
          </form>
        )}

        {/* STEP 2: 6-DIGIT OTP VERIFICATION WITH CODE DISPLAY */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in">
            {generatedOtp && (
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider leading-none">
                      Your Verification Code
                    </span>
                    <span className="text-sm font-black text-slate-900 dark:text-white tracking-widest font-mono">
                      {generatedOtp}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => applyOtp(generatedOtp)}
                  className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-xs transition-all cursor-pointer shrink-0"
                >
                  Auto-Fill
                </button>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#FF5200]" />
                  <span>6-Digit Verification Code</span> <span className="text-rose-500">*</span>
                </label>
                {generatedOtp && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
                    Active: {generatedOtp}
                  </span>
                )}
              </div>

              {/* 6 Digit Input Boxes */}
              <div className="grid grid-cols-6 gap-2">
                {otpDigits.map((digit, idx) => {
                  const isFocused = focusedOtpIdx === idx
                  return (
                    <div
                      key={idx}
                      onClick={() => otpInputsRef[idx].current?.focus()}
                      className={`relative w-full h-11 rounded-xl flex items-center justify-center transition-all cursor-text ${
                        isFocused
                          ? 'bg-white dark:bg-slate-900 border-2 border-[#FF5200] ring-4 ring-orange-500/20 shadow-xs'
                          : digit
                          ? 'bg-orange-50/60 dark:bg-slate-800 border border-orange-200 dark:border-orange-900/60 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <input
                        ref={otpInputsRef[idx]}
                        type="tel"
                        maxLength={1}
                        inputMode="numeric"
                        value={digit}
                        onFocus={() => setFocusedOtpIdx(idx)}
                        onBlur={() => setFocusedOtpIdx(null)}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        onPaste={idx === 0 ? handleOtpPaste : undefined}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-text"
                      />

                      {digit ? (
                        <span className="text-base font-black text-[#FF5200] pointer-events-none">
                          {digit}
                        </span>
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

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => {
                  setStep('mobile')
                  setError('')
                }}
                className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold cursor-pointer"
              >
                Change Number
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className="text-[#FF5200] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>New Code</span>
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full font-bold h-11 bg-[#FF5200] hover:bg-[#EA580C] text-white shadow-md shadow-orange-500/25 cursor-pointer"
              icon={CheckCircle2}
            >
              Verify & Sign In
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}

export default LoginPage
