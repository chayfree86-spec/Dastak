import React, { useState } from 'react'
import {
  X,
  Star,
  Store,
  Bike,
  CheckCircle2,
  ThumbsUp,
  MessageSquare,
  Send,
  Loader2,
  Award,
} from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { useToast } from '../../context/ToastContext'
import customerApi from '../../api/customer.api'
import Button from './Button'

export const RatingModal = ({ isOpen, onClose, order, onReviewSuccess }) => {
  const { t, lang } = useLanguage()
  const toast = useToast()

  const [foodRating, setFoodRating] = useState(5)
  const [deliveryRating, setDeliveryRating] = useState(5)
  const [hoverFoodRating, setHoverFoodRating] = useState(0)
  const [hoverDeliveryRating, setHoverDeliveryRating] = useState(0)
  const [selectedTags, setSelectedTags] = useState([])
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  if (!isOpen || !order) return null

  const restaurantName =
    order.restaurant?.name || (lang === 'hi' ? 'दस्तक पार्टनर रेस्टोरेंट' : 'Partner Kitchen')
  const riderName =
    order.delivery_boy?.name ||
    order.delivery_boy_profile?.user?.name ||
    (lang === 'hi' ? 'डिलीवरी राइडर' : 'Delivery Rider')

  const foodLabels = {
    1: t.ratingPoor || 'Poor',
    2: t.ratingFair || 'Fair',
    3: t.ratingGood || 'Good',
    4: t.ratingVeryGood || 'Very Good',
    5: t.ratingExcellent || (lang === 'hi' ? 'लाजवाब और स्वादिष्ट!' : 'Delicious & Excellent!'),
  }

  const riderLabels = {
    1: t.riderSlow || 'Slow / Needs Care',
    2: t.riderFair || 'Satisfactory',
    3: t.riderGood || 'Good Delivery',
    4: t.riderVeryGood || 'Polite & Fast',
    5: t.riderSuperb || (lang === 'hi' ? 'शानदार और समय पर!' : 'Superb & Courteous!'),
  }

  const quickTags = [
    { id: 'hot_food', label: t.tagHotFood || '🔥 Hot & Fresh Food' },
    { id: 'tasty', label: t.tagDeliciousTaste || '😋 Delicious Taste' },
    { id: 'packaging', label: t.tagGreatPackaging || '📦 Perfect Packaging' },
    { id: 'fast', label: t.tagSuperfastDelivery || '⚡ Superfast Delivery' },
    { id: 'polite', label: t.tagPoliteRider || '🤝 Polite Rider' },
    { id: 'accurate', label: t.tagAccurateOrder || '✅ Accurate Items' },
  ]

  const toggleTag = (label) => {
    setSelectedTags((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    )
  }

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (!foodRating || foodRating < 1) {
      toast.warning(lang === 'hi' ? 'कृपया भोजन के लिए स्टार रेटिंग चुनें' : 'Please select food rating')
      return
    }

    setSubmitting(true)
    try {
      const fullComment = [...selectedTags, comment.trim()].filter(Boolean).join(' • ')

      const payload = {
        order_id: order.id,
        food_rating: foodRating,
        delivery_rating: deliveryRating,
        comment: fullComment || null,
      }

      await customerApi.createReview(payload)
      setSubmitted(true)
      toast.success(
        t.reviewSuccessMessage || (lang === 'hi' ? 'आपकी रेटिंग दर्ज हो गई है!' : 'Review submitted successfully!')
      )

      if (onReviewSuccess) {
        onReviewSuccess({
          orderId: order.id,
          foodRating,
          deliveryRating,
          comment: fullComment,
        })
      }

      setTimeout(() => {
        setSubmitted(false)
        onClose()
      }, 1400)
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        (lang === 'hi'
          ? 'रेटिंग सबमिट करने में विफल। कृपया पुनः प्रयास करें।'
          : 'Failed to submit review. You may have already reviewed this order.')
      toast.error(errorMsg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#113BD0] to-indigo-700 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner">
              <Star className="w-5 h-5 fill-amber-300 text-amber-300" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-black tracking-tight leading-tight truncate">
                {t.rateFoodAndDelivery || 'Rate Food & Delivery'}
              </h3>
              <p className="text-xs text-blue-100 font-medium truncate">
                #{order.order_number} • {t.rateExperienceSubtitle || 'How was your meal and delivery experience?'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        {submitted ? (
          <div className="p-8 text-center space-y-3 my-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-black text-slate-900 dark:text-slate-100">
              {t.reviewSuccessTitle || 'Thank You!'}
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto font-medium">
              {t.reviewSuccessMessage || 'Your valuable feedback helps us improve your dining experience.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              {/* 1. Restaurant / Food Rating */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2.5">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-[#113BD0] dark:text-blue-400 shrink-0" />
                  <span className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    {t.foodRatingTitle || 'Restaurant & Food Quality'}
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 truncate">
                  {restaurantName}
                </h4>

                {/* 5 Stars Selector */}
                <div className="flex items-center gap-2 py-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const activeStar = (hoverFoodRating || foodRating) >= star
                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverFoodRating(star)}
                        onMouseLeave={() => setHoverFoodRating(0)}
                        onClick={() => setFoodRating(star)}
                        className="p-1 cursor-pointer transition-transform hover:scale-125 active:scale-95 focus:outline-none"
                      >
                        <Star
                          className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                            activeStar
                              ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                              : 'text-slate-300 dark:text-slate-600 stroke-[1.5]'
                          }`}
                        />
                      </button>
                    )
                  })}
                </div>

                {/* Dynamic Emotion Badge */}
                <div className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  {foodLabels[hoverFoodRating || foodRating]}
                </div>
              </div>

              {/* 2. Delivery Rider Rating */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2.5">
                <div className="flex items-center gap-2">
                  <Bike className="w-4 h-4 text-[#F97316] shrink-0" />
                  <span className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    {t.riderRatingTitle || 'Delivery Rider Experience'}
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 truncate">
                  {riderName}
                </h4>

                {/* 5 Stars Selector */}
                <div className="flex items-center gap-2 py-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const activeStar = (hoverDeliveryRating || deliveryRating) >= star
                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverDeliveryRating(star)}
                        onMouseLeave={() => setHoverDeliveryRating(0)}
                        onClick={() => setDeliveryRating(star)}
                        className="p-1 cursor-pointer transition-transform hover:scale-125 active:scale-95 focus:outline-none"
                      >
                        <Star
                          className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                            activeStar
                              ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                              : 'text-slate-300 dark:text-slate-600 stroke-[1.5]'
                          }`}
                        />
                      </button>
                    )
                  })}
                </div>

                {/* Dynamic Rider Badge */}
                <div className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  {riderLabels[hoverDeliveryRating || deliveryRating]}
                </div>
              </div>

              {/* 3. Quick Feedback Chips */}
              <div className="space-y-2">
                <span className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider block">
                  {t.quickFeedbackTitle || 'What went well? (Select Tags)'}
                </span>
                <div className="flex flex-wrap gap-2">
                  {quickTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag.label)
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.label)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
                          isSelected
                            ? 'bg-[#113BD0] text-white shadow-xs scale-102'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {tag.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 4. Feedback Comment Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-bold flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                    <span>{lang === 'hi' ? 'विस्तृत समीक्षा (वैकल्पिक)' : 'Detailed Feedback (Optional)'}</span>
                  </span>
                  <span>{comment.length}/500</span>
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, 500))}
                  placeholder={
                    t.feedbackCommentPlaceholder ||
                    'Write a comment about food quality or delivery service (optional)...'
                  }
                  rows={3}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#113BD0] dark:focus:border-blue-500 transition-colors resize-none placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Modal Actions Footer - Pinned with high visibility */}
            <div className="p-3 sm:p-4 bg-slate-50/90 dark:bg-slate-900/95 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {lang === 'hi' ? 'बाद में' : 'Maybe Later'}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-2xl bg-[#113BD0] hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-blue-600/25 active:scale-95 transition-all cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t.submittingReview || 'Submitting...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{t.submitReview || 'Submit Review'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default RatingModal
