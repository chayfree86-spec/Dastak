import React, { useState, useEffect } from 'react'
import {
  ShoppingBag,
  ArrowRight,
  MapPin,
  Clock,
  ShieldCheck,
  Star,
  Search,
  Zap,
  Tag,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Percent,
} from 'lucide-react'
import { apiClient } from '../../api/client'
import { APP_URLS } from '../../config/appUrls'

const FOOD_BANNERS = [
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=1400&auto=format&fit=crop&q=85', // Complete Biryani Pot & Table
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1400&auto=format&fit=crop&q=85', // Full Gourmet Pizza
  'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1400&auto=format&fit=crop&q=85', // Royal Indian Thali
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1400&auto=format&fit=crop&q=85', // Burger & Fries Platter
]

const DEFAULT_OFFERS = [
  {
    id: 1,
    code: 'FIRST50',
    title: '50% OFF On First Order',
    description: 'Get 50% discount on your first food & grocery order up to ₹100',
    badge: 'NEW USER SPECIAL',
    badgeColor: 'bg-[#FF5200] text-white',
    image: FOOD_BANNERS[0],
    minOrder: 'Min. Order ₹199',
    tag: 'Trending Deal',
  },
  {
    id: 2,
    code: 'SUMMER50',
    title: 'FLAT ₹75 OFF Food Feast',
    description: 'Save flat ₹75 on hot curries, meals, pizzas and daily snacks',
    badge: 'WEEKEND SPECIAL',
    badgeColor: 'bg-[#113BD0] text-white',
    image: FOOD_BANNERS[1],
    minOrder: 'Min. Order ₹250',
    tag: 'Most Popular',
  },
  {
    id: 3,
    code: 'DASTAK100',
    title: 'FLAT ₹100 OFF Mega Meals',
    description: 'Enjoy ₹100 flat discount on family dining & party platters',
    badge: 'SUPER SAVER',
    badgeColor: 'bg-emerald-600 text-white',
    image: FOOD_BANNERS[2],
    minOrder: 'Min. Order ₹499',
    tag: 'Mega Savings',
  },
]

export const HeroSection = ({ onLocationSearch }) => {
  const [query, setQuery] = useState('')
  const [offers, setOffers] = useState(DEFAULT_OFFERS)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [copiedCode, setCopiedCode] = useState(null)
  const [isPaused, setIsPaused] = useState(false)

  // Fetch dynamic marketing coupons from API
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await apiClient.get('/coupons')
        const data = res.data?.data || res.data
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((c, idx) => ({
            id: c.id,
            code: c.code,
            title: c.title || (c.discount_type === 'PERCENTAGE' ? `${c.discount_value}% OFF Special` : `FLAT ₹${c.discount_value} OFF`),
            description: c.description || `Use coupon code ${c.code} and save instantly on your food order.`,
            badge: idx === 0 ? 'NEW USER SPECIAL' : idx === 1 ? 'WEEKEND SPECIAL' : 'SUPER SAVER',
            badgeColor: idx === 0 ? 'bg-[#FF5200] text-white' : idx === 1 ? 'bg-[#113BD0] text-white' : 'bg-emerald-600 text-white',
            image: FOOD_BANNERS[idx % FOOD_BANNERS.length],
            minOrder: `Min. Order ₹${c.min_order_value || c.min_order || 199}`,
            tag: idx === 0 ? 'Trending Deal' : 'Hot Offer',
          }))
          setOffers(mapped)
        }
      } catch {
        // Fallback to rich defaults
      }
    }
    fetchCoupons()
  }, [])

  // Auto-play slider
  useEffect(() => {
    if (isPaused || offers.length <= 1) return
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % offers.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [isPaused, offers.length])

  const handleSearch = (e) => {
    e.preventDefault()
    if (onLocationSearch && query.trim()) {
      onLocationSearch(query.trim())
    } else {
      window.location.href = `${APP_URLS.customer}?search=${encodeURIComponent(query)}`
    }
  }

  const handleCopyCode = (code, e) => {
    e.stopPropagation()
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2500)
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % offers.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + offers.length) % offers.length)
  }

  const activeOffer = offers[currentSlide] || DEFAULT_OFFERS[0]

  return (
    <section
      className="relative min-h-[620px] md:min-h-[680px] pt-32 pb-20 md:pt-36 md:pb-24 flex items-center overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 1. Full-Width Background Food Banner with Natural Auto-Fit Sizing */}
      <div className="absolute inset-0 z-0 bg-slate-950 overflow-hidden">
        {offers.map((offer, idx) => (
          <div
            key={offer.id || idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              currentSlide === idx ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Auto-Fit Image Container: Perfectly proportioned, zero over-zoom */}
            <div className="absolute right-0 top-0 bottom-0 w-full md:w-3/5 lg:w-1/2 h-full flex items-center justify-center md:justify-end overflow-hidden">
              <img
                src={offer.image}
                alt={offer.title}
                className="w-full h-full object-cover object-center brightness-105 transition-all duration-700"
              />
            </div>
          </div>
        ))}

        {/* 2. Smooth Left-to-Right Shadow: Crisp dark backdrop on left for text, completely clear on right for food */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 from-20% via-slate-950/90 via-45% md:via-50% to-transparent to-85% z-1" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/30 z-1 pointer-events-none" />
      </div>

      {/* 3. Hero Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-2xl lg:max-w-3xl space-y-6 text-left">
          {/* Top Pill & Deal Tag */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 text-xs sm:text-sm font-bold backdrop-blur-md shadow-md">
              <Zap className="w-4 h-4 fill-orange-400 text-orange-400" />
              <span>Superfast 20-Minute Delivery Across India</span>
            </div>

            <span className={`px-3 py-1 rounded-full ${activeOffer.badgeColor} text-[11px] font-black uppercase tracking-wider shadow-md`}>
              {activeOffer.badge}
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12] drop-shadow-xl">
            Delicious Food &amp; Essentials <br />
            <span className="text-gradient-brand">Delivered At Your Doorstep</span>
          </h1>

          {/* Sub-text */}
          <p className="text-base sm:text-lg text-slate-200 font-medium max-w-2xl leading-relaxed drop-shadow-md">
            Order hot meals from top-rated local restaurants, groceries, and daily delights with zero hidden charges and live GPS tracking.
          </p>

          {/* Dynamic Marketing Offer Glassmorphism Pill Bar */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-black/65 backdrop-blur-xl border border-white/20 shadow-2xl max-w-xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-xl bg-[#FF5200] text-white flex items-center justify-center font-black shrink-0 shadow-md">
                <Percent className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-amber-400 uppercase tracking-wide">
                    {activeOffer.title}
                  </span>
                  <span className="text-[10px] text-slate-300 font-semibold hidden sm:inline">
                    &bull; {activeOffer.minOrder}
                  </span>
                </div>
                <p className="text-xs font-mono font-black text-white tracking-wider mt-0.5">
                  CODE: <span className="text-[#FF5200] bg-white/10 px-1.5 py-0.5 rounded">{activeOffer.code}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={(e) => handleCopyCode(activeOffer.code, e)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md ${
                  copiedCode === activeOffer.code
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:scale-105'
                }`}
              >
                {copiedCode === activeOffer.code ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>COPIED!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>COPY CODE</span>
                  </>
                )}
              </button>

              <a
                href={`${APP_URLS.customerLogin}?coupon=${encodeURIComponent(activeOffer.code)}`}
                className="px-3.5 py-1.5 rounded-xl bg-[#FF5200] hover:bg-[#E04800] text-white text-xs font-black shadow-md flex items-center gap-1 hover:scale-105 transition-all"
              >
                <span>APPLY</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Interactive Search Bar */}
          <form
            onSubmit={handleSearch}
            className="max-w-xl p-2 sm:p-2.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl border border-white/30 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-2 sm:gap-3"
          >
            <div className="w-full flex items-center gap-2 px-3 py-1.5 flex-1">
              <MapPin className="w-5 h-5 text-[#FF5200] shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your delivery area or city..."
                className="w-full bg-transparent text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#FF5200] hover:bg-[#E04800] text-white text-sm font-black shadow-lg shadow-[#FF5200]/30 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 hover:scale-105 active:scale-95"
            >
              <Search className="w-4 h-4" />
              <span>Find Food</span>
            </button>
          </form>

          {/* Highlights & Slider Nav Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-1 text-xs sm:text-sm font-bold text-slate-200">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-orange-400" />
                <span>Avg 18 Mins Delivery</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>100% Contactless &amp; Safe</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>4.8/5 Star Rating</span>
              </div>
            </div>

            {/* Slider Navigation Dots & Arrows */}
            {offers.length > 1 && (
              <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                <button
                  type="button"
                  onClick={prevSlide}
                  className="p-1 hover:text-orange-400 text-white transition-colors cursor-pointer"
                  title="Previous Slide"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1.5 px-1">
                  {offers.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        currentSlide === idx ? 'w-5 bg-[#FF5200]' : 'w-1.5 bg-white/40 hover:bg-white/70'
                      }`}
                      title={`Slide ${idx + 1}`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={nextSlide}
                  className="p-1 hover:text-orange-400 text-white transition-colors cursor-pointer"
                  title="Next Slide"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
