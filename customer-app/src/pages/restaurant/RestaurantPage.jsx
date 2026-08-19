import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Star,
  Clock,
  MapPin,
  Search,
  ShoppingBag,
  ArrowLeft,
  Store,
  Leaf,
  ShieldCheck,
  Tag,
  Phone,
  Mic,
  X,
} from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { useCart } from '../../context/CartContext'
import restaurantApi from '../../api/restaurant.api'
import ProductCard from '../../components/common/ProductCard'
import LoadingSkeleton from '../../components/common/LoadingSkeleton'
import EmptyState from '../../components/common/EmptyState'
import VoiceSearchModal from '../../components/common/VoiceSearchModal'
import { formatCurrency } from '../../utils/formatters'
import { makePhoneCall } from '../../utils/geo'
import { realtimeBus } from '../../utils/realtimeSync'

const getRestaurantBanner = (restaurant) => {
  if (restaurant?.banner && !restaurant.banner.includes('placeholder')) {
    return restaurant.banner
  }
  const name = (restaurant?.name || '').toLowerCase()
  if (name.includes('biryani')) {
    return 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=1000&auto=format&fit=crop&q=85'
  }
  if (name.includes('chai') || name.includes('chaupal') || name.includes('tea')) {
    return 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=1000&auto=format&fit=crop&q=85'
  }
  if (name.includes('burger') || name.includes('fast food')) {
    return 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1000&auto=format&fit=crop&q=85'
  }
  return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000&auto=format&fit=crop&q=85'
}

export const RestaurantPage = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { t, lang } = useLanguage()
  const { itemCount, grandTotal } = useCart()

  const [restaurant, setRestaurant] = useState(null)
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [vegOnly, setVegOnly] = useState(false)
  const [menuSearch, setMenuSearch] = useState('')
  const [voiceModalOpen, setVoiceModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadRestaurant = async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    try {
      const res = await restaurantApi.getRestaurant(slug)
      const restData = res?.data?.data || res?.data || res || {}
      setRestaurant(restData)

      const menuRes = await restaurantApi.getMenu(slug)
      const rawMenu = menuRes?.data?.data || menuRes?.data || menuRes?.categories || menuRes || []
      const categoriesList = Array.isArray(rawMenu) ? rawMenu : (rawMenu.categories || [])
      setCategories(categoriesList)
    } catch (e) {
      console.warn('Failed to load restaurant:', e)
    } finally {
      if (!isSilent) setLoading(false)
    }
  }

  useEffect(() => {
    loadRestaurant(false)

    // Realtime sync on menu / item updates
    const unsubscribe = realtimeBus.subscribe(() => {
      loadRestaurant(true)
    })

    const handleFocus = () => loadRestaurant(true)
    window.addEventListener('focus', handleFocus)

    return () => {
      unsubscribe()
      window.removeEventListener('focus', handleFocus)
    }
  }, [slug])

  if (loading) {
    return <LoadingSkeleton count={4} />
  }

  if (!restaurant || !restaurant.id) {
    return (
      <EmptyState
        icon={Store}
        title={lang === 'hi' ? 'रेस्टोरेंट नहीं मिला' : 'Restaurant Not Found'}
        description={lang === 'hi' ? 'यह किचन आउटलेट अस्थायी रूप से बंद हो सकता है।' : 'This kitchen outlet might be temporarily closed.'}
        actionLabel={lang === 'hi' ? 'अन्य रेस्टोरेंट देखें' : 'Browse Restaurants'}
        onAction={() => navigate('/')}
      />
    )
  }

  const allItems = Array.isArray(categories)
    ? categories.flatMap((c) => {
        const items = c.items || c.menu_items || c.products || []
        if (Array.isArray(items) && items.length > 0) {
          return items.map((it) => ({
            ...it,
            category_name: c.name || it.category_name || 'Menu',
            restaurant: restaurant,
          }))
        }
        if (c.name && (c.base_price !== undefined || c.price !== undefined)) {
          return [
            {
              ...c,
              category_name: c.category_name || c.category?.name || 'Menu',
              restaurant: restaurant,
            },
          ]
        }
        return []
      })
    : []

  const filteredItems = allItems.filter((item) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      item.category_name === selectedCategory ||
      String(item.category_id) === String(selectedCategory)
    const matchesVeg =
      !vegOnly ||
      item.food_type === 'VEG' ||
      item.food_type === 'pure_veg' ||
      item.is_veg === true
    const matchesSearch =
      !menuSearch.trim() ||
      (item.name || '').toLowerCase().includes(menuSearch.toLowerCase().trim())
    return matchesCategory && matchesVeg && matchesSearch
  })

  const bannerUrl = getRestaurantBanner(restaurant)

  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto pb-28">
      {/* 1. Restaurant Hero Header Banner (Mobile-Optimized) */}
      <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="relative h-44 sm:h-60 w-full overflow-hidden">
          <img
            src={bannerUrl}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent" />

          {/* Floating Top Controls: Frosted Glass Back Button & Badges */}
          <div className="absolute top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 flex items-center justify-between gap-2 z-10">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <span
                className={`px-3 py-1 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider backdrop-blur-md shadow-md ${
                  restaurant.is_open !== false
                    ? 'bg-emerald-600/90 text-white'
                    : 'bg-rose-600/90 text-white'
                }`}
              >
                {restaurant.is_open !== false ? t.openNow : t.closedNow}
              </span>

              {restaurant.is_pure_veg && (
                <span className="px-3 py-1 rounded-xl bg-emerald-600 text-white text-[10px] sm:text-xs font-black uppercase shadow-md flex items-center gap-1 backdrop-blur-md">
                  <Leaf className="w-3 h-3" />
                  <span>{t.vegOnly}</span>
                </span>
              )}
            </div>
          </div>

          {/* Restaurant Title & Info inside Banner */}
          <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 text-white space-y-1">
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight drop-shadow-md">
              {restaurant.name}
            </h2>
            <p className="text-xs sm:text-sm text-white/90 font-medium flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-[#FF5200] shrink-0" />
              <span className="truncate">{restaurant.address_line1 || 'Civil Lines, Kanpur'}</span>
            </p>
          </div>
        </div>

        {/* Quick Meta Stats Strip (Rating, Delivery Time, Safety & Call) */}
        <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3 text-xs font-bold border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Rating */}
            <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
              <div className="bg-amber-500/15 p-1.5 rounded-xl">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              </div>
              <div>
                <span className="block font-black text-xs sm:text-sm text-slate-900 dark:text-slate-100 leading-tight">
                  {(Number(restaurant.rating) || 4.8).toFixed(1)}
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase leading-tight block">
                  {lang === 'hi' ? 'रेटिंग' : 'Rating'}
                </span>
              </div>
            </div>

            {/* Delivery Time */}
            <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
              <div className="bg-orange-500/15 p-1.5 rounded-xl">
                <Clock className="w-4 h-4 text-[#FF5200] dark:text-orange-400" />
              </div>
              <div>
                <span className="block font-black text-xs sm:text-sm text-slate-900 dark:text-slate-100 leading-tight">
                  {restaurant.preparation_time_minutes || 25} {lang === 'hi' ? 'मिनट' : 'Mins'}
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase leading-tight block">
                  {lang === 'hi' ? 'डिलीवरी' : 'Delivery'}
                </span>
              </div>
            </div>

            {/* Safety / FSSAI */}
            <div className="hidden xs:flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
              <div className="bg-emerald-500/15 p-1.5 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <span className="block font-black text-xs sm:text-sm text-slate-900 dark:text-slate-100 leading-tight">
                  {t.fssaiVerified || (lang === 'hi' ? 'FSSAI' : 'FSSAI')}
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase leading-tight block">
                  {t.safetyCertified || (lang === 'hi' ? 'प्रमाणित' : 'Certified')}
                </span>
              </div>
            </div>
          </div>

          {restaurant.phone && (
            <button
              type="button"
              onClick={() => makePhoneCall(restaurant.phone)}
              className="px-3.5 py-1.5 sm:py-2 rounded-xl bg-orange-50 dark:bg-slate-800 hover:bg-orange-100 dark:hover:bg-slate-700 text-[#FF5200] dark:text-orange-400 font-black text-xs flex items-center gap-1.5 cursor-pointer border border-orange-200/80 dark:border-slate-700 transition-colors shadow-xs ml-auto"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{t.callKitchen || (lang === 'hi' ? 'कॉल करें' : 'Call')}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Combined Sticky Filter & Category Bar (Permanently Pinned Beneath Header on Scroll) */}
      <div className="sticky top-14 sm:top-16 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md pt-2 pb-2.5 space-y-2.5 border-b border-slate-200/80 dark:border-slate-800/80 -mx-3 sm:-mx-6 px-3 sm:px-6 shadow-sm">
        {/* Full-Width Search Input Row with Perfectly Centered Voice Mic */}
        <div className="relative w-full flex items-center">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FF5200] dark:text-orange-400 pointer-events-none" />
          <input
            type="text"
            value={menuSearch}
            onChange={(e) => setMenuSearch(e.target.value)}
            placeholder={t.searchInMenu || 'Search dish in menu...'}
            className="w-full pl-9 sm:pl-10 pr-20 py-2.5 sm:py-3 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-800 text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#FF5200] focus:ring-2 focus:ring-[#FF5200]/20 shadow-xs transition-all"
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {menuSearch && (
              <button
                type="button"
                onClick={() => setMenuSearch('')}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Clear"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setVoiceModalOpen(true)}
              className="w-8 h-8 rounded-xl bg-orange-50 hover:bg-orange-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#FF5200] dark:text-orange-400 flex items-center justify-center transition-all cursor-pointer border border-orange-200/70 dark:border-slate-700 active:scale-95 shadow-2xs"
              title="Voice Search"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Pills Bar (Ergonomic Touch Height: min 40px - 44px) */}
        <div className="flex items-center gap-2 overflow-x-auto py-0.5 px-0.5 scrollbar-none no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2.5 min-h-[40px] sm:min-h-[44px] rounded-2xl text-xs sm:text-sm font-black transition-all shrink-0 cursor-pointer shadow-sm active:scale-95 flex items-center justify-center select-none ${
              selectedCategory === 'all'
                ? 'bg-[#FF5200] text-white shadow-md shadow-orange-500/30'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-2 border-slate-200/90 dark:border-slate-800 hover:border-[#FF5200]'
            }`}
          >
            {t.allMenuCount || (lang === 'hi' ? 'सभी आइटम' : 'All Items')} ({allItems.length})
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-4 py-2.5 min-h-[40px] sm:min-h-[44px] rounded-2xl text-xs sm:text-sm font-black transition-all shrink-0 cursor-pointer shadow-sm active:scale-95 flex items-center justify-center select-none ${
                selectedCategory === cat.name
                  ? 'bg-[#FF5200] text-white shadow-md shadow-orange-500/30'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-2 border-slate-200/90 dark:border-slate-800 hover:border-[#FF5200]'
              }`}
            >
              {cat.name} ({cat.items?.length || cat.menu_items?.length || 0})
            </button>
          ))}
        </div>
      </div>

      {/* 4. Food Menu Items List (Prominent High-Resolution Photography) */}
      <div className="space-y-3 pt-1">
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {filteredItems.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                customRestaurant={restaurant}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-400 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            {lang === 'hi'
              ? 'आपकी खोज और फ़िल्टर के अनुसार कोई व्यंजन उपलब्ध नहीं है।'
              : 'No dishes matching your search and filter criteria.'}
          </div>
        )}
      </div>

      {/* 5. Sticky Floating Bottom Cart Bar */}
      {itemCount > 0 && (
        <div className="fixed bottom-16 sm:bottom-20 inset-x-3 sm:inset-x-6 max-w-lg mx-auto z-40 animate-in slide-in-from-bottom-3 duration-300">
          <div
            onClick={() => navigate('/cart')}
            className="p-3.5 sm:p-4 rounded-3xl bg-gradient-to-r from-[#FF5200] to-[#EA580C] text-white shadow-2xl shadow-orange-500/40 flex items-center justify-between gap-3 cursor-pointer hover:opacity-95 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-black shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-white/90 block leading-tight">
                  {itemCount} {itemCount === 1 ? 'ITEM' : 'ITEMS'} ADDED
                </span>
                <div className="text-sm sm:text-base font-black leading-tight">
                  {formatCurrency(grandTotal)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 font-black text-xs bg-white text-slate-900 px-4 py-2 rounded-2xl shadow-md shrink-0">
              <span>{t.viewCart || (lang === 'hi' ? 'कार्ट देखें' : 'View Cart')}</span>
              <span>→</span>
            </div>
          </div>
        </div>
      )}

      {/* Voice Search Modal */}
      <VoiceSearchModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onSearch={(voiceQuery) => {
          setMenuSearch(voiceQuery)
        }}
      />
    </div>
  )
}

export default RestaurantPage
