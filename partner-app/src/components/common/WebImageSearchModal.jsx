import React, { useState, useEffect } from 'react'
import { Search, Sparkles, X, Check, Loader2, ImageOff, RefreshCw } from 'lucide-react'
import Modal from './Modal'
import apiClient from '../../api/client'
import menuApi from '../../api/menu.api'
import { useToast } from '../../context/ToastContext'

const POPULAR_TAGS = [
  'Chai',
  'Cold Coffee',
  'Samosa',
  'Cheese Burger',
  'Pizza',
  'Masala Dosa',
  'Grilled Sandwich',
  'Chocolate Cake',
  'Paneer Butter Masala',
  'Biryani',
  'Maggi',
  'French Fries',
  'Momos',
  'Milkshake',
]

export const WebImageSearchModal = ({
  isOpen,
  initialQuery = '',
  onClose,
  onSelectImage,
  zIndex = 'z-[10010]',
}) => {
  const toast = useToast()
  const [query, setQuery] = useState(initialQuery || '')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectingUrl, setSelectingUrl] = useState(null)

  const handleSearch = async (searchKeyword = query) => {
    const q = (searchKeyword || '').trim()
    if (!q) return
    setLoading(true)
    try {
      let res
      if (typeof menuApi?.searchFoodImages === 'function') {
        res = await menuApi.searchFoodImages(q)
      } else {
        res = await apiClient.get('/partner/menu/search-food-images', { params: { q } })
      }
      const list = res?.data?.data || res?.data || []
      setResults(list)
      if (list.length === 0) {
        toast.info('No results', `No web images found for "${q}". Try another keyword.`)
      }
    } catch (err) {
      console.warn('Search error:', err)
      toast.error('Search Failed', err.message || 'Unable to fetch web images.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      const startQuery = (initialQuery || '').trim()
      setQuery(startQuery)
      if (startQuery) {
        handleSearch(startQuery)
      } else {
        handleSearch('Indian fast food')
      }
    }
  }, [isOpen, initialQuery])

  const handleSelect = async (item) => {
    if (selectingUrl) return
    setSelectingUrl(item.full_url)
    try {
      await onSelectImage(item.full_url)
      onClose()
    } catch (err) {
      toast.error('Selection Failed', err.message || 'Unable to use this image.')
      setSelectingUrl(null)
    }
  }

  if (!isOpen) return null

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Search Web Food Images"
      subtitle="Pick a professional food image for your dish. It will be downloaded to your server."
      maxWidth="max-w-2xl"
      zIndex={zIndex}
    >
      <div className="space-y-4">
        {/* Search Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSearch()
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dish (e.g. Masala Dosa, Cold Coffee, Pizza)..."
              className="w-full pl-9 pr-8 h-11 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#113BD0]/30 focus:border-[#113BD0] transition-all font-medium"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="h-11 px-4 rounded-xl bg-[#113BD0] hover:bg-[#1E3A8A] text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Search</span>
          </button>
        </form>

        {/* Quick Tag Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0 mr-1 select-none">
            Popular:
          </span>
          {POPULAR_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                setQuery(tag)
                handleSearch(tag)
              }}
              className={`h-7 px-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 border ${
                query.toLowerCase().includes(tag.toLowerCase())
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-[#113BD0] dark:text-blue-300 border-blue-200 dark:border-blue-800'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Results Image Grid */}
        <div className="max-h-[50vh] overflow-y-auto pr-1">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div
                  key={n}
                  className="aspect-square rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 animate-pulse"
                />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
              <ImageOff className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                No images found for "{query}"
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Try searching with a simpler dish name like "Samosa", "Burger", or "Chai".
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {results.map((item) => {
                const isSelected = selectingUrl === item.full_url
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={Boolean(selectingUrl)}
                    onClick={() => handleSelect(item)}
                    className="group relative aspect-square rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 hover:border-[#113BD0] dark:hover:border-blue-500 focus:outline-none transition-all shadow-xs hover:shadow-lg active:scale-95 cursor-pointer bg-slate-100 dark:bg-slate-800 text-left"
                    title={item.title || 'Click to select'}
                  >
                    <img
                      src={item.thumbnail_url}
                      alt={item.title || 'Food'}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
                      loading="lazy"
                    />

                    {/* Gradient info overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-between">
                      <span className="text-[9px] font-bold text-white/90 uppercase tracking-wider bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-xs self-end">
                        {item.source || 'Free'}
                      </span>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] text-white font-bold truncate leading-tight">
                          {item.title}
                        </span>
                        <span className="shrink-0 p-1 rounded-full bg-[#113BD0] text-white">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      </div>
                    </div>

                    {/* Loading / Saving spinner */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-1 p-2 text-center animate-fadeIn">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                        <span className="text-[10px] font-bold">Saving to Server...</span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-400">
          <span>✨ 1-Click download & auto-compress to server storage</span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default WebImageSearchModal
