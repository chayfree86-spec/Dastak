import React from 'react'
import { Search, ChefHat, Bike, HeartHandshake, CheckCircle2 } from 'lucide-react'

export const HowItWorks = () => {
  const steps = [
    {
      number: '01',
      title: 'Select Your Favorite Dish',
      description: 'Explore verified restaurants, curated menus, discounts and customer ratings in your locality.',
      icon: Search,
      color: 'bg-orange-100 dark:bg-orange-950/60 text-[#FF5200]',
      border: 'border-orange-200 dark:border-orange-900/60',
    },
    {
      number: '02',
      title: 'Kitchen Prepares with Love',
      description: 'The merchant receives instant KOT alert and freshly cooks your food following strict FSSAI hygiene.',
      icon: ChefHat,
      color: 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-900/60',
    },
    {
      number: '03',
      title: 'Lightning Fast Delivery',
      description: 'Our nearest fleet hero picks up the temperature-controlled package and rushes to your location.',
      icon: Bike,
      color: 'bg-blue-100 dark:bg-blue-950/60 text-[#113BD0] dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-900/60',
    },
    {
      number: '04',
      title: 'Enjoy Hot & Delicious Meal',
      description: 'Receive your sealed meal at your doorstep, verify with simple PIN or enjoy contactless drop-off.',
      icon: HeartHandshake,
      color: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-900/60',
    },
  ]

  return (
    <section id="how-it-works" className="py-20 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-black uppercase tracking-wider text-[#113BD0] dark:text-blue-400">
            Simple &amp; Seamless Experience
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#113BD0] dark:text-white tracking-tight">
            How <span className="text-gradient-brand">Dastak</span> Delivers In 20 Mins
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium">
            From your phone screen to your dinner table in 4 effortless, transparent steps.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, idx) => {
            const Icon = step.icon
            return (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-xl hover:border-[#FF5200]/50 transition-all duration-300 flex flex-col justify-between space-y-6 relative group"
              >
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-2xl ${step.color} flex items-center justify-center font-black shadow-xs`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-2xl font-black text-slate-300 dark:text-slate-600 group-hover:text-[#FF5200] transition-colors">
                    {step.number}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {step.title}
                  </h3>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
