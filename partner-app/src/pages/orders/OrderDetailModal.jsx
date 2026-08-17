import React from 'react'
import {
  Clock,
  User,
  Phone,
  MapPin,
  Bike,
  CreditCard,
  Utensils,
  CheckCircle,
  XCircle,
  FileText,
} from 'lucide-react'
import { formatCurrency, formatDateTime, formatTime, formatPhone } from '../../utils/formatters'
import Modal from '../../components/common/Modal'
import StatusBadge from '../../components/common/StatusBadge'
import Button from '../../components/common/Button'

export const OrderDetailModal = ({ isOpen, onClose, order, onAccepted }) => {
  if (!order) return null

  const items = order.items || []
  const bill = order.bill || {}
  const timeline = order.status_history || []

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Order Details #${order.order_number}`}
      subtitle={`Placed on ${formatDateTime(order.placed_at || order.created_at)}`}
      maxWidth="max-w-xl"
    >
      <div className="space-y-5 text-left">
        {/* Status & Total Banner */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
              Current Status
            </span>
            <StatusBadge status={order.status} size="md" />
          </div>
          <div className="text-right">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
              Total Bill
            </span>
            <span className="text-xl font-black text-slate-900">
              {formatCurrency(bill.total_amount || order.total_amount)}
            </span>
          </div>
        </div>

        {/* Customer Information */}
        <div className="p-4 rounded-2xl border border-slate-200/80 space-y-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-[#2845D6]" />
            <span>Customer & Delivery Details</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            <div>
              <span className="text-slate-400 block">Customer Name</span>
              <span className="font-bold text-slate-800">{order.customer?.name || 'Valued Customer'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Contact Phone</span>
              <span className="font-bold text-slate-800 font-mono">
                {formatPhone(order.customer?.mobile)}
              </span>
            </div>
            {order.delivery_address && (
              <div className="sm:col-span-2">
                <span className="text-slate-400 block">Delivery Address</span>
                <span className="font-bold text-slate-800 leading-snug block mt-0.5">
                  {typeof order.delivery_address === 'string'
                    ? order.delivery_address
                    : order.delivery_address.formatted_address ||
                      `${order.delivery_address.house_number || ''} ${order.delivery_address.address_line1 || ''}, ${order.delivery_address.city || ''}`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Utensils className="w-3.5 h-3.5 text-[#2845D6]" />
            <span>Items Ordered ({items.length})</span>
          </h4>
          <div className="rounded-2xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden">
            {items.map((it, idx) => (
              <div key={idx} className="p-3 bg-white flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-md bg-slate-100 font-bold text-slate-800 flex items-center justify-center text-[11px] shrink-0">
                    {it.quantity}×
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${it.is_veg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <span className="font-bold text-slate-800 text-sm">{it.item_name || it.name}</span>
                    </div>
                    {it.variant_name && (
                      <p className="text-[11px] text-slate-500 mt-0.5">Size/Variant: <strong>{it.variant_name}</strong></p>
                    )}
                    {it.addons && it.addons.length > 0 && (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Addons: {it.addons.map((a) => a.addon_name || a.name).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
                <span className="font-mono font-bold text-slate-800 shrink-0">
                  {formatCurrency(it.total_price || it.price * (it.quantity || 1))}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bill Breakdown */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
          <div className="flex justify-between text-slate-500">
            <span>Items Subtotal:</span>
            <span className="font-mono font-bold text-slate-800">{formatCurrency(bill.subtotal || order.subtotal)}</span>
          </div>
          {Number(bill.discount_amount) > 0 && (
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span>Merchant Discount:</span>
              <span className="font-mono">-{formatCurrency(bill.discount_amount)}</span>
            </div>
          )}
          {Number(bill.tax_amount) > 0 && (
            <div className="flex justify-between text-slate-500">
              <span>Taxes:</span>
              <span className="font-mono">{formatCurrency(bill.tax_amount)}</span>
            </div>
          )}
          <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
            <span>Total Amount:</span>
            <span className="font-mono">{formatCurrency(bill.total_amount || order.total_amount)}</span>
          </div>
          {Number(bill.restaurant_payout_amount) > 0 && (
            <div className="pt-1 text-[11px] flex justify-between text-emerald-700 font-bold border-t border-dashed border-slate-200">
              <span>Estimated Net Restaurant Payout:</span>
              <span className="font-mono">{formatCurrency(bill.restaurant_payout_amount)}</span>
            </div>
          )}
        </div>

        {/* Delivery Rider Details if Assigned */}
        {order.delivery_boy && (
          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <Bike className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Assigned Rider</span>
                <span className="font-bold text-slate-900 text-sm">{order.delivery_boy.name}</span>
              </div>
            </div>
            {order.delivery_boy.mobile && (
              <a
                href={`tel:${order.delivery_boy.mobile}`}
                className="px-3 py-1.5 rounded-xl bg-white border border-blue-200 text-blue-700 font-bold text-xs flex items-center gap-1.5 shadow-xs"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Rider</span>
              </a>
            )}
          </div>
        )}

        {/* Order Status History Timeline */}
        {timeline.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#2845D6]" />
              <span>Status History</span>
            </h4>
            <div className="p-3 rounded-2xl border border-slate-200/80 bg-white space-y-2 text-xs">
              {timeline.map((h, i) => (
                <div key={i} className="flex items-center justify-between text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#2845D6]" />
                    <span className="font-bold text-slate-800">{h.status || h.status_label}</span>
                    {h.comment && <span className="text-slate-400 text-[11px]">({h.comment})</span>}
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">{formatTime(h.created_at)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Close Action */}
        <div className="pt-2 flex justify-end">
          <Button variant="outline" size="md" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default OrderDetailModal
