import React, { useState } from 'react'
import {
  Navigation,
  Phone,
  Store,
  User,
  MapPin,
  Clock,
  CheckCircle2,
  Package,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Banknote,
  Bike,
  MessageCircle,
  ExternalLink,
} from 'lucide-react'
import { formatCurrency, formatTime, formatElapsedTime } from '../../utils/formatters'
import { openGoogleMapsNavigation, makePhoneCall } from '../../utils/geo'
import Button from '../common/Button'
import StatusBadge from '../common/StatusBadge'
import ReportIssueModal from './ReportIssueModal'
import OtpVerifyModal from './OtpVerifyModal'
import QuickCallSheet from './QuickCallSheet'
import DeliveryRouteMap from './DeliveryRouteMap'
import FullscreenNavModal from './FullscreenNavModal'
import deliveryApi from '../../api/delivery.api'
import { useToast } from '../../context/ToastContext'

export const ActiveDeliveryCard = ({ order, onRefresh }) => {
  const toast = useToast()
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [verifyModalOpen, setVerifyModalOpen] = useState(false)
  const [pickupLoading, setPickupLoading] = useState(false)
  const [fullscreenNavOpen, setFullscreenNavOpen] = useState(false)
  const [navTargetType, setNavTargetType] = useState('RESTAURANT') // 'RESTAURANT' | 'CUSTOMER'

  // Quick Contact Sheet State
  const [callSheetState, setCallSheetState] = useState({
    isOpen: false,
    contactType: 'CUSTOMER',
    name: '',
    phone: '',
    address: '',
    landmark: '',
    latitude: null,
    longitude: null,
  })

  if (!order) return null

  const isAssigned = order.status === 'CONFIRMED' || order.status === 'PREPARING' || order.status === 'ASSIGNED'
  const isReady = order.status === 'READY_FOR_PICKUP'
  const isOutForDelivery = order.status === 'OUT_FOR_DELIVERY'

  const restaurant = order.restaurant || {}
  const customer = order.customer || order.delivery_address || {}
  const deliveryAddress = order.delivery_address?.address || order.delivery_address_json?.address || ''
  const restaurantAddress = restaurant.address_line1 || restaurant.address || ''
  const landmark = order.delivery_address?.landmark || order.delivery_address_json?.landmark || ''

  const isCod = order.payment_mode === 'COD' || order.payment_mode === 'CASH_ON_DELIVERY'
  const totalAmount = order.bill?.total_amount || order.total_amount || 0
  const items = order.items || []

  // Pickup Order Handler
  const handlePickup = async () => {
    setPickupLoading(true)
    try {
      await deliveryApi.pickupOrder(order.order_number)
      toast.success('Order Picked Up!', 'Now heading to customer delivery location.')
      if (onRefresh) onRefresh()
    } catch (err) {
      toast.error('Pickup Failed', err.message || 'Restaurant has not marked order ready.')
    } finally {
      setPickupLoading(false)
    }
  }

  // Open Contact Dialog for Customer
  const handleOpenCustomerCall = () => {
    setCallSheetState({
      isOpen: true,
      contactType: 'CUSTOMER',
      name: customer.name || customer.customer_name || 'Customer',
      phone: customer.mobile || customer.customer_phone || customer.phone || '9876501234',
      address: deliveryAddress,
      landmark: landmark,
      latitude: order.delivery_address?.latitude || order.delivery_address_json?.latitude,
      longitude: order.delivery_address?.longitude || order.delivery_address_json?.longitude,
    })
  }

  // Open Contact Dialog for Restaurant
  const handleOpenRestaurantCall = () => {
    setCallSheetState({
      isOpen: true,
      contactType: 'RESTAURANT',
      name: restaurant.name || 'Partner Kitchen',
      phone: restaurant.phone || '9888800001',
      address: restaurantAddress,
      landmark: 'Near Central Crossing',
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
    })
  }

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-850 border-2 border-[#2845D6]/30 dark:border-blue-500/30 shadow-xl overflow-hidden flex flex-col justify-between transition-all">
      {/* 1. Header Bar: Active Badge & Order Number & Timer */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-50/90 to-indigo-50/80 dark:from-slate-900/90 dark:to-slate-850 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-lg bg-[#2845D6] text-white text-[10px] font-black uppercase tracking-wider">
              ACTIVE TRIP
            </span>
            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
              #{order.order_number}
            </span>
            <StatusBadge status={order.status} size="xs" />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <Clock className="w-3.5 h-3.5 text-[#2845D6] dark:text-blue-400" />
            <span>Assigned {formatElapsedTime(order.placed_at || order.created_at)}</span>
          </div>
        </div>

        {/* Amount Pill */}
        <div className="text-right shrink-0">
          <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
            {formatCurrency(totalAmount)}
          </div>
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md border mt-0.5 ${
              isCod
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isCod ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            {isCod ? 'COD (Cash)' : 'Online Paid'}
          </span>
        </div>
      </div>

      {/* 2. Interactive Route Map Preview */}
      <div className="p-4 sm:p-5 pb-0">
        <DeliveryRouteMap
          order={order}
          isOutForDelivery={isOutForDelivery}
          onOpenFullscreen={() => {
            setNavTargetType(isOutForDelivery ? 'CUSTOMER' : 'RESTAURANT')
            setFullscreenNavOpen(true)
          }}
        />
      </div>

      {/* 3. Operational Step-by-Step Cards (Pickup & Drop) */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Step A: Restaurant Details Card */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            !isOutForDelivery
              ? 'bg-blue-50/50 dark:bg-slate-900/80 border-blue-200 dark:border-blue-800/60 ring-2 ring-blue-500/10 shadow-xs'
              : 'bg-slate-50/60 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700/60 opacity-80'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <Store className="w-3.5 h-3.5" />
                <span>STEP 1: PICKUP FROM RESTAURANT</span>
              </span>
              <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 truncate">
                {restaurant.name || 'Dastak Partner Kitchen'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                {restaurantAddress || 'Kanpur Main Outlet'}
              </p>
            </div>

            {/* Quick Action Navigation & Call Restaurant */}
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 shrink-0 pt-2 sm:pt-0">
              <button
                type="button"
                onClick={handleOpenRestaurantCall}
                className="w-full sm:w-auto px-3 sm:px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 shadow-xs flex items-center justify-center gap-1.5 font-bold text-xs cursor-pointer touch-manipulation"
                title="Call & Message Restaurant"
              >
                <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="truncate">Call Kitchen</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setNavTargetType('RESTAURANT')
                  setFullscreenNavOpen(true)
                }}
                className="w-full sm:w-auto px-3 sm:px-3.5 py-2.5 rounded-xl bg-[#2845D6] hover:bg-[#F97316] text-white shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5 font-bold text-xs cursor-pointer touch-manipulation"
                title="Open Fullscreen In-App Navigation Map"
              >
                <Navigation className="w-4 h-4 fill-white" />
                <span>Navigate</span>
              </button>
            </div>
          </div>

          {/* Kitchen Order Status Banner */}
          {!isOutForDelivery && (
            <div className="mt-3 pt-3 border-t border-blue-100 dark:border-slate-700/60 flex items-center justify-between text-xs flex-wrap gap-1">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                {items.length} Item{items.length !== 1 ? 's' : ''} in package
              </span>
              {isReady ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-black flex items-center gap-1 animate-pulse">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Order Ready on Counter!
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Kitchen preparing items...
                </span>
              )}
            </div>
          )}
        </div>

        {/* Step B: Customer Delivery Details Card */}
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
            isOutForDelivery
              ? 'bg-orange-50/50 dark:bg-slate-900/90 border-orange-200 dark:border-orange-800/60 ring-2 ring-orange-500/15 shadow-md'
              : 'bg-slate-50/40 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700/60 opacity-80'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  <span>STEP 2: DELIVER TO CUSTOMER</span>
                </span>

                {/* Prominent Payment Type Badge */}
                {isCod ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-900 dark:text-amber-200 text-[10px] font-black">
                    <Banknote className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span>COD: Collect {formatCurrency(totalAmount)}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-800 dark:text-emerald-200 text-[10px] font-black">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>PREPAID (Paid Online)</span>
                  </span>
                )}
              </div>

              <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 truncate">
                {customer.name || customer.customer_name || 'Valued Customer'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                {deliveryAddress || 'Customer Delivery Address'}
              </p>
              {landmark && (
                <span className="inline-block text-[11px] font-bold text-amber-700 dark:text-amber-300">
                  🚩 {landmark}
                </span>
              )}
            </div>

            {/* Quick Actions Call & Navigate Customer */}
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 shrink-0 pt-2 sm:pt-0">
              <button
                type="button"
                onClick={handleOpenCustomerCall}
                className="w-full sm:w-auto px-3 sm:px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 shadow-xs flex items-center justify-center gap-1.5 font-bold text-xs cursor-pointer touch-manipulation"
                title="Call & Message Customer"
              >
                <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="truncate">Call Customer</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setNavTargetType('CUSTOMER')
                  setFullscreenNavOpen(true)
                }}
                className="w-full sm:w-auto px-3 sm:px-3.5 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#2845D6] text-white shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 font-bold text-xs cursor-pointer touch-manipulation"
                title="Open Fullscreen In-App Navigation Map"
              >
                <Navigation className="w-4 h-4 fill-white" />
                <span>Navigate</span>
              </button>
            </div>
          </div>

          {/* Prominent COD Callout Banner when Out for Delivery */}
          {isOutForDelivery && isCod && (
            <div className="mt-3 p-3.5 rounded-xl bg-amber-500/15 border border-amber-400/40 dark:border-amber-500/40 text-amber-950 dark:text-amber-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Banknote className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider block">
                    CASH ON DELIVERY (MANDATORY CASH COLLECTION)
                  </span>
                  <span className="text-base font-black">
                    Please collect {formatCurrency(totalAmount)} in cash
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Bottom Sticky Action Area */}
      <div className="p-4 sm:p-5 bg-slate-50/90 dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-700 flex flex-col gap-2.5">
        {/* State A: Before Pickup (Pick up order) */}
        {!isOutForDelivery && (
          <Button
            variant={isReady ? 'success' : 'primary'}
            size="xl"
            icon={Package}
            loading={pickupLoading}
            onClick={handlePickup}
            className="w-full shadow-lg text-base sm:text-lg"
          >
            {isReady ? 'Order Ready — Confirm Picked Up' : 'Picked Up from Restaurant'}
          </Button>
        )}

        {/* State B: Out for Delivery (Verify & Complete Delivery) */}
        {isOutForDelivery && (
          <Button
            variant="success"
            size="xl"
            icon={CheckCircle2}
            onClick={() => setVerifyModalOpen(true)}
            className="w-full shadow-lg shadow-emerald-600/25 text-base sm:text-lg font-black"
          >
            {isCod ? `Collect ${formatCurrency(totalAmount)} & Deliver` : 'Verify OTP & Mark Delivered'}
          </Button>
        )}

        {/* Secondary Utility: Report Delivery Issue */}
        <div className="flex items-center justify-between text-xs pt-1">
          <button
            type="button"
            onClick={() => setReportModalOpen(true)}
            className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Report Delivery Issue</span>
          </button>
          <span className="text-slate-400 text-[11px]">
            {isOutForDelivery ? 'Step 2 of 2: Customer drop' : 'Step 1 of 2: Restaurant pickup'}
          </span>
        </div>
      </div>

      {/* Quick Call & WhatsApp Bottom Sheet */}
      <QuickCallSheet
        isOpen={callSheetState.isOpen}
        onClose={() => setCallSheetState((prev) => ({ ...prev, isOpen: false }))}
        contactType={callSheetState.contactType}
        name={callSheetState.name}
        phone={callSheetState.phone}
        address={callSheetState.address}
        landmark={callSheetState.landmark}
        latitude={callSheetState.latitude}
        longitude={callSheetState.longitude}
        orderNumber={order.order_number}
      />

      {/* Issue Report Modal */}
      <ReportIssueModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        order={order}
      />

      {/* OTP Delivery Verification Modal */}
      <OtpVerifyModal
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        order={order}
        onSuccess={() => {
          setVerifyModalOpen(false)
          if (onRefresh) onRefresh()
        }}
      />

      {/* Fullscreen In-App Interactive Navigation Map Modal */}
      <FullscreenNavModal
        isOpen={fullscreenNavOpen}
        onClose={() => setFullscreenNavOpen(false)}
        order={order}
        isOutForDelivery={isOutForDelivery}
        targetType={navTargetType}
      />
    </div>
  )
}

export default ActiveDeliveryCard
