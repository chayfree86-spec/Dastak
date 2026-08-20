import React, { useState, useEffect } from 'react'
import { Star, CheckCircle2 } from 'lucide-react'
import apiClient from '../../api/client'

export const Testimonials = () => {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get('/testimonials')
        setReviews(res.data?.data || res.data || [])
      } catch {
        setReviews([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // No real reviews yet → hide the whole section (no dummy testimonials).
  if (!loading && reviews.length === 0) return null

  return (
    <section className="py-20 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-black uppercase tracking-wider text-[#FF5200]">
            Trusted Community
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#113BD0] dark:text-white tracking-tight">
            Loved By <span className="text-gradient-brand">Our Foodies</span>
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
            Real reviews from verified Dastak customers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="p-6 sm:p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col justify-between space-y-6 relative"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-1">
                  {[...Array(Math.max(1, r.rating || 5))].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                  ))}
                </div>

                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed italic">
                  "{r.text}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-200/80 dark:border-slate-700">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#FF5200] to-[#113BD0] text-white flex items-center justify-center font-black text-lg ring-2 ring-[#FF5200]/30 shrink-0">
                  {(r.name || 'D').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1">
                    <span>{r.name}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {r.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Testimonials
