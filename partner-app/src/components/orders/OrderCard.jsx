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

          {/* Right: Bill Total & Payment Method Pill */}
          <div className="text-right shrink-0">
            <div className="text-base sm:text-xl font-black text-slate-900 dark:text-slate-100 leading-tight">
              {formatCurrency(order.bill?.total_amount || order.total_amount)}
            </div>
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md border mt-1 select-none ${
                isPaid
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/40'
                  : isCod
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/40'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-amber-500'}`} />
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
              <span className="text-[11px] text-slate-400">
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
            <span className="text-[#2845D6] dark:text-blue-400 font-bold">
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
                  <span className="px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-[#2845D6] dark:text-blue-400 font-black text-xs shrink-0">
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

      {/* 3. Action Buttons Footer Bar */}
      <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-700/70 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between gap-2.5 flex-wrap">
        {onViewDetails && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(order)}
            className="text-xs"
          >
            View Details
          </Button>
        )}

        {/* PENDING: Reject & Accept Actions */}
        {isPending && (
          <div className="flex items-center gap-2 ml-auto">
            {onReject && (
              <Button
                variant="dangerOutline"
                size="sm"
                icon={XCircle}
                onClick={() => onReject(order)}
              >
                Reject
              </Button>
            )}
            {onAccept && (
              <Button
                variant="primary"
                size="sm"
                icon={CheckCircle2}
                onClick={() => onAccept(order)}
                className="shadow-sm font-bold"
              >
                Accept Order
              </Button>
            )}
          </div>
        )}

        {/* PREPARING: Mark Ready Action */}
        {isPreparing && onMarkReady && (
          <div className="ml-auto">
            <Button
              variant="success"
              size="sm"
              icon={CheckCircle2}
              onClick={() => onMarkReady(order)}
              className="shadow-sm font-bold"
            >
              Food Ready for Pickup
            </Button>
          </div>
        )}

        {/* READY_FOR_PICKUP: Rider Waiting Badge */}
        {isReady && (
          <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 text-xs font-bold">
            <Bike className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-bounce" />
            <span>Awaiting Rider Pickup</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrderCard
