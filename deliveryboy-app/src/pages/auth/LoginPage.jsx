import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Bike,
  Phone,
  Lock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'

export const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const toast = useToast()

  const [identifier, setIdentifier] = useState('9777700001')
  const [password, setPassword] = useState('password123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const from = location.state?.from?.pathname || '/'

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    if (!identifier.trim() || !password.trim()) {
      setError('Please provide your mobile number or email and password/PIN.')
      return
    }

    setLoading(true)
    try {
      await login(identifier.trim(), password.trim())
      toast.success('Welcome Back!', 'Logged into Dastak Rider Fleet.')
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials or contact fleet manager.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 transition-colors font-sans antialiased">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Banner Card */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#2845D6] to-[#F97316] text-white flex items-center justify-center mx-auto shadow-xl shadow-blue-600/25">
            <Bike className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              DASTAK <span className="text-[#2845D6] dark:text-blue-400">RIDER</span>
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
              Delivery Partner Fleet App & PWA
            </p>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="bg-white dark:bg-slate-850 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-700/60 pb-4">
            <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
              Partner Authentication
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter registered mobile number and password
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Mobile Number / Email"
              type="text"
              icon={Phone}
              placeholder="e.g. 9777700001"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />

            <Input
              label="Password / Security PIN"
              type="password"
              icon={Lock}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              icon={ArrowRight}
              iconPosition="right"
              loading={loading}
              className="w-full shadow-lg shadow-blue-600/20 text-sm font-black"
            >
              Sign In to Fleet
            </Button>
          </form>

          {/* Quick Demo Credentials pill for fast testing */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
            <span className="font-black text-slate-700 dark:text-slate-300 block">
              Fleet Test Credentials:
            </span>
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 font-mono">
              <span>Mobile: 9777700001</span>
              <span>Pass: password123</span>
            </div>
          </div>
        </div>

        {/* Security & System Info Footer */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Dastak Secure Delivery Ecosystem & PWA</span>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
