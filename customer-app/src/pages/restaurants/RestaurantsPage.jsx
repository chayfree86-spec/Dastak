import React, { useState, useEffect } from 'react'
import {
  Store,
  Search,
  X,
  Star,
  Clock,
  MapPin,
  Leaf,
  Filter,
  Flame,
  ShieldCheck,
  Tag,
} from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import restaurantApi from '../../api/restaurant.api'
import RestaurantCard from '../../components/common/RestaurantCard'
import LoadingSkeleton from '../../components/common/LoadingSkeleton'
import EmptyState from '../../components/common/EmptyState'
import dataCache from '../../utils/dataCache'

export const RestaurantsPage = () => {
  const { t, lang } = useLanguage()
  const [restaurants, setRestaurants] = useState(() => dataCache.get('restaurants_all') || [])
  const [loading, setLoading] = useState(() => !dataCache.has('restaurants_all'))
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('all') // 'all' | 'veg' | 'rating' | 'fast'

  useEffect(() => {
    const loadRestaurants = async () => {
      if (!dataCache.has('restaurants_all')) setLoading(true)
      try {
        const res = await restaurantApi.getRestaurants({ per_page: 20 })
        const list = res.data?.data || res.data || []
        setRestaurants(list)
        dataCache.set('restaurants_all', list)
        dataCache.preloadImages(list.map(r => r.banner || r.logo))
      } catch (e) {
        console.warn('Failed to load restaurants:', e)
      } finally {
        setLoading(false)
      }
    }

    loadRestaurants()
  }, [])

  const filteredRestaurants = restaurants.filter((rest) => {
    const matchesSearch =
      !searchQuery.trim() ||
      (rest.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rest.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rest.address_line1 || '').toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    if (filter === 'veg') return Boolean(rest.is_pure_veg)
    if (filter === 'rating') return Number(rest.rating) >= 4.5
    if (filter === 'fast') {
      const prep = Number(rest.preparation_time_minutes)
      return prep > 0 && prep <= 25
    }

    return true
  })

  return (
    <div className="space-y-4 pb-16">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
          <Store className="w-6 h-6 text-[#113BD0] dark:text-blue-400" />
          <span>{t.allPartnerRestaurants || (lang === 'hi' ? 'सभी पार्टनर रेस्टोरेंट' : 'All Partner Restaurants')}</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
          {t.restaurantsSub || (lang === 'hi' ? 'सत्यापित क्लाउड किचन, ढाबे और लोकप्रिय डाइनिंग आउटलेट्स' : 'Explore verified cloud kitchens, dhabas, and top dining outlets')}
        </p>
      </div>

      {/* Top In-Flow Search Input Bar */}
      <div className="p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center gap-2">
        <Search className="w-4 h-4 text-[#113BD0] dark:text-blue-400 ml-1 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={lang === 'hi' ? 'रेस्टोरेंट या व्यंजन के नाम से खोजें...' : 'Search by restaurant name or cuisine...'}
          className="w-full py-1 text-xs sm:text-sm font-bold bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 px-0.5 -my-0.5 scrollbar-none text-xs font-black">
        {[
          { id: 'all', label: `${t.filterAll || 'All'} (${restaurants.length})` },
          { id: 'rating', label: t.filterRating || '★ 4.5+ Rating' },
          { id: 'veg', label: t.filterVeg || '🌱 Pure Veg' },
          { id: 'fast', label: t.filterFast || '⚡ Fast Delivery' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`px-4 py-2.5 min-h-[40px] sm:min-h-[44px] rounded-2xl transition-all shrink-0 cursor-pointer shadow-sm active:scale-95 flex items-center justify-center select-none ${
              filter === item.id
                ? 'bg-[#FF5200] text-white shadow-md shadow-orange-500/30'
                : 'bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#FF5200]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Restaurants Grid */}
      {loading ? (
        <LoadingSkeleton count={3} />
      ) : filteredRestaurants.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredRestaurants.map((rest) => (
            <RestaurantCard key={rest.id} restaurant={rest} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Store}
          title={lang === 'hi' ? 'कोई रेस्टोरेंट नहीं मिला' : 'No Restaurants Found'}
          description={lang === 'hi' ? 'कृपया अन्य कीवर्ड या फ़िल्टर बदलकर खोजें।' : 'Try changing your search keywords or filter selection.'}
        />
      )}
    </div>
  )
}

export default RestaurantsPage
