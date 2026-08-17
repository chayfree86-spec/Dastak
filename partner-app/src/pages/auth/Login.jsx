import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Store, Lock, Phone, Mail, ArrowRight, ShieldCheck } from 'lucide-react'
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!identifier.trim()) {
      setError('Please enter your registered mobile number or email address.')
      return
    }
    if (!password.trim()) {
      setError('Please enter your account password or security PIN.')
      return
    }

    setLoading(true)
    try {
      await login(identifier.trim(), password.trim())
      toast.success('Welcome back!', 'Restaurant kitchen portal is now active.')
      // As per requirement: Default screen after login is NEW ORDERS
      navigate('/new-orders', { replace: true })
    } catch (err) {
      setError(err.message || 'Invalid credentials or account suspended.')
      toast.error('Login Failed', err.message || 'Invalid credentials.')
    } finally {
      setLoading(false)
    }
  }

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
              Enter your registered credentials to manage orders and kitchen queue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Registered Mobile or Email"
              placeholder="e.g. 9876543210 or chef@restaurant.com"
              icon={Phone}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />

            <Input
              label="Password or 4-6 Digit Security PIN"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold leading-relaxed">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              icon={ArrowRight}
              className="w-full text-sm font-black shadow-lg shadow-blue-500/25 mt-2"
            >
              Access Kitchen Queue
            </Button>
          </form>
        </div>

        {/* Footer Support Notice */}
        <div className="text-center space-y-1 text-xs text-slate-400">
          <p className="flex items-center justify-center gap-1.5 font-bold text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Secure Real-Time Platform Connection</span>
          </p>
          <p className="text-[11px]">Forgot password or need kitchen staff access? Contact Dastak Support.</p>
        </div>
      </div>
    </div>
  )
}

export default Login
