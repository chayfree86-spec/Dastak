import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Bike,
  Phone,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  Smartphone,
  KeyRound,
  CheckCircle2,
  RefreshCw,
  Navigation,
  MapPin,
  Compass,
  Zap,
  Gauge,
  Route as RouteIcon,
  Moon,
  Sun,
  Copy,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useTheme } from '../../context/ThemeContext'
import Button from '../../components/common/Button'

export const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { startVerification, resendOtp, verifyDeviceOtp, isAuthenticated } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const toast = useToast()

  const from = location.state?.from?.pathname || '/'

  // Steps: 'mobile' | 'otp' | 'active_elsewhere'
  const [step, setStep] = useState('mobile')
  const [mobile, setMobile] = useState('9777700001')
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [generatedOtp, setGeneratedOtp] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [activeDeviceInfo, setActiveDeviceInfo] = useState({ deviceName: '', instructions: '' })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [focusedOtpIdx, setFocusedOtpIdx] = useState(null)

  const otpInputsRef = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)]

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, from])

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

  // 1. Submit Mobile Number & Start Verification
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
      const data = res?.data || res

      if (data.session_active_elsewhere) {
        setActiveDeviceInfo({
          deviceName: data.active_device_name || 'Another Mobile Phone',
          instructions: data.instructions || 'Open Dastak Rider on your existing phone and go to Settings → Change Device.',
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
      const data = res?.data || res
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

  // 4. Verify OTP & Establish Permanent Rider Session
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
      toast.success('Welcome Back!', 'Rider shift authenticated with permanent device session.')
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Verification failed. Please check the code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full bg-[#F8FAFC] dark:bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 transition-colors duration-200 font-sans antialiased overflow-hidden selection:bg-[#2845D6] selection:text-white">
      {/* Theme Toggle Top Right */}
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

      {/* ======================================================== */}
      {/* 1. FLOATING BIKE & GPS MOTION ICONS (THEME RESPECTED) */}
      {/* ======================================================== */}
      <div className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden select-none z-0">
        {/* Soft Ambient Mesh */}
        <div className="absolute -top-24 -left-24 w-[450px] h-[450px] bg-blue-600/10 dark:bg-blue-600/15 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute -bottom-24 -right-24 w-[450px] h-[450px] bg-orange-500/10 dark:bg-orange-500/15 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '3s' }} />

        {/* 1. Rider Delivery Bike Bubble (Top Left) */}
        <div className="absolute top-12 left-6 sm:left-14 lg:left-24 p-3.5 rounded-2xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-blue-200/70 dark:border-blue-900/40 shadow-lg shadow-blue-500/10 text-[#2845D6] dark:text-blue-400 animate-float-slow">
          <Bike className="w-6 h-6" />
        </div>

        {/* 2. Turn-by-Turn GPS Navigator Bubble (Top Right) */}
        <div className="absolute top-16 right-6 sm:right-14 lg:right-28 p-3.5 rounded-2xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-emerald-200/70 dark:border-emerald-900/40 shadow-lg shadow-emerald-500/10 text-emerald-600 dark:text-emerald-400 animate-float-reverse">
          <Navigation className="w-6 h-6" />
        </div>

        {/* 3. Speedometer Bubble (Mid Left) */}
        <div className="absolute top-1/2 -translate-y-16 left-4 sm:left-10 lg:left-20 p-3.5 rounded-2xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-orange-200/70 dark:border-orange-900/40 shadow-lg shadow-orange-500/10 text-orange-600 dark:text-orange-400 animate-float-horizontal">
          <Gauge className="w-6 h-6" />
        </div>

        {/* 4. Drop Pin Bubble (Mid Right) */}
        <div className="absolute top-1/2 -translate-y-12 right-4 sm:right-10 lg:right-20 p-3.5 rounded-2xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-rose-200/70 dark:border-rose-900/40 shadow-lg shadow-rose-500/10 text-rose-500 animate-float-slow" style={{ animationDelay: '1.5s' }}>
          <MapPin className="w-6 h-6" />
        </div>

        {/* 5. Instant COD & Tips Bubble (Bottom Left) */}
        <div className="absolute bottom-14 left-6 sm:left-14 lg:left-24 p-3.5 rounded-2xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-amber-200/70 dark:border-amber-900/40 shadow-lg shadow-amber-500/10 text-amber-500 animate-float-horizontal">
          <Zap className="w-6 h-6" />
        </div>

        {/* 6. Compass Bubble (Bottom Right) */}
        <div className="absolute bottom-14 right-6 sm:right-14 lg:right-28 p-3.5 rounded-2xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-blue-200/70 dark:border-blue-900/40 shadow-lg shadow-blue-500/10 text-blue-600 dark:text-blue-400 animate-float-slow" style={{ animationDelay: '2.5s' }}>
          <Compass className="w-6 h-6" />
        </div>

        {/* 7. Route Flow Bubble (Top Center Left) */}
        <div className="absolute top-28 left-1/4 hidden lg:flex p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800 text-blue-600 dark:text-blue-400 shadow-md animate-float-reverse">
          <RouteIcon className="w-5 h-5" />
        </div>

        {/* 8. Fleet Shield Bubble (Bottom Center Right) */}
        <div className="absolute bottom-28 right-1/4 hidden lg:flex p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 shadow-md animate-float-slow" style={{ animationDelay: '3s' }}>
          <ShieldCheck className="w-5 h-5" />
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. AUTHENTICATION CARD (THEME RESPECTED) */}
      {/* ======================================================== */}
      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Brand Banner Card */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#2845D6] via-blue-600 to-[#F97316] text-white flex items-center justify-center mx-auto shadow-xl shadow-blue-600/25">
            <Bike className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              DASTAK <span className="text-[#2845D6] dark:text-blue-400">RIDER</span>
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
              Delivery Partner Fleet App &bull; Device-Bound Session
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-white dark:bg-slate-900 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl dark:shadow-2xl space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              {step === 'active_elsewhere'
                ? 'Active On Another Device'
                : step === 'otp'
                ? 'Verify Rider Number'
                : 'Rider Authentication'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {step === 'active_elsewhere'
                ? 'Single-phone policy is enforced for fleet security'
                : step === 'otp'
                ? `Enter 6-digit code for +91 ${mobile.replace(/\D/g, '')}`
                : 'Enter your registered 10-digit mobile number'}
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* CASE C: ACTIVE ON ANOTHER DEVICE NOTICE */}
          {/* ======================================================== */}
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

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                <p className="font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>How to switch to this phone:</span>
                </p>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <li>Open Dastak Rider on your active phone</li>
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
                className="w-full font-bold h-11 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                icon={ArrowLeft}
              >
                Back to Mobile Input
              </Button>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 1: MOBILE NUMBER INPUT */}
          {/* ======================================================== */}
          {step === 'mobile' && (
            <form onSubmit={handleStartVerification} className="space-y-4 animate-in fade-in">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Rider Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 flex items-center gap-1.5 text-slate-500 font-bold text-xs pointer-events-none">
                    <Phone className="w-4 h-4 text-[#2845D6] dark:text-blue-400" />
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    required
                    autoFocus
                    maxLength={10}
                    placeholder="9777700001"
                    value={mobile}
                    onChange={(e) => {
                      setMobile(e.target.value.replace(/\D/g, ''))
                      setError('')
                    }}
                    className="w-full h-11 pl-16 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2845D6]"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full font-bold h-11 bg-[#2845D6] hover:bg-blue-600 text-white shadow-lg shadow-blue-600/25 cursor-pointer"
                icon={ArrowRight}
                iconPosition="right"
              >
                Continue
              </Button>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Rider Fleet Single-Device Security</span>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* STEP 2: 6-DIGIT OTP VERIFICATION WITH CODE DISPLAY */}
          {/* ======================================================== */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in">
              {/* Visible Verification Code Banner for manual fill or tap */}
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
                    <KeyRound className="w-3.5 h-3.5 text-[#2845D6] dark:text-blue-400" />
                    <span>6-Digit Verification Code</span> <span className="text-rose-500">*</span>
                  </label>
                  {generatedOtp && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                      Active: {generatedOtp}
                    </span>
                  )}
                </div>

                {/* 6 Geometrically Centered Digit Boxes */}
                <div className="grid grid-cols-6 gap-2">
                  {otpDigits.map((digit, idx) => {
                    const isFocused = focusedOtpIdx === idx
                    return (
                      <div
                        key={idx}
                        onClick={() => otpInputsRef[idx].current?.focus()}
                        className={`relative w-full h-11 rounded-xl flex items-center justify-center transition-all cursor-text ${
                          isFocused
                            ? 'bg-white dark:bg-slate-800 border-2 border-[#2845D6] ring-4 ring-[#2845D6]/20 shadow-xs'
                            : digit
                            ? 'bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 shadow-xs'
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
                          <span className="text-base font-black text-[#2845D6] dark:text-blue-400 pointer-events-none">
                            {digit}
                          </span>
                        ) : isFocused ? (
                          <span className="w-0.5 h-4 bg-[#2845D6] animate-pulse pointer-events-none rounded-full" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 pointer-events-none" />
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
                  className="text-[#2845D6] dark:text-blue-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
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
                className="w-full font-bold h-11 bg-[#2845D6] hover:bg-blue-600 text-white shadow-lg shadow-blue-600/25 cursor-pointer"
                icon={CheckCircle2}
              >
                Verify & Start Shift
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default LoginPage
