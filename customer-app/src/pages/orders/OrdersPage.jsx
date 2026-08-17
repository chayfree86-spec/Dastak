import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Clock,
  CheckCircle2,
  Store,
  ArrowRight,
  RotateCcw,
  Bike,
  Receipt,
  Sparkles,
  Star,
} from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useToast } from '../../context/ToastContext'
import customerApi from '../../api/customer.api'
import { formatCurrency, formatDateTime, getOrderStatusText } from '../../utils/formatters'
import LoadingSkeleton from '../../components/common/LoadingSkeleton'
import EmptyState from '../../components/common/EmptyState'
import Button from '../../components/common/Button'
import RatingModal from '../../components/common/RatingModal'

export const OrdersPage = () => {
  const navigate = useNavigate()
  const { t, lang } = useLanguage()
  const toast = useToast()
  const { isAuthenticated } = useAuth()
  const { addItem } = useCart()

  const [orders, setOrders] = useState([])
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'active' | 'completed'
  const [loading, setLoading] = useState(true)
  const [selectedOrderForRating, setSelectedOrderForRating] = useState(null)

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }

    const loadOrders = async () => {
      setLoading(true)
      try {
        const res = await customerApi.getOrders({ per_page: 30 })
        const list = res.data?.data || res.data || []
        setOrders(list)
      } catch (e) {
        console.warn('Orders load error:', e)
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <div className="py-8">
        <EmptyState
          icon={Clock}
          title="Sign in to View Your Orders"
          description="Log in with your mobile number to view order history and live deliveries."
          actionLabel={t.login}
          onAction={() => navigate('/login?redirect=/orders')}
        />
      </div>
    )
  }

  const activeOrders = orders.filter(
    (o) =>
      o.status !== 'DELIVERED' &&
      o.status !== 'CANCELLED' &&
      o.status !== 'REJECTED'
  )

  const pastOrders = orders.filter(
    (o) =>
      o.status === 'DELIVERED' ||
      o.status === 'CANCELLED' ||
      o.status === 'REJECTED'
  )

  const filteredOrders =
    activeTab === 'active'
      ? activeOrders
      : activeTab === 'completed'
      ? pastOrders
      : orders

  const handleReorder = (order) => {
    const items = order.items || []
    if (items.length === 0) return

    items.forEach((it) => {
      addItem(
        {
          id: it.menu_item_id || it.id,
          name: it.item_name || it.name,
          base_price: it.unit_price || it.price,
          food_type: it.food_type,
          restaurant: order.restaurant,
        },
        it.quantity || 1,
        order.restaurant
      )
    })

    toast.success('Items Added to Cart', 'Re-order items loaded into your cart.')
    navigate('/cart')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. Header & Tab Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {t.orderHistory}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track active live deliveries and past meal orders
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-black self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {lang === 'hi' ? 'सभी' : 'All'} ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'active'
                ? 'bg-[#2845D6] text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {lang === 'hi' ? 'सक्रिय' : 'Active'} ({activeOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'completed'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {lang === 'hi' ? 'पुराने' : 'Past'} ({pastOrders.length})
          </button>
        </div>
      </div>

      {/* 2. Orders Cards List */}
      {loading ? (
        <LoadingSkeleton count={3} />
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={lang === 'hi' ? 'कोई ऑर्डर नहीं मिला' : 'No Orders Found'}
          description={lang === 'hi' ? 'इस फ़िल्टर से मेल खाता हुआ कोई ऑर्डर नहीं है।' : 'You have not placed any orders matching this filter.'}
          actionLabel={t.browseRestaurants}
          onAction={() => navigate('/')}
        />
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isActive =
              order.status !== 'DELIVERED' &&
              order.status !== 'CANCELLED' &&
              order.status !== 'REJECTED'
            const rest = order.restaurant || {}
            const items = order.items || []
            const total = order.bill?.total_amount || order.total_amount || 0

            return (
              <div
                key={order.id || order.order_number}
                className={`rounded-3xl bg-white dark:bg-slate-900 border shadow-xs hover:shadow-md transition-all overflow-hidden ${
                  isActive
                    ? 'border-[#2845D6]/40 ring-2 ring-blue-500/10'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                {/* Header */}
                <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-slate-900 dark:text-slate-100">
                        #{order.order_number}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                          isActive
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 animate-pulse'
                            : order.status === 'DELIVERED'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200'
                        }`}
                      >
                        {getOrderStatusText(order.status, lang)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {formatDateTime(order.placed_at || order.created_at)}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-black text-slate-900 dark:text-slate-100">
                      {formatCurrency(total)}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {order.payment_mode === 'COD'
                        ? lang === 'hi' ? 'कैश ऑन डिलीवरी' : 'Cash on Delivery'
                        : lang === 'hi' ? 'ऑनलाइन भुगतान' : 'Online Paid'}
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-4 sm:p-5 space-y-3 text-xs">
                  {/* Restaurant & Items summary */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <h4 className="font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-[#2845D6]" />
                        <span>{rest.name || 'Dastak Partner Kitchen'}</span>
                      </h4>
                      <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                        {items
                          .map((it) => `${it.quantity || 1}x ${it.item_name || it.name}`)
                          .join(', ')}
                      </p>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                    {isActive ? (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={Bike}
                        onClick={() => navigate(`/orders/${order.order_number}`)}
                        className="font-bold text-xs"
                      >
                        {t.trackOrder}
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/orders/${order.order_number}`)}
                          className="font-bold text-xs"
                        >
                          {lang === 'hi' ? 'विवरण देखें' : 'View Details'}
                        </Button>
                        {order.status === 'DELIVERED' && (
                          <button
                            type="button"
                            onClick={() => setSelectedOrderForRating(order)}
                            className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-800 dark:text-amber-300 font-black text-xs flex items-center gap-1.5 border border-amber-200 dark:border-amber-800 transition-all cursor-pointer shadow-xs"
                          >
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{t.rateOrder || (lang === 'hi' ? 'रेटिंग दें' : 'Rate')}</span>
                          </button>
                        )}
                        <Button
                          variant="accent"
                          size="sm"
                          icon={RotateCcw}
                          onClick={() => handleReorder(order)}
                          className="font-bold text-xs"
                        >
                          {t.orderAgain}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Rating Modal */}
      <RatingModal
        isOpen={Boolean(selectedOrderForRating)}
        onClose={() => setSelectedOrderForRating(null)}
        order={selectedOrderForRating}
        onReviewSuccess={() => {
          // Refresh orders to reflect review status
          if (isAuthenticated) {
            customerApi.getOrders({ per_page: 30 }).then((res) => {
              setOrders(res.data?.data || res.data || [])
            })
          }
        }}
      />
    </div>
  )
}

export default OrdersPage
