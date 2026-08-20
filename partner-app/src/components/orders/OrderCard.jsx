import React from 'react'
import {
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Bike,
  User,
  Phone,
  MapPin,
  Flame,
  ArrowRight,
} from 'lucide-react'
import { formatCurrency, formatElapsedTime, formatTime } from '../../utils/formatters'
import StatusBadge from '../common/StatusBadge'
import Button from '../common/Button'

export const OrderCard = ({
  order,
  onAccept,
  onReject,
  onMarkReady,
  onViewDetails,
  compact = false,
}) => {
  if (!order) return null

  const items = order.items || []
  const itemCount = items.reduce((acc, it) => acc + (it.quantity || 1), 0)
  const isPending = order.status === 'PENDING'
  const isPreparing = order.status === 'CONFIRMED' || order.status === 'PREPARING'
  const isReady = order.status === 'READY_FOR_PICKUP'
  const isOutForDelivery = order.status === 'OUT_FOR_DELIVERY' || order.status === 'DISPATCHED'

  // Time elapsed since placement
  const placedAt = order.placed_at || order.created_at
  const diffMinutes = placedAt ? Math.floor((Date.now() - new Date(placedAt).getTime()) / 60000) : 0
  const isUrgent = isPending && diffMinutes >= 5
  const isCritical = isPending && diffMinutes >= 10

  const customerName = order.customer?.name || order.delivery_address?.customer_name || 'Valued Customer'
  const customerPhone = order.customer?.mobile || order.delivery_address?.customer_phone || ''
  const deliveryAddress = order.delivery_address?.address || order.delivery_address_json?.address || ''

  const isPaid = order.payment_status === 'COMPLETED' || order.payment_status === 'PAID'
  const isCod = order.payment_mode === 'COD' || order.payment_mode === 'CASH_ON_DELIVERY'

  return (
    <div
      className={`rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800 border transition-all duration-200 shadow-xs hover:shadow-md overflow-hidden flex flex-col justify-between ${
        isCritical
          ? 'border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20'
          : isUrgent
          ? 'border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/20'
          : 'border-slate-200/90 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
      }`}
    >
      {/* 1. Header Bar: Order ID, Status, Elapsed Time & Price */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-900/60">
        <div className="flex items-start justify-between gap-3">
          {/* Left: Order number & Time */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {order.order_number}
              </span>
              <StatusBadge status={order.status} size="xs" />
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-400 font-medium">
              <span>{formatTime(placedAt)}</span>
              <span>&bull;</span>
              <span
                className={`flex items-center gap-1 font-bold ${
                  isCritical
                    ? 'text-rose-600 dark:text-rose-400 font-black animate-pulse'
                    : isUrgent
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                {formatElapsedTime(placedAt)}
              </span>
            </div>
          </div>

          {/* Right: Bill Total & Payment Method Pill (Highlighted Amount) */}
          <div className="text-right shrink-0">
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none">
              {formatCurrency(order.bill?.total_amount || order.total_amount)}
            </div>
            <span
              className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border mt-1.5 select-none ${
                isPaid
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/40'
                  : isCod
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/40'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {isCod ? 'Cash on Delivery' : 'Online Paid'}
            </span>
          </div>
        </div>

        {/* Customer & Delivery Brief */}
        <div className="mt-3.5 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 min-w-0">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
              {customerName}
            </span>
            {customerPhone && (
              <span className="text-[11px] text-slate-400 font-medium">
                ({customerPhone})
              </span>
            )}
          </div>

          {deliveryAddress && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400 truncate max-w-xs">
              <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
              <span className="truncate">{deliveryAddress}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Order Items Breakdown */}
      <div className="p-4 sm:p-5 space-y-3 flex-1">
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400">
          <span>Ordered Items ({itemCount})</span>
          {order.estimated_delivery_minutes > 0 && (
            <span className="text-[#113BD0] dark:text-blue-400 font-bold">
              Prep Time: ~{order.estimated_delivery_minutes} mins
            </span>
          )}
        </div>

        <div className="space-y-2.5 divide-y divide-slate-100 dark:divide-slate-700/50">
          {items.map((item, idx) => {
            const isVeg = item.is_veg !== false
            return (
              <div key={idx} className="pt-2 first:pt-0 flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5 min-w-0">
                  {/* Quantity Badge */}
                  <span className="px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-[#113BD0] dark:text-blue-400 font-black text-xs shrink-0">
                    {item.quantity}×
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      {/* Veg / Non-Veg Indicator */}
                      <span
                        className={`w-3.5 h-3.5 rounded-xs border-2 flex items-center justify-center shrink-0 ${
                          isVeg ? 'border-emerald-600' : 'border-rose-600'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                          }`}
                        />
                      </span>

                      <span className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate">
                        {item.item_name || item.name}
                      </span>
                    </div>

                    {item.variant_name && (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Variant: <strong className="text-slate-600 dark:text-slate-300">{item.variant_name}</strong>
                      </p>
                    )}
                    {item.instructions && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium italic mt-0.5">
                        “{item.instructions}”
                      </p>
                    )}
                  </div>
                </div>

                <span className="font-bold text-slate-900 dark:text-slate-100 shrink-0 text-xs sm:text-sm">
                  {formatCurrency(item.total_price || item.unit_price * (item.quantity || 1))}
                </span>
              </div>
            )
          })}
        </div>

        {/* Special Chef Instructions Callout */}
        {order.special_instructions && (
          <div className="mt-3 p-3 rounded-xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
            <MessageSquare className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="font-extrabold text-[10px] uppercase tracking-wider block text-amber-800 dark:text-amber-300">
                Chef Instruction / Customer Note
              </span>
              <p className="mt-0.5 text-xs font-semibold leading-relaxed">
                {order.special_instructions}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Action Buttons Footer Bar (Touch-friendly layout with Call on right) */}
      <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-700/70 bg-slate-50/60 dark:bg-slate-900/60 flex flex-col gap-2.5 w-full">
        {/* PENDING: Row 1 (View Details + Reject in 1 row) & Row 2 (Accept Order + Call on right) */}
        {isPending ? (
          <>
            {/* Row 1: View Details (50%) + Reject (50%) */}
            <div className="grid grid-cols-2 gap-2.5 w-full">
              {onViewDetails && (
                <button
                  type="button"
                  onClick={() => onViewDetails(order)}
                  className="h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-98 transition-all cursor-pointer select-none"
                >
                  <span>View Details</span>
                </button>
              )}

              {onReject && (
                <button
                  type="button"
                  onClick={() => onReject(order)}
                  className="h-11 rounded-xl border border-rose-200 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs hover:bg-rose-100 dark:hover:bg-rose-900/50 active:scale-98 transition-all cursor-pointer select-none"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject</span>
                </button>
              )}
            </div>

            {/* Row 2: Accept Order (Flex-1) + Call Icon Button Fixed on Right */}
            <div className="flex items-center gap-2.5 w-full">
              {onAccept && (
                <button
                  type="button"
                  onClick={() => onAccept(order)}
                  className="flex-1 h-12 rounded-xl bg-[#113BD0] hover:bg-[#1E3A8A] text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 active:scale-98 transition-all cursor-pointer select-none"
                >
                  <CheckCircle2 className="w-5 h-5 stroke-[2.4]" />
                  <span>Accept Order</span>
                </button>
              )}

              {customerPhone && (
                <a
                  href={`tel:${customerPhone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="w-12 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/25 active:scale-95 transition-all select-none cursor-pointer"
                  title={`Call Customer: ${customerPhone}`}
                >
                  <Phone className="w-5 h-5 fill-white/20 stroke-[2.4]" />
                </a>
              )}
            </div>
          </>
        ) : isPreparing ? (
          <>
            {/* PREPARING: Row 1 (View Details) & Row 2 (Food Ready + Call on right) */}
            {onViewDetails && (
              <button
                type="button"
                onClick={() => onViewDetails(order)}
                className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-98 transition-all cursor-pointer select-none"
              >
                <span>View Details</span>
              </button>
            )}

            <div className="flex items-center gap-2.5 w-full">
              {onMarkReady && (
                <button
                  type="button"
                  onClick={() => onMarkReady(order)}
                  className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-md shadow-emerald-500/25 active:scale-98 transition-all cursor-pointer select-none"
                >
                  <CheckCircle2 className="w-5 h-5 stroke-[2.4]" />
                  <span>Food Ready for Pickup</span>
                </button>
              )}

              {customerPhone && (
                <a
                  href={`tel:${customerPhone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="w-12 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/25 active:scale-95 transition-all select-none cursor-pointer"
                  title={`Call Customer: ${customerPhone}`}
                >
                  <Phone className="w-5 h-5 fill-white/20 stroke-[2.4]" />
                </a>
              )}
            </div>
          </>
        ) : isReady ? (
          <>
            {/* READY: Row 1 (View Details) & Row 2 (Awaiting Rider + Call on right) */}
            {onViewDetails && (
              <button
                type="button"
                onClick={() => onViewDetails(order)}
                className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-98 transition-all cursor-pointer select-none"
              >
                <span>View Details</span>
              </button>
            )}

            <div className="flex items-center gap-2.5 w-full">
              <div className="flex-1 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-xs select-none">
                <Bike className="w-5 h-5 text-emerald-600 dark:text-emerald-400 animate-bounce" />
                <span>Awaiting Rider Pickup</span>
              </div>

              {(order.delivery_boy?.mobile || customerPhone) && (
                <a
                  href={`tel:${order.delivery_boy?.mobile || customerPhone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="w-12 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/25 active:scale-95 transition-all select-none cursor-pointer"
                  title={order.delivery_boy ? `Call Rider: ${order.delivery_boy.name}` : `Call Customer: ${customerPhone}`}
                >
                  <Phone className="w-5 h-5 fill-white/20 stroke-[2.4]" />
                </a>
              )}
            </div>
          </>
        ) : isOutForDelivery ? (
          <>
            {/* OUT FOR DELIVERY: Row 1 (View Details) & Row 2 (Time & Distance Action Bar + Call Rider) */}
            {onViewDetails && (
              <button
                type="button"
                onClick={() => onViewDetails(order)}
                className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-98 transition-all cursor-pointer select-none"
              >
                <span>View Details</span>
              </button>
            )}

            <div className="flex items-center gap-2.5 w-full">
              <div className="flex-1 h-12 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50/80 dark:from-blue-950/40 dark:to-indigo-950/30 text-[#113BD0] dark:text-blue-300 border border-blue-200/90 dark:border-blue-800/50 px-3.5 flex items-center justify-between shadow-xs select-none">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-[#113BD0] text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Bike className="w-4 h-4 animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-wider block text-blue-700 dark:text-blue-400 leading-none">
                      Out for Delivery
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block mt-0.5">
                      {order.delivery_boy?.name || 'Rider on the way'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-black shrink-0 text-slate-700 dark:text-slate-200 bg-white/80 dark:bg-slate-900/60 px-2.5 py-1 rounded-lg border border-blue-100 dark:border-blue-900/40 shadow-2xs">
                  <span className="flex items-center gap-1 text-[#113BD0] dark:text-blue-400">
                    <Clock className="w-3.5 h-3.5 stroke-[2.3]" />
                    ~{order.estimated_delivery_minutes || 15}m
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">&bull;</span>
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <MapPin className="w-3.5 h-3.5 stroke-[2.3]" />
                    {order.distance_km || '2.4'} km
                  </span>
                </div>
              </div>

              {(order.delivery_boy?.mobile || customerPhone) && (
                <a
                  href={`tel:${order.delivery_boy?.mobile || customerPhone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="w-12 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/25 active:scale-95 transition-all select-none cursor-pointer"
                  title={order.delivery_boy ? `Call Rider: ${order.delivery_boy.name}` : `Call Customer: ${customerPhone}`}
                >
                  <Phone className="w-5 h-5 fill-white/20 stroke-[2.4]" />
                </a>
              )}
            </div>
          </>
        ) : (
          /* COMPLETED / OTHER STATUSES (DELIVERED / CANCELLED) */
          <div className="flex items-center gap-2.5 w-full">
            {onViewDetails && (
              <button
                type="button"
                onClick={() => onViewDetails(order)}
                className="flex-1 h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-98 transition-all cursor-pointer select-none"
              >
                <span>View Details</span>
              </button>
            )}

            {customerPhone && (
              <a
                href={`tel:${customerPhone}`}
                onClick={(e) => e.stopPropagation()}
                className="w-11 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs active:scale-95 transition-all select-none cursor-pointer"
                title={`Call Customer: ${customerPhone}`}
              >
                <Phone className="w-4 h-4 fill-white/20 stroke-[2.4]" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default OrderCard
