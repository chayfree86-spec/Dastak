import React from 'react'
import { Star, Quote, CheckCircle2 } from 'lucide-react'

export const Testimonials = () => {
  const reviews = [
    {
      name: 'Priya Sharma',
      role: 'Regular Customer, Lucknow',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      rating: 5,
      comment: 'Dastak is genuinely the fastest food delivery app I have ever used. My biryani arrived piping hot in just 16 minutes with tamper-proof packaging!',
    },
    {
      name: 'Amitabh Verma',
      role: 'Owner, Bawarchi Restaurant',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      rating: 5,
      comment: 'Our daily online orders jumped 4x after joining Dastak Partner. Weekly settlements are 100% on time without hidden platform deduction cuts.',
    },
    {
      name: 'Rahul K. Yadav',
      role: 'Fleet Rider Captain',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      rating: 5,
      comment: 'I earn over ₹28,000 monthly with complete flexibility of my college schedule. Milestone bonus and insurance give my family true peace of mind.',
    },
  ]

  return (
    <section className="py-20 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-black uppercase tracking-wider text-[#FF5200]">
            Trusted Community
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#113BD0] dark:text-white tracking-tight">
            Loved By <span className="text-gradient-brand">Thousands of Foodies</span>
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
            Hear directly from our customers, restaurant partners, and delivery heroes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((r, idx) => (
            <div
              key={idx}
              className="p-6 sm:p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col justify-between space-y-6 relative"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-1">
                  {[...Array(r.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                  ))}
                </div>

                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed italic">
                  "{r.comment}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-200/80 dark:border-slate-700">
                <img
                  src={r.avatar}
                  alt={r.name}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-[#FF5200]/30"
                />
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
