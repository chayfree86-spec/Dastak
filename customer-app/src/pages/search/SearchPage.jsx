import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Search,
  Mic,
  X,
  Sparkles,
  UtensilsCrossed,
  Store,
  ArrowRight,
  TrendingUp,
  Tag,
} from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import searchApi from '../../api/search.api'
import ProductCard from '../../components/common/ProductCard'
import RestaurantCard from '../../components/common/RestaurantCard'
import VoiceSearchModal from '../../components/common/VoiceSearchModal'
import LoadingSkeleton from '../../components/common/LoadingSkeleton'
import EmptyState from '../../components/common/EmptyState'

export const SearchPage = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { t, lang } = useLanguage()

  const initialQuery = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQuery)
  const [activeTab, setActiveTab] = useState('dishes') // 'dishes' | 'restaurants'
  const [results, setResults] = useState({
    intent: null,
    dishes: [],
    restaurants: [],
    suggestions: [],
  })
  const [loading, setLoading] = useState(false)
  const [voiceModalOpen, setVoiceModalOpen] = useState(false)
  const [quickSuggestions, setQuickSuggestions] = useState([])

  // Load quick suggestions on mount
  useEffect(() => {
    searchApi.getSuggestions('').then((res) => {
      setQuickSuggestions(res.data || [])
    })
  }, [])

  // Execute Search
  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults({ intent: null, dishes: [], restaurants: [], suggestions: [] })
      return
    }

    setLoading(true)
    try {
      const res = await searchApi.search(searchQuery)
      setResults(
        res.data || { intent: null, dishes: [], restaurants: [], suggestions: [] }
      )
    } catch (e) {
      console.warn('Search error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery)
      performSearch(initialQuery)
    }
  }, [initialQuery, performSearch])

  // Debounced search when user types
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        setSearchParams({ q: query })
        performSearch(query)
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [query, setSearchParams, performSearch])

  const handleVoiceResult = (transcript) => {
    setQuery(transcript)
    setSearchParams({ q: transcript })
    performSearch(transcript)
  }

  const intent = results.intent
  const dishes = results.dishes || []
  const restaurants = results.restaurants || []

  return (
    <div className="space-y-4 pb-16">
      {/* 1. Prominent Top Search Input Bar (Sticky at Top) */}
      <div className="sticky top-0 z-20 pt-1 pb-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
        <div className="p-2 sm:p-2.5 rounded-2xl bg-white dark:bg-slate-850 border-2 border-[#2845D6] dark:border-blue-500 shadow-md flex items-center gap-2">
          <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#2845D6] dark:text-blue-400 ml-1.5 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder || 'Search food, chai, biryani, or restaurant...'}
            autoFocus
            className="w-full py-1 text-xs sm:text-sm font-bold bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setSearchParams({})
                setResults({ intent: null, dishes: [], restaurants: [], suggestions: [] })
              }}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setVoiceModalOpen(true)}
            className="p-2 rounded-xl bg-gradient-to-tr from-[#2845D6] to-[#F97316] text-white shadow-xs hover:scale-105 active:scale-95 transition-all flex items-center justify-center shrink-0 cursor-pointer"
            title="Voice Search"
          >
            <Mic className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Recognized Intent Banner (e.g. 2x Chai Intent) */}
      {intent && intent.has_quantity_intent && (
        <div className="p-3 rounded-2xl bg-blue-50 dark:bg-slate-800/80 border border-blue-200 dark:border-blue-800/60 text-xs text-blue-900 dark:text-blue-200 flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#2845D6] dark:text-blue-400 shrink-0" />
            <span>
              Searching for: <strong className="capitalize">{intent.clean_query}</strong> (Quantity: {intent.quantity}x)
            </span>
          </div>
        </div>
      )}

      {/* 3. Quick Suggestions Chips (Popular Dishes) */}
      {quickSuggestions.length > 0 && !query && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase text-slate-400">
            <TrendingUp className="w-3.5 h-3.5 text-[#2845D6]" />
            <span>{t.suggestedDishes || 'POPULAR DISHES'}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickSuggestions.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(item)
                  performSearch(item)
                }}
                className="px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-[#2845D6] text-slate-700 dark:text-slate-200 shadow-xs"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. Tab Selector (Dishes vs Restaurants) */}
      {query && (
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-black">
          <button
            type="button"
            onClick={() => setActiveTab('dishes')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'dishes'
                ? 'bg-[#2845D6] text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>{t.dishesTab} ({dishes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('restaurants')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'restaurants'
                ? 'bg-[#2845D6] text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>{t.restaurantsTab} ({restaurants.length})</span>
          </button>
        </div>
      )}

      {/* 5. Results Grid */}
      {loading ? (
        <LoadingSkeleton count={3} />
      ) : query ? (
        activeTab === 'dishes' ? (
          dishes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {dishes.map((dish) => (
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
            <div className="space-y-4">
              <EmptyState
                icon={UtensilsCrossed}
                title={t.noResults}
                description={t.maybeLookingFor}
              />
              {/* Popular recommendations on empty search */}
              <div className="flex flex-wrap gap-2 justify-center">
                {quickSuggestions.slice(0, 5).map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setQuery(s)
                      performSearch(s)
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-slate-800 text-[#2845D6] dark:text-blue-400 text-xs font-bold border border-blue-200 dark:border-slate-700"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )
        ) : restaurants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {restaurants.map((rest) => (
              <RestaurantCard key={rest.id} restaurant={rest} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Store}
            title={lang === 'hi' ? 'कोई रेस्टोरेंट नहीं मिला' : 'No Restaurants Found'}
            description={lang === 'hi' ? 'कृपया अन्य कीवर्ड या व्यंजन के नाम से खोजें।' : 'Try searching with a different kitchen or food name.'}
          />
        )
      ) : null}

      {/* Voice Search Modal */}
      <VoiceSearchModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onSearch={(voiceQuery) => {
          setQuery(voiceQuery)
          performSearch(voiceQuery)
        }}
      />
    </div>
  )
}

export default SearchPage
