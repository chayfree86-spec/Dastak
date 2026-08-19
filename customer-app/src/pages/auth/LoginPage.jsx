import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, Eye, EyeOff, LogIn, UserPlus, AlertCircle, ShieldCheck, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useToast } from '../../context/ToastContext'
import Button from '../../components/common/Button'

export const LoginPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'
  const { login, register } = useAuth()
  const { t } = useLanguage()
  const toast = useToast()

  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('9666600001')
  const [password, setPassword] = useState('password123')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e?.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'login') {
        await login(mobile.trim(), password)
        toast.success('Welcome to Dastak!', 'Signed in successfully.')
      } else {
        if (!name.trim()) {
          throw new Error('Please enter your full name.')
        }
        await register({
          name: name.trim(),
          mobile: mobile.trim(),
          password: password || 'password123',
        })
        toast.success('Account Created!', 'Welcome to Dastak food delivery.')
      }
      navigate(redirect)
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemoCustomer = () => {
    setMode('login')
    setMobile('9666600001')
    setPassword('password123')
    toast.info('Customer Demo Loaded', 'Priya Sharma (Customer: 9666600001)')
  }

  return (
    <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center py-6 space-y-6 my-auto">
      {/* Main Content Area */}
      <div className="space-y-5 my-auto">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center pb-1">
            <img
              src="/logo-horizontal.svg"
              alt="Dastak Logo"
              className="h-10 sm:h-12 max-h-12 w-auto object-contain"
              style={{ height: '48px', maxHeight: '48px', width: 'auto' }}
              onError={(e) => {
                e.target.onerror = null
                e.target.src = '/logo-horizontal.png'
              }}
            />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {mode === 'login' ? 'Customer Sign In' : 'Create Customer Account'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {mode === 'login'
              ? 'Sign in with your customer mobile number to order food'
              : 'Enter your details to register as a new customer'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center gap-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode('login')
              setError('')
            }}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-white dark:bg-slate-900 text-[#2845D6] dark:text-blue-400 shadow-xs font-black'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register')
              setError('')
            }}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'bg-white dark:bg-slate-900 text-[#2845D6] dark:text-blue-400 shadow-xs font-black'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>New Customer</span>
          </button>
        </div>

        {/* Form Card */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name for Registration */}
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  Full Name
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2845D6] transition-all"
                    required
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* Mobile Number with +91 Country Badge */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                {t.mobileNumber || 'Mobile Number'}
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 flex items-center gap-1 text-xs font-black text-slate-700 dark:text-slate-300 pointer-events-none select-none border-r border-slate-200 dark:border-slate-700 pr-2">
                  <span>🇮🇳</span>
                  <span>+91</span>
                </span>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder="10-digit mobile number"
                  className="w-full pl-20 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2845D6] transition-all"
                  required
                  maxLength={10}
                  autoFocus={mode === 'login'}
                />
              </div>
            </div>

            {/* Password with Show/Hide Toggle */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-11 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2845D6] transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-bold text-rose-600 dark:text-rose-400 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="xl"
              icon={mode === 'login' ? LogIn : UserPlus}
              loading={loading}
              className="w-full shadow-lg shadow-blue-600/25 text-sm font-black py-3.5 rounded-2xl"
            >
              {mode === 'login' ? 'Sign In as Customer' : 'Create Customer Account'}
            </Button>
          </form>

          {/* 1-Tap Demo Credentials Helper */}
          <div
            onClick={fillDemoCustomer}
            className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2 cursor-pointer hover:border-blue-500/40 transition-colors"
          >
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                Demo Customer Account
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                Priya Sharma • 9666600001
              </span>
            </div>
            <span className="text-[10px] font-black text-[#2845D6] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-1 rounded-lg shrink-0">
              Fill Demo
            </span>
          </div>
        </div>
      </div>

      {/* Footer: Security & Terms Footnote */}
      <div className="text-center space-y-1 text-[11px] text-slate-400 mt-auto pt-4 pb-2">
        <p className="flex items-center justify-center gap-1 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>100% Safe & Secure 256-Bit Encrypted</span>
        </p>
        <p className="text-[10px] text-slate-400/80">
          By continuing, you agree to Dastak Terms of Service & Privacy Policy.
        </p>
      </div>
    </div>
  )
}

export default LoginPage
