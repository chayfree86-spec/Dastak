import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp,
  CreditCard,
  ShoppingBag,
  Clock,
  Receipt,
  Download,
  Calendar,
  PieChart,
  DollarSign,
  Utensils,
  ChevronRight,
  RotateCcw,
  Store,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Filter,
  Star,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useCart } from '../../context/CartContext'
import { useToast } from '../../context/ToastContext'
import customerApi from '../../api/customer.api'
import { formatCurrency, formatDateTime, getOrderStatusText } from '../../utils/formatters'
import LoadingSkeleton from '../../components/common/LoadingSkeleton'
import EmptyState from '../../components/common/EmptyState'
import Button from '../../components/common/Button'
import RatingModal from '../../components/common/RatingModal'

export const ReportsPage = () => {
  const navigate = useNavigate()
  const { t, lang } = useLanguage()
  const toast = useToast()
  const { isAuthenticated, user } = useAuth()
  const { addItem } = useCart()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterTab, setFilterTab] = useState('all') // 'all' | 'delivered' | 'cancelled'
  const [selectedOrderForRating, setSelectedOrderForRating] = useState(null)

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }

    const loadData = async () => {
      setLoading(true)
      try {
        const res = await customerApi.getOrders({ per_page: 50 })
        setOrders(res.data?.data || res.data || [])
      } catch (e) {
        console.warn('Reports load error:', e)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isAuthenticated])

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

    toast.success('Items Added to Cart', 'Previous order items loaded into your cart.')
    navigate('/cart')
  }

  if (!isAuthenticated) {
    return (
      <div className="py-10 max-w-xl mx-auto">
        <EmptyState
          icon={Receipt}
          title="Sign in to View Your Reports & Orders"
          description="Log in with your customer account to view your past orders, spending summary, and billing receipts."
          actionLabel="Sign In"
          onAction={() => navigate('/login?redirect=/reports')}
        />
      </div>
    )
  }

  // Calculate Metrics
  const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED')
  const totalSpent = deliveredOrders.reduce(
    (sum, o) => sum + Number(o.bill?.total_amount || o.total_amount || 0),
    0
  )
  const avgOrderValue =
    deliveredOrders.length > 0 ? Math.round(totalSpent / deliveredOrders.length) : 0

  const filteredOrders = orders.filter((o) => {
    if (filterTab === 'delivered') return o.status === 'DELIVERED'
    if (filterTab === 'cancelled') return o.status === 'CANCELLED' || o.status === 'REJECTED'
    return true
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
          <Receipt className="w-6 h-6 text-[#2845D6] dark:text-blue-400" />
          <span>{lang === 'hi' ? 'पुराने ऑर्डर और खर्च रिपोर्ट' : 'Past Orders & Spending Report'}</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
          {lang === 'hi'
            ? 'आपके पिछले भोजन का पूरा इतिहास, खर्च विवरण और टैक्स इनवॉइस'
            : 'Complete history of your previous meals, spending metrics, and tax invoices'}
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton count={3} />
      ) : (
        <>
          {/* 1. Bento KPI Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Total Spent */}
            <div className="p-4 rounded-3xl bg-gradient-to-br from-[#2845D6] to-indigo-700 text-white shadow-lg shadow-blue-600/20 space-y-1">
              <span className="text-[9px] font-black uppercase tracking-wider text-blue-200 block">
                {lang === 'hi' ? 'कुल खर्च' : 'TOTAL SPENT'}
              </span>
              <div className="text-xl font-black">
                {formatCurrency(totalSpent)}
              </div>
              <span className="text-[10px] text-blue-100 font-medium block">
                {deliveredOrders.length} {lang === 'hi' ? 'पूरे हुए' : 'Completed'}
              </span>
            </div>

            {/* Total Orders */}
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                {lang === 'hi' ? 'कुल ऑर्डर्स' : 'TOTAL ORDERS'}
              </span>
              <div className="text-xl font-black text-slate-900 dark:text-slate-100">
                {orders.length}
              </div>
              <span className="text-[10px] text-emerald-600 font-bold block">
                {deliveredOrders.length} {lang === 'hi' ? 'डिलीवर हुए' : 'Delivered'}
              </span>
            </div>

            {/* Average Order Value */}
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                {lang === 'hi' ? 'औसत ऑर्डर मूल्य' : 'AVG ORDER VALUE'}
              </span>
              <div className="text-xl font-black text-slate-900 dark:text-slate-100">
                {formatCurrency(avgOrderValue)}
              </div>
              <span className="text-[10px] text-slate-400 font-medium block">
                {lang === 'hi' ? 'प्रति भोजन टिकट' : 'Per meal ticket'}
              </span>
            </div>

            {/* Delivery Rate */}
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                {lang === 'hi' ? 'डिलीवरी दर' : 'DELIVERY RATE'}
              </span>
              <div className="text-xl font-black text-slate-900 dark:text-slate-100">
                {orders.length > 0
                  ? `${Math.round((deliveredOrders.length / orders.length) * 100)}%`
                  : '100%'}
              </div>
              <span className="text-[10px] text-emerald-600 font-bold block">
                {lang === 'hi' ? 'सफलतापूर्वक पूर्ण' : 'Order fulfillment'}
              </span>
            </div>
          </div>

          {/* 2. Past Orders List with Re-order and Receipts */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#2845D6]" />
                <span>{lang === 'hi' ? 'पुराने ऑर्डर्स का इतिहास' : 'Past Orders History'}</span>
              </h3>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 text-xs font-black">
                {[
                  { id: 'all', label: `${lang === 'hi' ? 'सभी' : 'All'} (${orders.length})` },
                  { id: 'delivered', label: `${lang === 'hi' ? 'डिलीवर हुए' : 'Delivered'} (${deliveredOrders.length})` },
                  { id: 'cancelled', label: lang === 'hi' ? 'कैंसिल' : 'Cancelled' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterTab(tab.id)}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      filterTab === tab.id
                        ? 'bg-[#2845D6] text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title={lang === 'hi' ? 'कोई पुराना ऑर्डर नहीं मिला' : 'No Past Orders Found'}
                description={lang === 'hi' ? 'आपके पिछले भोजन के ऑर्डर और रसीदें यहाँ दिखाई देंगी।' : 'Your previous meal orders and invoices will appear here.'}
              />
            ) : (
              <div className="space-y-3.5">
                {filteredOrders.map((o) => {
                  const billTotal = o.bill?.total_amount || o.total_amount || 0
                  const isDelivered = o.status === 'DELIVERED'
                  const isCancelled = o.status === 'CANCELLED' || o.status === 'REJECTED'
                  const items = o.items || []

                  return (
                    <div
                      key={o.id || o.order_number}
                      className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3 hover:shadow-md transition-shadow"
                    >
                      {/* Order Top Bar */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-slate-800 text-[#2845D6] dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                            <Store className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-black text-sm text-slate-900 dark:text-slate-100 truncate">
                              {o.restaurant?.name || 'Dastak Partner Kitchen'}
                            </h4>
                            <p className="text-[11px] text-slate-400">
                              #{o.order_number} • {formatDateTime(o.placed_at || o.created_at)}
                            </p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-xl shrink-0 ${
                            isDelivered
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : isCancelled
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          }`}
                        >
                          {getOrderStatusText(o.status, lang)}
                        </span>
                      </div>

                      {/* Items Summary Snippet */}
                      {items.length > 0 && (
                        <div className="py-2 border-y border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5 flex-wrap">
                          {items.map((it, idx) => (
                            <span key={idx} className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg text-[11px] font-bold">
                              {it.quantity}x {it.item_name || it.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Order Footer & Actions */}
                      <div className="flex items-center justify-between gap-3 pt-1">
                        <div>
                          <span className="text-[10px] font-black uppercase text-slate-400 block">
                            {lang === 'hi' ? 'कुल बिल' : 'Total Bill'}
                          </span>
                          <span className="font-black text-base text-slate-900 dark:text-slate-100">
                            {formatCurrency(billTotal)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {isDelivered && (
                            <>
                              <button
                                type="button"
                                onClick={() => setSelectedOrderForRating(o)}
                                className="px-3 py-2 rounded-2xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-800 dark:text-amber-300 text-xs font-black flex items-center gap-1.5 border border-amber-200 dark:border-amber-800 transition-all cursor-pointer shadow-xs"
                              >
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span>{t.rateOrder || (lang === 'hi' ? 'रेटिंग दें' : 'Rate')}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleReorder(o)}
                                className="px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#2845D6] dark:text-blue-400 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>{t.orderAgain || (lang === 'hi' ? 'फिर से ऑर्डर करें' : 'Re-Order')}</span>
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => navigate(`/orders/${o.order_number}`)}
                            className="px-4 py-2 rounded-2xl bg-[#2845D6] hover:bg-[#1E3A8A] text-white text-xs font-black shadow-md shadow-blue-600/20 flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <span>{lang === 'hi' ? 'रसीद देखें' : 'Receipt'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Rating Modal */}
      <RatingModal
        isOpen={Boolean(selectedOrderForRating)}
        onClose={() => setSelectedOrderForRating(null)}
        order={selectedOrderForRating}
        onReviewSuccess={() => {
          if (isAuthenticated) {
            customerApi.getOrders({ per_page: 50 }).then((res) => {
              setOrders(res.data?.data || res.data || [])
            })
          }
        }}
      />
    </div>
  )
}

export default ReportsPage
