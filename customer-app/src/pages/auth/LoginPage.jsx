import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Phone, Lock, LogIn, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useToast } from '../../context/ToastContext'
import Button from '../../components/common/Button'

export const LoginPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'
  const { login } = useAuth()
  const { t } = useLanguage()
  const toast = useToast()

  const [mobile, setMobile] = useState('9666600001')
  const [password, setPassword] = useState('password123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e?.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(mobile, password)
      toast.success('Welcome to Dastak!', 'Signed in successfully.')
      navigate(redirect)
    } catch (err) {
      setError(err.message || 'Invalid mobile number or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto py-6 sm:py-12 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#2845D6] to-[#F97316] text-white flex items-center justify-center text-3xl font-black mx-auto shadow-xl shadow-blue-600/30">
          D
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Welcome to Dastak
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Sign in with your mobile number to order and track food
        </p>
      </div>

      {/* Login Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-5">
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
              {t.mobileNumber}
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-black text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2845D6]"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-black text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2845D6]"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="xl"
            icon={LogIn}
            loading={loading}
            className="w-full shadow-lg shadow-blue-600/25 text-sm font-black"
          >
            {t.login}
          </Button>
        </form>

        {/* Demo Credentials Box */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1">
          <div className="font-bold text-slate-700 dark:text-slate-300">
            Demo Customer Account:
          </div>
          <div className="font-mono text-[11px]">
            Mobile: <strong>9666600001</strong> | Pass: <strong>password123</strong>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
