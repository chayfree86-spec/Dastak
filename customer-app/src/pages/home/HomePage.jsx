import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Mic,
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
import { realtimeBus } from '../../utils/realtimeSync'
import dataCache from '../../utils/dataCache'

export const HomePage = () => {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { isAuthenticated } = useAuth()
  const categoriesRef = useRef(null)

  const [restaurants, setRestaurants] = useState(() => dataCache.get('home_restaurants') || [])
  const [popularDishes, setPopularDishes] = useState(() => dataCache.get('home_dishes') || [])
  const [categories, setCategories] = useState(() => dataCache.get('home_categories') || [])
  const [activeOrder, setActiveOrder] = useState(null)
  const [loading, setLoading] = useState(() => !dataCache.has('home_restaurants') && !dataCache.has('home_dishes'))
  const [voiceModalOpen, setVoiceModalOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all') // 'all' | 'rating' | 'veg' | 'fast'
  const [activeBannerIndex, setActiveBannerIndex] = useState(0)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [quickFilterTags, setQuickFilterTags] = useState(() => dataCache.get('home_suggestions') || [])
  const [selectedFilterTag, setSelectedFilterTag] = useState(null)
  const [tagLoading, setTagLoading] = useState(false)
  const [liveCoupons, setLiveCoupons] = useState(() => dataCache.get('home_coupons') || [])

  const checkScrollButtons = () => {
    const el = categoriesRef.current
    if (!el) return
    const hasOverflow = el.scrollWidth > el.clientWidth + 4
    setCanScrollLeft(hasOverflow && el.scrollLeft > 6)
    setCanScrollRight(hasOverflow && el.scrollLeft + el.clientWidth < el.scrollWidth - 6)
  }

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

      checkScrollButtons()

      if (progress < 1) {
        requestAnimationFrame(animateScroll)
      } else {
        checkScrollButtons()
      }
    }
    requestAnimationFrame(animateScroll)
  }

  useEffect(() => {
    checkScrollButtons()
    const el = categoriesRef.current
    if (!el) return

    el.addEventListener('scroll', checkScrollButtons, { passive: true })
    window.addEventListener('resize', checkScrollButtons)

    // Check again once fonts or images might have settled
    const timeout = setTimeout(checkScrollButtons, 300)

    return () => {
      el.removeEventListener('scroll', checkScrollButtons)
      window.removeEventListener('resize', checkScrollButtons)
      clearTimeout(timeout)
    }
  }, [categories])

  // Promo banners come only from live backend coupons — no hardcoded fallbacks.
  const promoBanners = liveCoupons.slice(0, 4).map((c, idx) => ({
    id: c.id || idx + 1,
    title: c.discount_type === 'PERCENTAGE' ? `FLAT ${c.discount_value}% OFF` : `FLAT ₹${c.discount_value} OFF`,
    subtitle: Number(c.min_order) > 0
      ? `Use code ${c.code} on orders above ₹${c.min_order}`
      : `Use code ${c.code}`,
    code: c.code,
    badge: 'LIVE PROMO',
    gradient: idx % 3 === 0
      ? 'from-[#113BD0] via-indigo-600 to-blue-800'
      : idx % 3 === 1
      ? 'from-amber-600 via-orange-600 to-rose-700'
      : 'from-emerald-600 via-teal-700 to-slate-900',
    bgImage: c.image_url || c.banner_image || c.image || null,
    query: 'food',
  }))

  // Auto rotate banners smoothly with longer delay (skip when there are none)
  useEffect(() => {
    if (promoBanners.length === 0) return
    const timer = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % promoBanners.length)
    }, 8000)
    return () => clearInterval(timer)
  }, [promoBanners.length])

  // Food categories are loaded from the backend (DB-driven) in loadHomeData().

  const loadHomeData = async (isSilent = false) => {
    if (!isSilent && !dataCache.has('home_restaurants') && !dataCache.has('home_dishes')) {
      setLoading(true)
    }
    try {
      const restRes = await restaurantApi.getRestaurants({ per_page: 12 })
      const restData = restRes.data?.data || restRes.data || []
      setRestaurants(restData)
      dataCache.set('home_restaurants', restData)

      const searchRes = await searchApi.search('food', null, 12)
      const dishes = searchRes.data?.dishes || []
      setPopularDishes(dishes)
      dataCache.set('home_dishes', dishes)

      try {
        const catRes = await customerApi.getFoodCategories()
        const cats = catRes?.data || catRes || []
        setCategories(cats)
        dataCache.set('home_categories', cats)
        dataCache.preloadImages(cats.map(c => c.image))
      } catch (e) {}

      try {
        const suggRes = await searchApi.getSuggestions('')
        const tags = suggRes?.data || suggRes || []
        if (Array.isArray(tags) && tags.length > 0) {
          setQuickFilterTags(tags)
          dataCache.set('home_suggestions', tags)
        }
      } catch (e) {}

      try {
        const couponRes = await customerApi.getCoupons()
        const coupons = (couponRes.data?.data || couponRes.data || []).filter(c => c.is_active !== false)
        setLiveCoupons(coupons)
        dataCache.set('home_coupons', coupons)
        dataCache.preloadImages(coupons.map(c => c.image_url || c.banner_image || c.image))
      } catch (e) {}

      // Preload popular dish & restaurant banner images into browser cache
      dataCache.preloadImages([
        ...dishes.map(d => d.image),
        ...restData.map(r => r.banner || r.logo),
      ])

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

  // Interactive search tag filter handler connected to backend with 0ms cache
  const handleTagClick = async (tag) => {
    if (selectedFilterTag === tag) {
      setSelectedFilterTag(null)
      const cachedDefault = dataCache.get('home_dishes')
      if (cachedDefault) {
        setPopularDishes(cachedDefault)
      } else {
        setTagLoading(true)
        try {
          const res = await searchApi.search('food', null, 12)
          setPopularDishes(res.data?.dishes || [])
        } catch (e) {
          console.warn('Reset dishes error:', e)
        } finally {
          setTagLoading(false)
        }
      }
    } else {
      setSelectedFilterTag(tag)
      const cachedTag = dataCache.get(`home_tag_${tag}`)
      if (cachedTag) {
        setPopularDishes(cachedTag)
        const section = document.getElementById('popular-dishes-section')
        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      } else {
        setTagLoading(true)
        try {
          const res = await searchApi.search(tag, null, 12)
          const tagDishes = res.data?.dishes || []
          setPopularDishes(tagDishes)
          dataCache.set(`home_tag_${tag}`, tagDishes)
          dataCache.preloadImages(tagDishes.map(d => d.image))
          const section = document.getElementById('popular-dishes-section')
          if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        } catch (e) {
          console.warn('Tag filter search error:', e)
        } finally {
          setTagLoading(false)
        }
      }
    }
  }

  // Initial load + Realtime Sync subscription + Window Focus + Heartbeat Sync
  useEffect(() => {
    loadHomeData(false)

    // 1. Instant 0ms Cross-App Event Bus Subscription
    const unsubscribe = realtimeBus.subscribe((event) => {
      loadHomeData(true)
    })

    // 2. Tab Visibility / Focus revalidation
    const handleFocus = () => loadHomeData(true)
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        loadHomeData(true)
      }
    })

    // 3. 8-second Heartbeat Sync for multi-device cross-browser parity
    const heartbeat = setInterval(() => {
      loadHomeData(true)
    }, 8000)

    return () => {
      unsubscribe()
      window.removeEventListener('focus', handleFocus)
      clearInterval(heartbeat)
    }
  }, [isAuthenticated])

  const handleVoiceSearch = (transcript) => {
    navigate(`/search?q=${encodeURIComponent(transcript)}`)
  }

  // Filtered dishes
  const filteredDishes = popularDishes.filter((dish) => {
    if (activeFilter === 'veg') return dish.food_type === 'VEG' || dish.food_type === 'pure_veg'
    if (activeFilter === 'rating') return Number(dish.rating) >= 4.0
    return true
  })

  // Filtered restaurants
  const filteredRestaurants = restaurants.filter((rest) => {
    if (activeFilter === 'veg') return Boolean(rest.is_pure_veg)
    if (activeFilter === 'rating') return Number(rest.rating) >= 4.5
    if (activeFilter === 'fast') {
      const prep = Number(rest.preparation_time_minutes)
      return prep > 0 && prep <= 25
    }
    return true
  })

  return (
    <div className="space-y-5 pb-16">
      {/* Hidden Semantic H1 for 100% SEO and Accessibility */}
      <h1 className="sr-only">Dastak — Order Food, Grocery & Essentials in Minutes</h1>

      {/* 1. Active Order Banner in Header Area */}
      {activeOrder && <ActiveOrderBanner order={activeOrder} />}

      {/* 2. Hero Promo Banner Carousel — only shown when live coupons exist */}
      {promoBanners.length > 0 && (() => {
        const banner = promoBanners[activeBannerIndex] || promoBanners[0]
        return (
        <section className="relative overflow-hidden rounded-3xl shadow-xl h-[185px] sm:h-[225px] bg-slate-900" aria-label="Special Offers and Promotions">
        <div className={`relative flex flex-col justify-between h-full w-full overflow-hidden p-5 sm:p-8 ${!banner.bgImage ? `bg-gradient-to-br ${banner.gradient}` : ''}`}>
          {/* Full-width Natural Background Photo (only when the coupon provides one) */}
          {banner.bgImage && (
            <img
              src={banner.bgImage}
              alt={banner.title}
              width="800"
              height="225"
              decoding="async"
              fetchpriority="high"
              className="absolute inset-0 w-full h-full object-cover z-0 transition-all duration-700 scale-100 hover:scale-105"
            />
          )}

          {/* Smooth Left-to-Right Dark Scrim for 100% Crisp Text Readability without changing image colors */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-black/10 pointer-events-none z-1" />

          {/* Text & Content Protected by High Contrast Drop Shadows */}
          <div className="relative z-10 space-y-1.5 sm:space-y-2 max-w-[80%] sm:max-w-lg">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-xl bg-black/40 backdrop-blur-md border border-white/20 text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-300 shadow-sm">
              <Flame className="w-3 sm:w-3.5 h-3 sm:h-3.5 fill-amber-300 text-amber-300" />
              <span>{banner.badge}</span>
            </span>

            <h2 className="text-xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] truncate">
              {banner.title}
            </h2>

            <p className="text-xs sm:text-sm text-white/95 font-semibold line-clamp-1 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
              {banner.subtitle}
            </p>
          </div>

          {/* Banner Action CTA */}
          <div className="relative z-10 pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() =>
                navigate(`/search?q=${encodeURIComponent(banner.query)}`)
              }
              className="px-4 py-2 rounded-2xl bg-white text-slate-900 font-black text-xs sm:text-sm shadow-lg hover:bg-slate-100 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              aria-label={`Order now with promo: ${banner.title}`}
            >
              <span>{t.orderNow || 'Order Now'}</span>
              <ArrowRight className="w-4 h-4 text-[#113BD0]" />
            </button>

            {/* Carousel Dots */}
            <div className="flex items-center gap-1.5" role="tablist" aria-label="Promotion Carousel Navigation">
              {promoBanners.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveBannerIndex(idx)}
                  aria-label={`Go to promotion slide ${idx + 1}`}
                  aria-selected={activeBannerIndex === idx}
                  role="tab"
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    activeBannerIndex === idx ? 'w-6 bg-white' : 'w-2 bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
        </section>
        )
      })()}

      {/* 4. Food Mood / Category Circular Strip */}
      <section className="space-y-3" aria-label="Food Categories">
        <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 px-0.5">
          <span>{t.categories}</span>
        </div>

        {/* Categories Track with Left & Right Centered Arrows (Desktop Only) */}
        <div className="relative">
          {/* Left Arrow - Shown only when extra scrolled categories exist on left */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scrollCategories(-240)}
              className="hidden sm:flex absolute sm:-left-3.5 top-[48px] sm:top-[56px] -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-[#113BD0] hover:text-white dark:hover:bg-blue-600 hover:border-transparent items-center justify-center transition-all shadow-md active:scale-90 cursor-pointer animate-in fade-in"
              title="Previous Categories"
              aria-label="Scroll to previous categories"
            >
              <ChevronLeft className="w-4.5 h-4.5 stroke-[2.5]" />
            </button>
          )}

          {/* Horizontal category track with hidden scrollbars & native touch swipe on mobile */}
          <div
            ref={categoriesRef}
            className="flex items-center gap-3 sm:gap-5 overflow-x-auto py-2 px-1 sm:px-8 -my-1 scrollbar-none no-scrollbar scroll-smooth"
          >
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => navigate(`/search?q=${encodeURIComponent(cat.query)}`)}
                className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group select-none text-center w-20 sm:w-24"
                aria-label={`Explore ${cat.name} category`}
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 aspect-square rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200/80 dark:border-slate-800 p-1.5 group-hover:border-[#113BD0] group-hover:scale-105 transition-all duration-300 shadow-xs group-hover:shadow-lg group-hover:shadow-blue-500/15 shrink-0 overflow-hidden flex items-center justify-center">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    width="96"
                    height="96"
                    className="w-full h-full object-cover rounded-2xl aspect-square block shrink-0"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 group-hover:text-[#113BD0] dark:group-hover:text-blue-400 transition-colors line-clamp-1 w-full text-center">
                  {cat.name}
                </span>
              </button>
            ))}
          </div>

          {/* Right Arrow - Shown only when extra categories exist to scroll on right */}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => scrollCategories(240)}
              className="hidden sm:flex absolute sm:-right-3.5 top-[48px] sm:top-[56px] -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-[#113BD0] hover:text-white dark:hover:bg-blue-600 hover:border-transparent items-center justify-center transition-all shadow-md active:scale-90 cursor-pointer animate-in fade-in"
              title="Next Categories"
              aria-label="Scroll to next categories"
            >
              <ChevronRight className="w-4.5 h-4.5 stroke-[2.5]" />
            </button>
          )}
        </div>
      </section>

      {/* 5. Quick Filters Bar (Ergonomic Touch Height: min 40px - 44px) */}
      <section aria-label="Filter Dishes and Restaurants" className="flex items-center gap-2.5 overflow-x-auto py-1.5 px-0.5 -my-0.5 scrollbar-none no-scrollbar text-xs sm:text-sm font-black">
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
            aria-pressed={activeFilter === flt.id}
            className={`px-4 py-2.5 min-h-[40px] sm:min-h-[44px] rounded-2xl transition-all shrink-0 cursor-pointer shadow-sm active:scale-95 flex items-center justify-center select-none ${
              activeFilter === flt.id
                ? 'bg-[#FF5200] text-white shadow-md shadow-orange-500/30'
                : 'bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#FF5200]'
            }`}
          >
            {flt.label}
          </button>
        ))}
      </section>

      {/* 6. Popular / Trending Dishes Grid */}
      <section id="popular-dishes-section" className="space-y-3.5 scroll-mt-20" aria-label="Popular Dishes">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#F97316]" />
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {selectedFilterTag ? `Dishes for "${selectedFilterTag}"` : t.popularNearYou}
            </h2>
            {selectedFilterTag && (
              <button
                type="button"
                onClick={() => handleTagClick(selectedFilterTag)}
                className="px-2 py-0.5 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-[#FF5200] text-[10px] font-black hover:bg-orange-200 transition-colors cursor-pointer"
                title="Clear filter"
              >
                ✕ Clear
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => navigate(selectedFilterTag ? `/search?q=${encodeURIComponent(selectedFilterTag)}` : '/search')}
            className="text-xs font-bold text-[#113BD0] dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
            aria-label="See all popular dishes"
          >
            <span>{t.seeAll || 'See All'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading || tagLoading ? (
          <LoadingSkeleton count={4} type="card" />
        ) : filteredDishes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 min-h-[224px]">
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
          <div className="p-8 text-center text-xs text-slate-600 dark:text-slate-400 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            No dishes matching this filter.
          </div>
        )}
      </section>

      {/* 7. Nearby Partner Kitchens & Restaurants */}
      <section className="space-y-3.5 pt-2" aria-label="Nearby Restaurants">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-[#113BD0]" />
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {t.restaurantsNearYou}
            </h2>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton count={2} type="restaurant" />
        ) : filteredRestaurants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 min-h-[220px]">
            {filteredRestaurants.map((rest) => (
              <RestaurantCard key={rest.id} restaurant={rest} />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-600 dark:text-slate-400 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            No restaurants found matching this filter.
          </div>
        )}
      </section>

      {/* 8. Floating Sticky Search Bar + Popular Dishes Near Footer Navigation */}
      <aside aria-label="Quick Search" className="fixed bottom-16 sm:bottom-20 inset-x-3 sm:inset-x-6 max-w-lg mx-auto z-30 drop-shadow-2xl space-y-1.5">
        {/* Popular Dishes Quick Tags Horizontal Scroll (Backend Connected & Functional) */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-1 scrollbar-none no-scrollbar" aria-label="Quick Search Suggestions">
          {(quickFilterTags.length > 0 ? quickFilterTags : ['Chai', 'Samosa', 'Burger', 'Biryani', 'Pizza', 'Jalebi', 'Paneer Butter Masala']).map((dish) => {
            const isSelected = selectedFilterTag === dish
            return (
              <button
                key={dish}
                type="button"
                onClick={() => handleTagClick(dish)}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold shrink-0 transition-all active:scale-95 cursor-pointer select-none ${
                  isSelected
                    ? 'bg-[#FF5200] text-white shadow-lg shadow-orange-500/30 border border-[#FF5200] scale-105'
                    : 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-200 shadow-md hover:border-[#FF5200] dark:hover:border-orange-500'
                }`}
                aria-pressed={isSelected}
                aria-label={`Filter by ${dish}`}
              >
                {dish}
              </button>
            )
          })}
        </div>

        {/* Search Bar Input */}
        <div
          onClick={() => navigate(selectedFilterTag ? `/search?q=${encodeURIComponent(selectedFilterTag)}` : '/search')}
          className="p-2.5 sm:p-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-2 border-slate-200/90 dark:border-slate-800 shadow-2xl hover:border-[#FF5200] dark:hover:border-orange-500 transition-all flex items-center justify-between gap-3 cursor-pointer group"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              navigate(selectedFilterTag ? `/search?q=${encodeURIComponent(selectedFilterTag)}` : '/search')
            }
          }}
          aria-label="Click to search for restaurants, dishes or groceries"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1 ml-1.5">
            <Search className="w-4 h-4 text-[#FF5200] dark:text-orange-400 group-hover:scale-110 transition-transform shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 truncate">
              {selectedFilterTag ? `Searching "${selectedFilterTag}"... Click to customize` : (t.searchPlaceholder || 'What do you want to eat? Search biryani, chai...')}
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setVoiceModalOpen(true)
            }}
            className="p-2 rounded-xl bg-gradient-to-tr from-[#FF5200] to-amber-500 text-white shadow-md hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0"
            title="Search with Voice"
            aria-label="Voice Search"
          >
            <Mic className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

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
