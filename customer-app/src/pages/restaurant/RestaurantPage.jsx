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
  Sparkles,
  ShieldCheck,
  Tag,
  Phone,
} from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { useCart } from '../../context/CartContext'
import restaurantApi from '../../api/restaurant.api'
import ProductCard from '../../components/common/ProductCard'
import LoadingSkeleton from '../../components/common/LoadingSkeleton'
import EmptyState from '../../components/common/EmptyState'
import { formatCurrency } from '../../utils/formatters'
import { makePhoneCall } from '../../utils/geo'

const getRestaurantBanner = (restaurant) => {
  if (restaurant?.banner && !restaurant.banner.includes('placeholder')) {
    return restaurant.banner
  }
  const name = (restaurant?.name || '').toLowerCase()
  if (name.includes('biryani')) {
    return 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=1000&auto=format&fit=crop&q=80'
  }
  if (name.includes('chai') || name.includes('chaupal') || name.includes('tea')) {
    return 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=1000&auto=format&fit=crop&q=80'
  }
  if (name.includes('burger') || name.includes('fast food')) {
    return 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1000&auto=format&fit=crop&q=80'
  }
  return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000&auto=format&fit=crop&q=80'
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadRestaurant = async () => {
      setLoading(true)
      try {
        const res = await restaurantApi.getRestaurant(slug)
        setRestaurant(res.data || {})

        const menuRes = await restaurantApi.getMenu(slug)
        setCategories(menuRes.data?.categories || menuRes.data || [])
      } catch (e) {
        console.warn('Failed to load restaurant:', e)
      } finally {
        setLoading(false)
      }
    }

    loadRestaurant()
  }, [slug])

  if (loading) {
    return <LoadingSkeleton count={4} />
  }

  if (!restaurant) {
    return (
      <EmptyState
        icon={Store}
        title="Restaurant Not Found"
        description="This kitchen outlet might be temporarily closed."
        actionLabel="Browse Restaurants"
        onAction={() => navigate('/')}
      />
    )
  }

  const allItems = categories.flatMap((c) =>
    (c.items || c.menu_items || []).map((it) => ({
      ...it,
      category_name: c.name,
      restaurant: restaurant,
    }))
  )

  const filteredItems = allItems.filter((item) => {
    const matchesCategory =
      selectedCategory === 'all' || item.category_name === selectedCategory
    const matchesVeg = !vegOnly || item.food_type === 'VEG' || item.food_type === 'pure_veg'
    const matchesSearch =
      !menuSearch.trim() ||
      (item.name || '').toLowerCase().includes(menuSearch.toLowerCase().trim())
    return matchesCategory && matchesVeg && matchesSearch
  })

  const bannerUrl = getRestaurantBanner(restaurant)

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      {/* 1. Back Navigation */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#2845D6] dark:hover:text-blue-400 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Restaurants</span>
      </button>

      {/* 2. Restaurant Hero Header Banner */}
      <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="relative h-48 sm:h-64 w-full overflow-hidden">
          <img
            src={bannerUrl}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          {/* Floating Badges */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
            <span
              className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-md ${
                restaurant.is_open !== false
                  ? 'bg-emerald-600/90 text-white'
                  : 'bg-rose-600/90 text-white'
              }`}
            >
              {restaurant.is_open !== false ? t.openNow : t.closedNow}
            </span>

            {restaurant.is_pure_veg && (
              <span className="px-3 py-1 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase shadow-md flex items-center gap-1">
                <Leaf className="w-3 h-3" />
                <span>{t.vegOnly}</span>
              </span>
            )}
          </div>

          {/* Restaurant Title inside Banner */}
          <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight drop-shadow-md">
              {restaurant.name}
            </h2>
            <p className="text-xs sm:text-sm text-white/85 font-medium flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#F97316]" />
              <span>{restaurant.address_line1 || 'Civil Lines, Kanpur'}</span>
            </p>
          </div>
        </div>

        {/* Quick Meta Stats Strip */}
        <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-4 text-xs font-bold">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
              <div className="bg-amber-500/15 p-1.5 rounded-lg">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              </div>
              <div>
                <span className="block font-black text-sm text-slate-900 dark:text-slate-100">
                  {(Number(restaurant.rating) || 4.8).toFixed(1)}
                </span>
                <span className="text-[10px] text-slate-400 uppercase">{lang === 'hi' ? 'रेटिंग' : 'Rating'}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
              <div className="bg-blue-500/15 p-1.5 rounded-lg">
                <Clock className="w-4 h-4 text-[#2845D6] dark:text-blue-400" />
              </div>
              <div>
                <span className="block font-black text-sm text-slate-900 dark:text-slate-100">
                  {restaurant.preparation_time_minutes || 25} {lang === 'hi' ? 'मिनट' : 'Mins'}
                </span>
                <span className="text-[10px] text-slate-400 uppercase">{lang === 'hi' ? 'डिलीवरी' : 'Delivery'}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
              <div className="bg-emerald-500/15 p-1.5 rounded-lg">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <span className="block font-black text-sm text-slate-900 dark:text-slate-100">
                  {t.fssaiVerified || (lang === 'hi' ? 'FSSAI प्रमाणित' : 'FSSAI Verified')}
                </span>
                <span className="text-[10px] text-slate-400 uppercase">{t.safetyCertified || (lang === 'hi' ? 'सुरक्षा सत्यापित' : 'Safety Certified')}</span>
              </div>
            </div>
          </div>

          {restaurant.phone && (
            <button
              type="button"
              onClick={() => makePhoneCall(restaurant.phone)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-black text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 text-[#2845D6]" />
              <span>{t.callKitchen || (lang === 'hi' ? 'किचन को कॉल करें' : 'Call Kitchen')}</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Search & Veg Toggle Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-16 z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md py-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={menuSearch}
            onChange={(e) => setMenuSearch(e.target.value)}
            placeholder={t.searchInMenu}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2845D6]"
          />
        </div>

        {/* Veg Only Toggle Switch */}
        <button
          type="button"
          onClick={() => setVegOnly((prev) => !prev)}
          className={`px-4 py-2.5 rounded-2xl border text-xs font-black flex items-center gap-2 transition-all cursor-pointer select-none shrink-0 ${
            vegOnly
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          <span className="w-3 h-3 rounded-full border border-emerald-600 flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          </span>
          <span>{t.vegOnly || 'Veg Only'}</span>
        </button>
      </div>

      {/* 4. Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto py-2 px-1 -my-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-[#2845D6] text-white shadow-md shadow-blue-600/25'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          {t.allMenuCount || (lang === 'hi' ? 'सभी आइटम' : 'All Items')} ({allItems.length})
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.name)}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer ${
              selectedCategory === cat.name
                ? 'bg-[#2845D6] text-white shadow-md shadow-blue-600/25'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {cat.name} ({cat.items?.length || cat.menu_items?.length || 0})
          </button>
        ))}
      </div>

      {/* 5. Menu Items Grid */}
      <div className="space-y-4">
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            No dishes matching your search and filter criteria.
          </div>
        )}
      </div>

      {/* 6. Sticky Floating Cart Bar */}
      {itemCount > 0 && (
        <div className="fixed bottom-20 inset-x-4 max-w-lg mx-auto z-40">
          <div
            onClick={() => navigate('/cart')}
            className="p-4 rounded-3xl bg-gradient-to-r from-[#2845D6] to-[#F97316] text-white shadow-2xl shadow-blue-600/40 flex items-center justify-between gap-3 cursor-pointer hover:opacity-95 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-black">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-white/90 block">
                  {itemCount} {itemCount === 1 ? 'ITEM' : 'ITEMS'} ADDED
                </span>
                <div className="text-base font-black">
                  {formatCurrency(grandTotal)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 font-black text-xs bg-white text-slate-900 px-4 py-2 rounded-2xl shadow-md">
              <span>View Cart</span>
              <span>→</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RestaurantPage
