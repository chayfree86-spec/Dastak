import React, { useState, useEffect } from 'react'
import {
  Store,
  Search,
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

export const RestaurantsPage = () => {
  const { t } = useLanguage()
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('all') // 'all' | 'veg' | 'rating' | 'fast'

  useEffect(() => {
    const loadRestaurants = async () => {
      setLoading(true)
      try {
        const res = await restaurantApi.getRestaurants({ per_page: 20 })
        setRestaurants(res.data?.data || res.data || [])
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
    if (filter === 'rating') return (Number(rest.rating) || 4.8) >= 4.5
    if (filter === 'fast') return (rest.preparation_time_minutes || 30) <= 25

    return true
  })

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <Store className="w-7 h-7 text-[#2845D6] dark:text-blue-400" />
            <span>All Partner Restaurants</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Explore verified cloud kitchens, dhabas, and top dining outlets in your city
          </p>
        </div>

        {/* Search inside restaurants */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by restaurant name or cuisine..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2845D6]"
          />
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto py-2 px-1 -my-1 scrollbar-none text-xs font-black">
        {[
          { id: 'all', label: `All Kitchens (${restaurants.length})` },
          { id: 'rating', label: '★ 4.5+ Top Rated' },
          { id: 'veg', label: '🌱 Pure Veg Only' },
          { id: 'fast', label: '⚡ Fast Delivery (< 25 min)' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`px-4 py-2 rounded-2xl transition-all shrink-0 cursor-pointer ${
              filter === item.id
                ? 'bg-[#2845D6] text-white shadow-md shadow-blue-600/25'
                : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRestaurants.map((rest) => (
            <RestaurantCard key={rest.id} restaurant={rest} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Store}
          title="No Restaurants Found"
          description="Try changing your search keywords or filter selection."
        />
      )}
    </div>
  )
}

export default RestaurantsPage
