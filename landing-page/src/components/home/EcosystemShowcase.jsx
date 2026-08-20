import React from 'react'
import {
  ShoppingBag,
  Store,
  Bike,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Coins,
  Layers,
} from 'lucide-react'
import { APP_URLS } from '../../config/appUrls'

export const EcosystemShowcase = () => {
  return (
    <section id="ecosystem" className="py-24 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#FF5200]">
            <Layers className="w-4 h-4" />
            <span>Built For Everyone</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#113BD0] dark:text-white tracking-tight">
            The Complete <span className="text-gradient-brand">Dastak Ecosystem</span>
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-300 font-medium">
            Whether you want to order food, grow your restaurant business, or earn on your own terms with deliveries — Dastak connects you seamlessly.
          </p>
        </div>

        {/* 3 Interactive Pillar Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 1. Customer Card */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl flex flex-col justify-between space-y-8 relative overflow-hidden group hover:border-[#FF5200]/50 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl -z-0 pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-[#FF5200]/10 text-[#FF5200] flex items-center justify-center shadow-xs">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black text-[#113BD0] dark:text-white">
                For Foodies &amp; Shoppers
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                Enjoy hot, hygienic meals delivered to your doorstep in 20 minutes with live GPS tracking and zero extra markup.
              </p>

              <ul className="space-y-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 pt-2">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Real-time GPS Live Tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Exclusive Daily Deals &amp; BOGO Offers</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>UPI, Cards &amp; Cash On Delivery</span>
                </li>
              </ul>
            </div>

            <a
              href={APP_URLS.customerLogin}
              className="relative z-10 w-full py-3.5 rounded-2xl bg-[#FF5200] hover:bg-[#E04800] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-[#FF5200]/25 transition-all cursor-pointer group-hover:scale-102"
            >
              <span>Order Food Now</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* 2. Restaurant Partner Card */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl flex flex-col justify-between space-y-8 relative overflow-hidden group hover:border-[#113BD0]/50 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -z-0 pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#113BD0] dark:text-blue-400 flex items-center justify-center shadow-xs">
                <Store className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black text-[#113BD0] dark:text-white">
                For Restaurants &amp; Cafes
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                Grow your restaurant sales by 3x. Get a dedicated Kitchen Order Terminal (KOT) with automated weekly bank payouts.
              </p>

              <ul className="space-y-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 pt-2">
                <li className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#113BD0] dark:text-blue-400 shrink-0" />
                  <span>Lowest Platform Commission Rates</span>
                </li>
                <li className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#113BD0] dark:text-blue-400 shrink-0" />
                  <span>Instant Live Sound KOT Alerts</span>
                </li>
                <li className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#113BD0] dark:text-blue-400 shrink-0" />
                  <span>Transparent 100% Weekly Settlements</span>
                </li>
              </ul>
            </div>

            <div className="relative z-10 space-y-2">
              <a
                href={APP_URLS.partnerLogin}
                className="w-full py-3.5 rounded-2xl bg-[#113BD0] hover:bg-[#0E2FA8] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-[#113BD0]/25 transition-all cursor-pointer group-hover:scale-102"
              >
                <span>Partner Portal Login</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* 3. Rider Fleet Card */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl flex flex-col justify-between space-y-8 relative overflow-hidden group hover:border-emerald-500/50 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -z-0 pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                <Bike className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black text-[#113BD0] dark:text-white">
                For Delivery Heroes
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                Be your own boss. Drive with Dastak, earn per delivery with handsome milestone bonuses and daily instant cashout.
              </p>

              <ul className="space-y-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 pt-2">
                <li className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Earn up to ₹25,000 to ₹35,000/month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Flexible shifts — Part-time or Full-time</span>
                </li>
                <li className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Free Insurance &amp; Rider Safety Gear</span>
                </li>
              </ul>
            </div>

            <div className="relative z-10 space-y-2">
              <a
                href={APP_URLS.riderLogin}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 transition-all cursor-pointer group-hover:scale-102"
              >
                <span>Rider Portal Login</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default EcosystemShowcase
