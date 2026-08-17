import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'

const CartContext = createContext(null)

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('dastak_customer_cart_items')
    return saved ? JSON.parse(saved) : []
  })

  const [restaurant, setRestaurant] = useState(() => {
    const saved = localStorage.getItem('dastak_customer_cart_restaurant')
    return saved ? JSON.parse(saved) : null
  })

  const [coupon, setCoupon] = useState(null)

  useEffect(() => {
    localStorage.setItem('dastak_customer_cart_items', JSON.stringify(items))
    if (items.length === 0) {
      setRestaurant(null)
      localStorage.removeItem('dastak_customer_cart_restaurant')
    } else if (restaurant) {
      localStorage.setItem('dastak_customer_cart_restaurant', JSON.stringify(restaurant))
    }
  }, [items, restaurant])

  // Add Item to Cart
  const addItem = (product, qty = 1, productRestaurant = null) => {
    const itemRestaurant = productRestaurant || product.restaurant

    // If adding from another restaurant, reset cart to new restaurant
    if (restaurant && itemRestaurant && restaurant.id !== itemRestaurant.id) {
      setRestaurant(itemRestaurant)
      setItems([
        {
          id: product.id,
          name: product.name,
          price: Number(product.discount_price || product.base_price || 0),
          image: product.image,
          food_type: product.food_type,
          quantity: qty,
        },
      ])
      return
    }

    if (itemRestaurant && !restaurant) {
      setRestaurant(itemRestaurant)
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
        },
      ]
    })
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

  const deliveryFee = useMemo(() => {
    if (items.length === 0) return 0
    return subtotal > 499 ? 0 : 35.0
  }, [items, subtotal])

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
