import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { UtensilsCrossed, AlertTriangle, X, ShoppingBag } from 'lucide-react'
import { useServiceStatus } from './ServiceStatusContext'

const CartContext = createContext(null)

export const CartProvider = ({ children }) => {
  const { requireOpen, deliveryConfig } = useServiceStatus()
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('dastak_customer_cart_items')
    return saved ? JSON.parse(saved) : []
  })

  const [restaurant, setRestaurant] = useState(() => {
    const saved = localStorage.getItem('dastak_customer_cart_restaurant')
    return saved ? JSON.parse(saved) : null
  })

  const [coupon, setCoupon] = useState(null)

  // Single-Restaurant Conflict Modal State
  const [conflictModal, setConflictModal] = useState({
    isOpen: false,
    currentRestaurant: null,
    targetRestaurant: null,
    pendingItem: null,
  })

  useEffect(() => {
    localStorage.setItem('dastak_customer_cart_items', JSON.stringify(items))
    if (items.length === 0) {
      setRestaurant(null)
      localStorage.removeItem('dastak_customer_cart_restaurant')
    } else if (restaurant) {
      localStorage.setItem('dastak_customer_cart_restaurant', JSON.stringify(restaurant))
    }
  }, [items, restaurant])

  // Add Item to Cart (Strict Single-Partner Policy)
  const addItem = (product, qty = 1, productRestaurant = null) => {
    if (!product) return

    // 0. Ordering hours gate — if closed, show the opening-countdown alert
    //    and do not add anything to the cart.
    if (!requireOpen()) return

    // 1. Resolve target restaurant object
    const targetRestaurant =
      productRestaurant ||
      product.restaurant ||
      (product.restaurant_id
        ? {
            id: product.restaurant_id,
            name: product.restaurant_name || product.restaurant?.name || 'Partner Kitchen',
            slug: product.restaurant_slug || product.restaurant?.slug,
          }
        : null)

    // 2. Strict Single Restaurant Check: If cart already has items from another partner, prompt user
    if (
      items.length > 0 &&
      restaurant &&
      targetRestaurant &&
      String(restaurant.id) !== String(targetRestaurant.id)
    ) {
      setConflictModal({
        isOpen: true,
        currentRestaurant: restaurant,
        targetRestaurant: targetRestaurant,
        pendingItem: { product, qty, targetRestaurant },
      })
      return
    }

    if (targetRestaurant && !restaurant) {
      setRestaurant(targetRestaurant)
    }

    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === product.id)
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex].quantity += qty
        return updated
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: Number(product.discount_price || product.base_price || 0),
          image: product.image,
          food_type: product.food_type,
          quantity: qty,
          restaurant_id: targetRestaurant?.id || restaurant?.id,
        },
      ]
    })
  }

  // Confirm replacing current cart items with new partner's dish
  const confirmConflictReplace = () => {
    if (!conflictModal.pendingItem) {
      setConflictModal({ isOpen: false, currentRestaurant: null, targetRestaurant: null, pendingItem: null })
      return
    }

    const { product, qty, targetRestaurant } = conflictModal.pendingItem
    setRestaurant(targetRestaurant)
    setItems([
      {
        id: product.id,
        name: product.name,
        price: Number(product.discount_price || product.base_price || 0),
        image: product.image,
        food_type: product.food_type,
        quantity: qty,
        restaurant_id: targetRestaurant?.id,
      },
    ])
    setCoupon(null)
    setConflictModal({ isOpen: false, currentRestaurant: null, targetRestaurant: null, pendingItem: null })
  }

  // Cancel replacing cart
  const cancelConflict = () => {
    setConflictModal({ isOpen: false, currentRestaurant: null, targetRestaurant: null, pendingItem: null })
  }

  // Update Quantity
  const updateQuantity = (productId, newQty) => {
    if (newQty <= 0) {
      removeItem(productId)
      return
    }
    setItems((prev) =>
      prev.map((i) => (i.id === productId ? { ...i, quantity: newQty } : i))
    )
  }

  // Remove Item
  const removeItem = (productId) => {
    setItems((prev) => prev.filter((i) => i.id !== productId))
  }

  // Clear Cart
  const clearCart = () => {
    setItems([])
    setRestaurant(null)
    setCoupon(null)
  }

  // Get Quantity for a specific product
  const getItemQuantity = (productId) => {
    const item = items.find((i) => i.id === productId)
    return item ? item.quantity : 0
  }

  // Calculations
  const itemCount = useMemo(() => {
    return items.reduce((sum, it) => sum + it.quantity, 0)
  }, [items])

  const subtotal = useMemo(() => {
    return items.reduce((sum, it) => sum + it.price * it.quantity, 0)
  }, [items])

  // Delivery fee estimate from admin-configured settings (free threshold +
  // base fee). Distance-based surcharge is applied by the backend at checkout.
  const deliveryFee = useMemo(() => {
    if (items.length === 0) return 0
    const cfg = deliveryConfig
    if (!cfg) return subtotal >= 499 ? 0 : 35 // fallback until config loads
    if (cfg.all_free_delivery) return 0 // festival mode — free for everyone
    const freeMin = Number(cfg.free_delivery_min_order) || 0
    if (freeMin > 0 && subtotal >= freeMin) return 0
    // Note: free-within-radius applies at checkout (needs delivery distance).
    return Number(cfg.base_delivery_fee) || 0
  }, [items, subtotal, deliveryConfig])

  const taxAmount = useMemo(() => {
    return Math.round(subtotal * 0.05 * 100) / 100
  }, [subtotal])

  const discountAmount = useMemo(() => {
    if (!coupon) return 0
    return coupon.discount || 0
  }, [coupon])

  const grandTotal = useMemo(() => {
    if (items.length === 0) return 0
    return Math.max(0, subtotal + deliveryFee + taxAmount - discountAmount)
  }, [subtotal, deliveryFee, taxAmount, discountAmount, items])

  return (
    <CartContext.Provider
      value={{
        items,
        restaurant,
        itemCount,
        subtotal,
        deliveryFee,
        taxAmount,
        discountAmount,
        grandTotal,
        coupon,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        getItemQuantity,
        setCoupon,
      }}
    >
      {children}

      {/* Strict Single-Partner Cart Conflict Confirmation Modal */}
      {conflictModal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-slate-950/30 dark:shadow-black/80 transform transition-all duration-200 overflow-hidden text-left"
            role="dialog"
            aria-modal="true"
          >
            {/* Subtle Orange Glow */}
            <div className="absolute -top-16 -right-16 w-36 h-36 bg-orange-500/10 dark:bg-orange-500/20 rounded-full blur-2xl pointer-events-none" />

            {/* Close Cross */}
            <button
              type="button"
              onClick={cancelConflict}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header Icon */}
            <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/60 text-[#FF5200] flex items-center justify-center mb-3.5 shadow-sm border border-orange-200/60 dark:border-orange-900/50">
              <ShoppingBag className="w-6 h-6" />
            </div>

            {/* Title & Description */}
            <div className="space-y-1.5 mb-5">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Replace items in cart?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Your cart currently contains dishes from{' '}
                <strong className="text-slate-900 dark:text-white font-black">
                  {conflictModal.currentRestaurant?.name || 'another restaurant'}
                </strong>
                . Do you want to discard them and start a fresh order from{' '}
                <strong className="text-[#FF5200] dark:text-orange-400 font-black">
                  {conflictModal.targetRestaurant?.name || 'this restaurant'}
                </strong>
                ?
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={confirmConflictReplace}
                className="w-full py-3.5 sm:py-4 px-5 rounded-2xl bg-gradient-to-r from-[#FF5200] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white font-black text-xs sm:text-sm shadow-lg shadow-orange-500/35 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Discard & Add Dishes</span>
                <span>→</span>
              </button>

              <button
                type="button"
                onClick={cancelConflict}
                className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer text-center"
              >
                Keep Current Cart ({conflictModal.currentRestaurant?.name})
              </button>
            </div>
          </div>
        </div>
      )}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}

export default CartContext
