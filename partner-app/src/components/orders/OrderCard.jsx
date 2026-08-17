import React from 'react'
import { Clock, AlertTriangle, CheckCircle, XCircle, ChevronRight, Utensils, MessageSquare, Bike, User } from 'lucide-react'
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

  return (
    <div
      className={`rounded-3xl bg-white border transition-all duration-200 shadow-xs overflow-hidden ${
        isCritical
          ? 'border-rose-400 ring-2 ring-rose-300/40 shadow-rose-500/10'
          : isUrgent
          ? 'border-amber-400 ring-2 ring-amber-300/40 shadow-amber-500/10'
          : 'border-slate-200/90 hover:border-slate-300'
      }`}
    >
      {/* Top Header Strip */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#2845D6]/10 text-[#2845D6] font-black flex items-center justify-center text-sm shadow-xs">
            #{order.order_number?.replace('ORD-', '') || order.id}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 leading-tight">
                {order.order_number}
              </h3>
              <StatusBadge status={order.status} size="xs" />
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 font-medium">
              <span>{formatTime(placedAt)}</span>
              <span>&bull;</span>
              <span
                className={`flex items-center gap-1 font-bold ${
                  isCritical ? 'text-rose-600 font-black animate-pulse' : isUrgent ? 'text-amber-600 font-bold' : 'text-slate-500'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                {formatElapsedTime(placedAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Bill Total & Payment Mode Badge */}
        <div className="text-right sm:ml-auto">
          <div className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
            {formatCurrency(order.bill?.total_amount || order.total_amount)}
          </div>
          <span
            className={`inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border mt-0.5 ${
              order.payment_status === 'COMPLETED' || order.payment_status === 'PAID'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {order.payment_mode === 'COD' || order.payment_mode === 'CASH_ON_DELIVERY' ? '💵 Cash on Delivery' : '💳 Online Paid'}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Customer Information Preview */}
        <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100/80">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            <span className="font-bold text-slate-800">{order.customer?.name || 'Valued Customer'}</span>
          </div>
          {order.customer?.mobile && (
            <span className="text-[11px] font-mono text-slate-500">{order.customer.mobile}</span>
          )}
        </div>

        {/* Items List Breakdown */}
        <div className="space-y-2">
          <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase flex items-center justify-between">
            <span>Order Items ({itemCount})</span>
            {order.estimated_delivery_minutes > 0 && (
              <span className="text-[#2845D6] font-bold">Prep Time: ~{order.estimated_delivery_minutes}m</span>
            )}
          </div>
          <div className="divide-y divide-slate-100">
            {items.map((item, idx) => (
              <div key={idx} className="py-2 flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-md bg-slate-100 font-bold text-slate-800 flex items-center justify-center text-[11px] shrink-0">
                    {item.quantity}×
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${item.is_veg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <span className="font-bold text-slate-800 text-sm">{item.item_name || item.name}</span>
                    </div>
                    {item.variant_name && (
                      <p className="text-[11px] text-slate-500 mt-0.5">Size/Variant: <strong>{item.variant_name}</strong></p>
                    )}
                    {item.addons && item.addons.length > 0 && (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Addons: {item.addons.map((a) => a.addon_name || a.name).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
                <span className="font-mono font-bold text-slate-700 shrink-0">
                  {formatCurrency(item.total_price || item.price * (item.quantity || 1))}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Special Instructions banner if present */}
        {order.special_instructions && (
          <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <MessageSquare className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold block text-[11px] uppercase tracking-wider">Chef Note / Customer Request</span>
              <p className="mt-0.5 text-xs font-semibold leading-relaxed">{order.special_instructions}</p>
            </div>
          </div>
        )}
      </div>

      {/* Card Action Buttons */}
      <div className="p-4 sm:p-5 pt-0 flex flex-col sm:flex-row items-center gap-2.5 border-t border-slate-100 bg-white">
        {/* Detail Button */}
        {onViewDetails && (
          <Button
            variant="outline"
            size="md"
            onClick={() => onViewDetails(order)}
            className="w-full sm:w-auto"
          >
            Details
          </Button>
        )}

        {/* Action: PENDING state -> ACCEPT & REJECT */}
        {isPending && (
          <div className="flex items-center gap-2.5 w-full sm:ml-auto">
            {onReject && (
              <Button
                variant="dangerOutline"
                size="lg"
                icon={XCircle}
                onClick={() => onReject(order)}
                className="w-1/3 sm:w-auto flex-1 sm:flex-none"
              >
                Reject
              </Button>
            )}
            {onAccept && (
              <Button
                variant="primary"
                size="lg"
                icon={CheckCircle}
                onClick={() => onAccept(order)}
                className="w-2/3 sm:w-auto flex-1 shadow-md shadow-blue-500/20 text-sm font-black"
              >
                Accept Order
              </Button>
            )}
          </div>
        )}

        {/* Action: CONFIRMED/PREPARING state -> READY FOR PICKUP */}
        {isPreparing && onMarkReady && (
          <div className="w-full sm:ml-auto">
            <Button
              variant="success"
              size="lg"
              icon={CheckCircle}
              onClick={() => onMarkReady(order)}
              className="w-full shadow-md shadow-emerald-500/20 text-sm font-black"
            >
              Food Ready for Pickup
            </Button>
          </div>
        )}

        {/* Action: READY_FOR_PICKUP state */}
        {isReady && (
          <div className="w-full sm:ml-auto flex items-center justify-between p-3 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
            <span className="flex items-center gap-2">
              <Bike className="w-4 h-4 text-emerald-600 animate-bounce" />
              <span>Awaiting Rider for Pickup</span>
            </span>
            {order.delivery_boy?.name && (
              <span className="text-[11px] text-emerald-900 font-extrabold">
                Rider: {order.delivery_boy.name}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default OrderCard
