import React, { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import authApi from '../../api/auth.api'
import { useKeyboardNav } from '../../hooks/useKeyboardNav'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'

export const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const formRef = useRef(null)

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    setErrorMsg('')

    if (!email.trim()) {
      setErrorMsg('Please enter your registered email address.')
      return
    }

    setLoading(true)
    try {
      await authApi.forgotPassword({ email: email.trim() })
      setSubmitted(true)
    } catch (err) {
      setErrorMsg(err.message || 'Failed to process password reset request.')
    } finally {
      setLoading(false)
    }
  }

  useKeyboardNav(formRef, { autoFocusFirst: true, onSubmit: handleSubmit })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B132B] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white dark:bg-slate-800 py-8 px-6 sm:px-8 shadow-xl border border-slate-200 dark:border-slate-700 rounded-3xl">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Login</span>
          </Link>

          {submitted ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Check Your Email</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                We have dispatched a password reset link to <strong className="text-slate-900 dark:text-slate-100">{email}</strong>.
              </p>
              <Link to="/login">
                <Button variant="primary" className="w-full">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight mb-1">
                Forgot Password
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                Enter your registered administrator email to receive a password reset link.
              </p>

              {errorMsg && (
                <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Registered Email"
                  icon={Mail}
                  type="email"
                  required
                  placeholder="admin@dastak.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full mt-2 font-bold">
                  Send Reset Link
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
