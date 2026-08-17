import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Search,
  Mic,
  X,
  UtensilsCrossed,
  Store,
  ArrowRight,
  TrendingUp,
  Tag,
  ArrowLeft,
} from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import searchApi from '../../api/search.api'
import ProductCard from '../../components/common/ProductCard'
import RestaurantCard from '../../components/common/RestaurantCard'
import VoiceSearchModal from '../../components/common/VoiceSearchModal'
import LoadingSkeleton from '../../components/common/LoadingSkeleton'
import EmptyState from '../../components/common/EmptyState'

export const SearchPage = () => {
  const { t, lang } = useLanguage()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''

  const [query, setQuery] = useState(initialQuery)
  const [activeTab, setActiveTab] = useState('dishes') // 'dishes' | 'restaurants'
  const [voiceModalOpen, setVoiceModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [results, setResults] = useState({
    intent: null,
    dishes: [],
    restaurants: [],
    suggestions: [],
  })

  const quickSuggestions = [
    'Chai',
    'Samosa',
    'Burger',
    'Biryani',
    'Pizza',
    'Jalebi',
    'Paneer Butter Masala',
  ]

  const performSearch = useCallback(
    async (searchTerm) => {
      if (!searchTerm || !searchTerm.trim()) {
        setResults({ intent: null, dishes: [], restaurants: [], suggestions: [] })
        return
      }

      setLoading(true)
      try {
        const res = await searchApi.search(searchTerm.trim(), { lang })
        setResults({
          intent: res.data?.intent || null,
          dishes: res.data?.dishes || [],
          restaurants: res.data?.restaurants || [],
          suggestions: res.data?.suggestions || [],
        })
      } catch (err) {
        console.warn('Search failed:', err)
      } finally {
        setLoading(false)
      }
    },
    [lang]
  )

  // Sync initial param query
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery)
      performSearch(initialQuery)
    }
  }, [initialQuery, performSearch])

  // Debounced search on typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        setSearchParams({ q: query.trim() })
        performSearch(query.trim())
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
    <div className="space-y-4 pb-36">
      {/* 1. Header with Back Button and Active Category */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#2845D6] dark:hover:text-blue-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{lang === 'hi' ? 'वापस' : 'Back'}</span>
        </button>

        {query && (
          <span className="text-xs font-bold text-slate-400">
            {dishes.length + restaurants.length} {lang === 'hi' ? 'परिणाम' : 'results'}
          </span>
        )}
      </div>

      {/* 2. Recognized Intent Banner (e.g. 2x Chai Intent) */}
      {intent && intent.has_quantity_intent && (
        <div className="p-3 rounded-2xl bg-blue-50 dark:bg-slate-800/80 border border-blue-200 dark:border-blue-800/60 text-xs text-blue-900 dark:text-blue-200 flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-[#2845D6] dark:text-blue-400 shrink-0" />
            <span>
              Searching for: <strong className="capitalize">{intent.clean_query}</strong> (Quantity: {intent.quantity}x)
            </span>
          </div>
        </div>
      )}

      {/* 3. Tab Selector (Dishes vs Restaurants) */}
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

      {/* 4. Results Grid */}
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
      ) : (
        /* Empty / Initial State before typing */
        <div className="text-center py-12 space-y-3">
          <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-slate-800 text-[#2845D6] dark:text-blue-400 flex items-center justify-center mx-auto">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-base font-black text-slate-800 dark:text-slate-200">
            {t.searchPlaceholder || 'Search food, chai, biryani, or restaurant...'}
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {lang === 'hi'
              ? 'नीचे सर्च बार में टाइप करें या लोकप्रिय व्यंजनों में से चुनें'
              : 'Type in the search bar below or pick from popular dishes'}
          </p>
        </div>
      )}

      {/* 5. Fixed Sticky Bottom Search Bar + Popular Dishes Near Footer Navigation */}
      <div className="fixed bottom-16 sm:bottom-20 inset-x-3 sm:inset-x-6 max-w-lg mx-auto z-30 drop-shadow-2xl space-y-1.5 animate-in slide-in-from-bottom-4 duration-300">
        {/* Popular Dishes Quick Tags Horizontal Scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-1 scrollbar-none no-scrollbar">
          {quickSuggestions.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setQuery(item)
                performSearch(item)
              }}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold shadow-md shrink-0 transition-all active:scale-95 cursor-pointer backdrop-blur-md ${
                query.toLowerCase() === item.toLowerCase()
                  ? 'bg-[#FF5200] text-white border border-[#FF5200]'
                  : 'bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#FF5200]'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Search Input Box */}
        <div className="p-2 sm:p-2.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-2 border-[#FF5200] dark:border-orange-500 shadow-2xl flex items-center gap-2">
          <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF5200] dark:text-orange-400 ml-1.5 shrink-0" />
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
            className="p-2 rounded-xl bg-gradient-to-tr from-[#FF5200] to-amber-500 text-white shadow-xs hover:scale-105 active:scale-95 transition-all flex items-center justify-center shrink-0 cursor-pointer"
            title="Voice Search"
          >
            <Mic className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Voice Search Modal */}
      <VoiceSearchModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onSearch={handleVoiceResult}
      />
    </div>
  )
}

export default SearchPage
