import React, { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useToast } from '../../context/ToastContext'
import { useKeyboardNav } from '../../hooks/useKeyboardNav'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'

export const Login = () => {
  const [emailOrMobile, setEmailOrMobile] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const { login } = useAuth()
  const { isDark } = useTheme()
  const toast = useToast()
  const navigate = useNavigate()
  const formRef = useRef(null)

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    setErrorMsg('')

    if (!emailOrMobile.trim() || !password.trim()) {
      setErrorMsg('Please enter your email/mobile and password.')
      return
    }

    setLoading(true)
    try {
      await login({
        login: emailOrMobile.trim(),
        password: password.trim(),
        remember_me: rememberMe,
      })
      toast.success('Welcome back', 'Successfully authenticated into Dastak Admin.')
      navigate('/dashboard')
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  useKeyboardNav(formRef, { autoFocusFirst: true, onSubmit: handleSubmit })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B132B] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <div className="flex justify-center mb-4">
          <img
            src={isDark ? '/logo-dark.png' : '/logo-light.png'}
            alt="Dastak"
            className="h-12 w-auto object-contain"
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Dastak Admin Portal
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
          “Jo Chahiye, Ghar Par” &bull; Operations & Management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white dark:bg-slate-800 py-8 px-6 sm:px-8 shadow-xl border border-slate-200 dark:border-slate-700 rounded-3xl">
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="flex-1 font-medium">{errorMsg}</span>
            </div>
          )}

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email or Mobile Number"
              icon={Mail}
              type="text"
              required
              placeholder="admin@dastak.in or 9876543210"
              value={emailOrMobile}
              onChange={(e) => setEmailOrMobile(e.target.value)}
            />

            <Input
              label="Password"
              icon={Lock}
              type="password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-600 text-[#2845D6] focus:ring-[#2845D6] w-4 h-4"
                />
                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Remember me</span>
              </label>

              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-[#2845D6] dark:text-blue-400 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-2 font-bold"
              icon={ArrowRight}
              iconPosition="right"
            >
              Sign In to Dashboard
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Secure Real-Data API Authentication</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
