import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ShoppingBag, Store, Bike, Users, Settings, Tag, Wallet, ArrowRight } from 'lucide-react'
import Modal from '../common/Modal'

export const GlobalSearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (!isOpen) setQuery('')
  }, [isOpen])

  const quickLinks = [
    { label: 'Live Orders Queue', path: '/orders', icon: ShoppingBag, category: 'Orders' },
    { label: 'Restaurant Directory', path: '/restaurants', icon: Store, category: 'Restaurants' },
    { label: 'Delivery Boy Fleet', path: '/delivery-boys', icon: Bike, category: 'Delivery' },
    { label: 'Customer Base', path: '/customers', icon: Users, category: 'Customers' },
    { label: 'Restaurant Settlements', path: '/finance', icon: Wallet, category: 'Finance' },
    { label: 'Coupons & Promos', path: '/marketing', icon: Tag, category: 'Marketing' },
    { label: 'System Configuration', path: '/settings', icon: Settings, category: 'Settings' },
  ]

  const filteredLinks = query
    ? quickLinks.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()) || item.category.toLowerCase().includes(query.toLowerCase()))
    : quickLinks

  const handleSelect = (path) => {
    navigate(path)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-xl" showClose={false}>
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-700/60">
        <Search className="w-5 h-5 text-slate-400 shrink-0 ml-1" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search orders, restaurants, riders, customers or settings..."
          className="w-full text-sm bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          autoFocus
        />
        <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-md">
          ESC
        </kbd>
      </div>

      <div className="pt-3 max-h-72 overflow-y-auto space-y-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3">
          Quick Navigation
        </span>
        {filteredLinks.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No matching sections found for "{query}"
          </div>
        ) : (
          filteredLinks.map((item, idx) => {
            const Icon = item.icon
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(item.path)}
                className="w-full flex items-center justify-between p-2.5 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 text-left transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-[#113BD0]/10 group-hover:text-[#113BD0] dark:group-hover:text-blue-400 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-slate-900 dark:text-slate-100">{item.label}</h5>
                    <span className="text-[10px] text-slate-400">{item.category}</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-[#113BD0] dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
              </button>
            )
          })
        )}
      </div>
    </Modal>
  )
}

export default GlobalSearchModal
