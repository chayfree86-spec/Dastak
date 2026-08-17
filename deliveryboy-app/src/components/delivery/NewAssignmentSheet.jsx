import React from 'react'
import {
  Bell,
  Store,
  User,
  MapPin,
  Banknote,
  CheckCircle2,
  Navigation,
  ArrowRight,
  Zap,
} from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'
import Modal from '../common/Modal'
import Button from '../common/Button'

export const NewAssignmentSheet = ({ order, onClose, onAcknowledge }) => {
  if (!order) return null

  const isCod = order.payment_mode === 'COD' || order.payment_mode === 'CASH_ON_DELIVERY'
  const totalAmount = order.bill?.total_amount || order.total_amount || 0
  const restaurant = order.restaurant || {}
  const customer = order.customer || order.delivery_address || {}

  return (
    <Modal
      isOpen={!!order}
      onClose={onClose}
      showClose={false}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4 p-1">
        {/* Animated Glow Header */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#2845D6] to-[#1E3A8A] text-white flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center animate-bounce">
              <Zap className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-200 block">
                NEW TRIP ASSIGNED
              </span>
              <h3 className="text-lg font-black tracking-tight">
                Order #{order.order_number}
              </h3>
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-black">{formatCurrency(totalAmount)}</span>
            <span className="block text-[10px] font-bold text-blue-200 uppercase">
              {isCod ? 'Cash on Delivery' : 'Online Paid'}
            </span>
          </div>
        </div>

        {/* 2-Step Trip Path Preview */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-3">
          {/* Pickup Step */}
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950 text-[#2845D6] dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              1
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                PICKUP RESTAURANT
              </span>
              <h5 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 truncate">
                {restaurant.name || 'Kitchen Partner'}
              </h5>
              <p className="text-[11px] text-slate-500 truncate">
                {restaurant.address_line1 || restaurant.address || 'Kanpur'}
              </p>
            </div>
          </div>

          <div className="w-0.5 h-4 bg-slate-200 dark:bg-slate-700 ml-3.5" />

          {/* Drop Step */}
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-orange-100 dark:bg-orange-950 text-[#F97316] dark:text-orange-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              2
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                DELIVER TO CUSTOMER
              </span>
              <h5 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 truncate">
                {customer.name || customer.customer_name || 'Customer'}
              </h5>
              <p className="text-[11px] text-slate-500 truncate">
                {order.delivery_address?.address || 'Customer Location'}
              </p>
            </div>
          </div>
        </div>

        {/* Primary Acknowledge Action (Strict Rule: No Reject Button) */}
        <div className="pt-2">
          <Button
            variant="primary"
            size="xl"
            icon={CheckCircle2}
            onClick={() => {
              if (onAcknowledge) onAcknowledge(order)
              onClose()
            }}
            className="w-full shadow-lg"
          >
            Start Delivery Trip
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default NewAssignmentSheet
