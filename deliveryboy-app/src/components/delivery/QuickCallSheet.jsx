import React, { useState } from 'react'
import {
  Phone,
  MessageCircle,
  Copy,
  Check,
  MapPin,
  User,
  Store,
  Navigation,
} from 'lucide-react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import {
  makePhoneCall,
  openWhatsAppMessage,
  copyToClipboard,
  openGoogleMapsNavigation,
} from '../../utils/geo'
import { useToast } from '../../context/ToastContext'

export const QuickCallSheet = ({
  isOpen,
  onClose,
  contactType = 'CUSTOMER', // 'CUSTOMER' | 'RESTAURANT'
  name,
  phone,
  address,
  landmark,
  latitude,
  longitude,
  orderNumber,
}) => {
  const toast = useToast()
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const isCustomer = contactType === 'CUSTOMER'

  const quickMessages = isCustomer
    ? [
        `Hello ${name || 'Sir/Mam'}, I am your Dastak delivery partner for order #${orderNumber}. I have arrived at your delivery address.`,
        `Hello, I am on the way with your Dastak food order #${orderNumber}. Please keep cash ready if COD.`,
        `Hello, I am near your building. Please guide me regarding the flat/door number.`,
      ]
    : [
        `Hello, this is Dastak rider for order #${orderNumber}. Is the food package ready for pickup?`,
        `Hello, I will be reaching the restaurant in 3 minutes for pickup #${orderNumber}.`,
      ]

  const handleCopy = async () => {
    const success = await copyToClipboard(address)
    if (success) {
      setCopied(true)
      toast.success('Address Copied', 'Delivery address copied to clipboard.')
      setTimeout(() => setCopied(false), 2500)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCustomer ? 'Contact Customer' : 'Contact Restaurant Kitchen'}
      subtitle={`Order #${orderNumber}`}
      maxWidth="max-w-md"
    >
      <div className="space-y-4 text-xs">
        {/* Contact Info Header Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shrink-0 ${
                isCustomer ? 'bg-[#F97316]' : 'bg-[#2845D6]'
              }`}
            >
              {isCustomer ? <User className="w-6 h-6" /> : <Store className="w-6 h-6" />}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                {isCustomer ? 'CUSTOMER' : 'RESTAURANT OUTLET'}
              </span>
              <h4 className="text-base font-black text-slate-900 dark:text-slate-100 truncate">
                {name || (isCustomer ? 'Customer' : 'Kitchen')}
              </h4>
              <p className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                {phone || 'Not available'}
              </p>
            </div>
          </div>
        </div>

        {/* Primary 1-Tap Action Buttons: Direct Phone Call & WhatsApp */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              makePhoneCall(phone)
              onClose()
            }}
            className="p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
          >
            <Phone className="w-5 h-5" />
            <span>Call Now</span>
          </button>

          <button
            type="button"
            onClick={() => {
              openWhatsAppMessage(phone, quickMessages[0])
              onClose()
            }}
            className="p-3.5 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] active:scale-95 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <MessageCircle className="w-5 h-5" />
            <span>WhatsApp Chat</span>
          </button>
        </div>

        {/* Quick WhatsApp Template Chips */}
        {phone && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 block">
              Quick 1-Tap WhatsApp Messages:
            </span>
            <div className="space-y-1.5">
              {quickMessages.map((msg, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    openWhatsAppMessage(phone, msg)
                    onClose()
                  }}
                  className="w-full text-left p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-[11px] text-slate-700 dark:text-slate-300 font-medium transition-colors"
                >
                  "{msg}"
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Full Address Details Card with Copy & Map Button */}
        {address && (
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-red-500" /> Location & Landmark
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] font-bold text-[#2845D6] dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
              {address}
            </p>

            {landmark && (
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-900 dark:text-amber-300 text-[11px] font-bold">
                🚩 Landmark: {landmark}
              </div>
            )}

            <div className="pt-1">
              <Button
                variant="outline"
                size="sm"
                icon={Navigation}
                onClick={() => openGoogleMapsNavigation(latitude, longitude, address)}
                className="w-full text-xs font-bold"
              >
                Open in Google Maps Navigation
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default QuickCallSheet
