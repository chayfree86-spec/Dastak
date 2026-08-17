import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Mic,
  Sparkles,
  Flame,
  Store,
  ChevronRight,
  ChevronLeft,
  UtensilsCrossed,
  Coffee,
  Pizza,
  Sandwich,
  Cake,
  Leaf,
  Clock,
  Star,
  Tag,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import restaurantApi from '../../api/restaurant.api'
import searchApi from '../../api/search.api'
import customerApi from '../../api/customer.api'
import ProductCard from '../../components/common/ProductCard'
import RestaurantCard from '../../components/common/RestaurantCard'
import ActiveOrderBanner from '../../components/common/ActiveOrderBanner'
import VoiceSearchModal from '../../components/common/VoiceSearchModal'
import LoadingSkeleton from '../../components/common/LoadingSkeleton'

export const HomePage = () => {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { isAuthenticated } = useAuth()
  const categoriesRef = useRef(null)

  const [restaurants, setRestaurants] = useState([])
  const [popularDishes, setPopularDishes] = useState([])
  const [activeOrder, setActiveOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [voiceModalOpen, setVoiceModalOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all') // 'all' | 'rating' | 'veg' | 'fast'
  const [activeBannerIndex, setActiveBannerIndex] = useState(0)

  const scrollCategories = (offset) => {
    if (!categoriesRef.current) return
    const el = categoriesRef.current
    const start = el.scrollLeft
    const duration = 450
    const startTime = performance.now()

    // Smooth kinetic easing curve (out-quart fluid velocity)
    const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4)

    const animateScroll = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const ease = easeOutQuart(progress)
      el.scrollLeft = start + offset * ease

      if (progress < 1) {
        requestAnimationFrame(animateScroll)
      }
    }
    requestAnimationFrame(animateScroll)
  }

  // Curated Promo Banners with full English and Hindi translation support
  const promoBanners = [
    {
      id: 1,
      title: t.banner1Title || 'FLAT 50% OFF',
      subtitle: t.banner1Subtitle || 'On your first 3 food orders',
      code: 'WELCOME50',
      badge: t.banner1Badge || 'LIMITED OFFER',
      gradient: 'from-[#2845D6] via-indigo-600 to-blue-800',
      bgImage: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
      query: 'biryani',
    },
    {
      id: 2,
      title: t.banner2Title || 'CHAI & SNACKS FEST',
      subtitle: t.banner2Subtitle || 'Evening special with up to 40% OFF',
      code: 'CHAI40',
      badge: t.banner2Badge || 'POPULAR',
      gradient: 'from-amber-600 via-orange-600 to-rose-700',
      bgImage: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80',
      query: 'chai',
    },
    {
      id: 3,
      title: t.banner3Title || 'FREE EXPRESS DELIVERY',
      subtitle: t.banner3Subtitle || 'On orders above ₹199 from top rated kitchens',
      code: 'FASTFREE',
      badge: t.banner3Badge || 'LIGHTNING FAST',
      gradient: 'from-emerald-600 via-teal-700 to-slate-900',
      bgImage: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
      query: 'burger',
    },
  ]

  // Auto rotate banners
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % promoBanners.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [promoBanners.length])

  // Food Categories list with i18n
  const categories = [
    { id: 'all', name: t.catAllFood || 'All Food', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&auto=format&fit=crop&q=80', query: 'food' },
    { id: 'biryani', name: t.catBiryani || 'Biryani', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&auto=format&fit=crop&q=80', query: 'biryani' },
    { id: 'tea', name: t.catChai || 'Chai & Snacks', image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300&auto=format&fit=crop&q=80', query: 'chai' },
    { id: 'burger', name: t.catBurger || 'Burgers & Rolls', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&auto=format&fit=crop&q=80', query: 'burger' },
    { id: 'veg', name: t.catVeg || 'Pure Veg', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&auto=format&fit=crop&q=80', query: 'paneer' },
    { id: 'sweets', name: t.catSweets || 'Desserts & Sweets', image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&auto=format&fit=crop&q=80', query: 'jalebi' },
  ]

  useEffect(() => {
    const loadHomeData = async () => {
      setLoading(true)
      try {
        const restRes = await restaurantApi.getRestaurants({ per_page: 12 })
        setRestaurants(restRes.data?.data || restRes.data || [])

        const searchRes = await searchApi.search('food', null, 12)
        const dishes = searchRes.data?.dishes || []
        setPopularDishes(dishes)

        if (isAuthenticated) {
          try {
            const ordersRes = await customerApi.getOrders({ status: 'active' })
            const orders = ordersRes.data?.data || ordersRes.data || []
            const active = orders.find(
              (o) =>
                o.status !== 'DELIVERED' &&
                o.status !== 'CANCELLED' &&
                o.status !== 'REJECTED'
            )
            setActiveOrder(active || null)
          } catch (e) {}
        }
      } catch (e) {
        console.warn('Home data error:', e)
      } finally {
        setLoading(false)
      }
    }

    loadHomeData()
  }, [isAuthenticated])

  const handleVoiceSearch = (transcript) => {
    navigate(`/search?q=${encodeURIComponent(transcript)}`)
  }

  // Filtered dishes
  const filteredDishes = popularDishes.filter((dish) => {
    if (activeFilter === 'veg') return dish.food_type === 'VEG' || dish.food_type === 'pure_veg'
    if (activeFilter === 'rating') return (Number(dish.rating) || 4.5) >= 4.0
    return true
  })

  // Filtered restaurants
  const filteredRestaurants = restaurants.filter((rest) => {
    if (activeFilter === 'veg') return Boolean(rest.is_pure_veg)
    if (activeFilter === 'rating') return (Number(rest.rating) || 4.8) >= 4.5
    if (activeFilter === 'fast') return (rest.preparation_time_minutes || 30) <= 25
    return true
  })

  return (
    <div className="space-y-5 pb-8">
      {/* 1. Active Order Banner in Header Area */}
      {activeOrder && <ActiveOrderBanner order={activeOrder} />}

      {/* 2. Top Prominent Search Bar with Voice */}
      <div
        onClick={() => navigate('/search')}
        className="p-3 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-800 shadow-sm hover:border-[#2845D6] dark:hover:border-blue-500 transition-all flex items-center justify-between gap-3 cursor-pointer group"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1 ml-1">
          <Search className="w-4 h-4 text-[#2845D6] dark:text-blue-400 group-hover:scale-110 transition-transform shrink-0" />
          <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 truncate">
            {t.searchPlaceholder || 'What do you want to eat? Search biryani, chai...'}
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setVoiceModalOpen(true)
          }}
          className="p-2 rounded-xl bg-gradient-to-tr from-[#2845D6] to-[#F97316] text-white shadow-md hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0"
          title="Search with Voice"
        >
          <Mic className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3. Hero Promo Banner Carousel */}
      <div className="relative overflow-hidden rounded-3xl shadow-xl">
        <div
          className={`relative p-6 sm:p-8 bg-gradient-to-r ${promoBanners[activeBannerIndex].gradient} text-white flex flex-col justify-between min-h-[180px] sm:min-h-[220px] overflow-hidden transition-all duration-500`}
        >
          {/* Background Photo with soft overlay */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 sm:w-2/5 overflow-hidden opacity-30 sm:opacity-40 mix-blend-luminosity pointer-events-none">
            <img
              src={promoBanners[activeBannerIndex].bgImage}
              alt="Promo Food"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="relative z-10 space-y-2 max-w-lg">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{promoBanners[activeBannerIndex].badge}</span>
            </span>

            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight drop-shadow-sm">
              {promoBanners[activeBannerIndex].title}
            </h3>

            <p className="text-xs sm:text-sm text-white/90 font-medium">
              {promoBanners[activeBannerIndex].subtitle}
            </p>
          </div>

          {/* Banner Action CTA */}
          <div className="relative z-10 pt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() =>
                navigate(`/search?q=${encodeURIComponent(promoBanners[activeBannerIndex].query)}`)
              }
              className="px-4 py-2 rounded-2xl bg-white text-slate-900 font-black text-xs sm:text-sm shadow-lg hover:bg-slate-100 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>{t.orderNow || 'Order Now'}</span>
              <ArrowRight className="w-4 h-4 text-[#2845D6]" />
            </button>

            {/* Carousel Dots */}
            <div className="flex items-center gap-1.5">
              {promoBanners.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveBannerIndex(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    activeBannerIndex === idx ? 'w-6 bg-white' : 'w-2 bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Food Mood / Category Circular Strip */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-400 px-0.5">
          <span>{t.categories}</span>
        </div>

        {/* Categories Track with Left & Right Centered Arrows */}
        <div className="relative">
          {/* Left Arrow - Centered on Card Image */}
          <button
            type="button"
            onClick={() => scrollCategories(-240)}
            className="absolute -left-2 sm:-left-3.5 top-9 sm:top-11 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-[#2845D6] hover:text-white dark:hover:bg-blue-600 hover:border-transparent flex items-center justify-center transition-all shadow-md active:scale-90 cursor-pointer"
            title="Previous Categories"
          >
            <ChevronLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
          </button>

          {/* Horizontal category track with hidden scrollbars */}
          <div
            ref={categoriesRef}
            className="flex items-center gap-4 sm:gap-6 overflow-x-auto py-2 px-6 sm:px-8 -my-1 scrollbar-none no-scrollbar scroll-smooth"
          >
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => navigate(`/search?q=${encodeURIComponent(cat.query)}`)}
                className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group select-none text-center"
              >
                <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200/80 dark:border-slate-800 p-1.5 group-hover:border-[#2845D6] group-hover:scale-105 transition-all duration-300 shadow-xs group-hover:shadow-lg group-hover:shadow-blue-500/15 shrink-0">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover rounded-2xl"
                    loading="lazy"
                  />
                </div>
                <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 group-hover:text-[#2845D6] dark:group-hover:text-blue-400 transition-colors">
                  {cat.name}
                </span>
              </button>
            ))}
          </div>

          {/* Right Arrow - Centered on Card Image */}
          <button
            type="button"
            onClick={() => scrollCategories(240)}
            className="absolute -right-2 sm:-right-3.5 top-9 sm:top-11 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-[#2845D6] hover:text-white dark:hover:bg-blue-600 hover:border-transparent flex items-center justify-center transition-all shadow-md active:scale-90 cursor-pointer"
            title="Next Categories"
          >
            <ChevronRight className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* 5. Quick Filters Bar */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 px-0.5 -my-0.5 scrollbar-none text-xs font-black">
        {[
          { id: 'all', label: t.filterAll || 'All Items' },
          { id: 'rating', label: t.filterRating || '★ 4.0+ Rating' },
          { id: 'veg', label: t.filterVeg || '🌱 Pure Veg' },
          { id: 'fast', label: t.filterFast || '⚡ Under 30 Mins' },
        ].map((flt) => (
          <button
            key={flt.id}
            type="button"
            onClick={() => setActiveFilter(flt.id)}
            className={`px-3.5 py-1.5 rounded-2xl transition-all shrink-0 cursor-pointer ${
              activeFilter === flt.id
                ? 'bg-[#2845D6] text-white shadow-md shadow-blue-600/25'
                : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
            }`}
          >
            {flt.label}
          </button>
        ))}
      </div>

      {/* 6. Popular / Trending Dishes Grid */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#F97316]" />
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {t.popularNearYou}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => navigate('/search')}
            className="text-xs font-bold text-[#2845D6] dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            <span>{t.seeAll || 'See All'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <LoadingSkeleton count={4} />
        ) : filteredDishes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDishes.slice(0, 8).map((dish) => (
              <ProductCard
                key={dish.id}
                product={dish}
                onSelect={() => {
                  if (dish.restaurant?.slug) {
                    navigate(`/restaurant/${dish.restaurant.slug}`)
                  }
                }}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            No dishes matching this filter.
          </div>
        )}
      </div>

      {/* 7. Nearby Partner Kitchens & Restaurants */}
      <div className="space-y-3.5 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-[#2845D6]" />
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {t.restaurantsNearYou}
            </h3>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton count={2} />
        ) : filteredRestaurants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredRestaurants.map((rest) => (
              <RestaurantCard key={rest.id} restaurant={rest} />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            No restaurants found matching this filter.
          </div>
        )}
      </div>

      {/* Voice Search Modal */}
      <VoiceSearchModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onSearch={handleVoiceSearch}
        onTypeInstead={() => navigate('/search')}
      />
    </div>
  )
}

export default HomePage
