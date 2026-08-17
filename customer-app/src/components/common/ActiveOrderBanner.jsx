import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Bike, ArrowRight, Clock, Sparkles } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { getOrderStatusText } from '../../utils/formatters'

export const ActiveOrderBanner = ({ order }) => {
  const navigate = useNavigate()
  const { t, lang } = useLanguage()

  if (!order) return null

  const isOut = order.status === 'OUT_FOR_DELIVERY'

  return (
    <div
      onClick={() => navigate(`/orders/${order.order_number}`)}
      className="p-4 rounded-3xl bg-gradient-to-r from-[#2845D6] via-blue-700 to-[#F97316] text-white shadow-xl shadow-blue-600/25 flex items-center justify-between gap-3 cursor-pointer hover:opacity-95 transition-all group"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shrink-0 relative">
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
          <Bike className="w-6 h-6" />
        </div>
        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md">
              {isOut ? 'ON THE WAY' : 'LIVE ORDER'}
            </span>
            <span className="text-xs font-black">#{order.order_number}</span>
          </div>
          <h4 className="text-sm font-black truncate">
            {getOrderStatusText(order.status, lang)}
          </h4>
          <p className="text-[11px] text-white/80 truncate">
            {order.restaurant?.name || 'Dastak Partner Kitchen'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 bg-white/20 backdrop-blur-md px-3.5 py-2 rounded-2xl font-black text-xs group-hover:bg-white group-hover:text-[#2845D6] transition-colors">
        <span>{t.trackOrder}</span>
        <ArrowRight className="w-4 h-4" />
      </div>
    </div>
  )
}

export default ActiveOrderBanner
