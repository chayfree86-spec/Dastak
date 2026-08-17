export const formatCurrency = (amount) => {
  const num = Number(amount) || 0
  return `₹${num.toLocaleString('en-IN', {
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}

export const formatTime = (isoString) => {
  if (!isoString) return ''
  try {
    const d = new Date(isoString)
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch (e) {
    return ''
  }
}

export const formatDateTime = (isoString) => {
  if (!isoString) return ''
  try {
    const d = new Date(isoString)
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch (e) {
    return ''
  }
}

export const getOrderStatusText = (status, lang = 'en') => {
  const mapEn = {
    PLACED: 'Order Placed',
    CONFIRMED: 'Restaurant Accepted',
    PREPARING: 'Kitchen Preparing Food',
    READY_FOR_PICKUP: 'Food Ready for Pickup',
    ASSIGNED: 'Delivery Partner Assigned',
    OUT_FOR_DELIVERY: 'On the Way to You',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
    REJECTED: 'Rejected by Restaurant',
  }

  const mapHi = {
    PLACED: 'ऑर्डर दर्ज हुआ',
    CONFIRMED: 'रेस्टोरेंट ने स्वीकार किया',
    PREPARING: 'खाना तैयार हो रहा है',
    READY_FOR_PICKUP: 'खाना तैयार है',
    ASSIGNED: 'डिलीवरी पार्टनर मिल गया',
    OUT_FOR_DELIVERY: 'ऑर्डर रास्ते में है',
    DELIVERED: 'सफलतापूर्वक पहुँच गया',
    CANCELLED: 'ऑर्डर कैंसिल हुआ',
    REJECTED: 'रेस्टोरेंट द्वारा अस्वीकृत',
  }

  const map = lang === 'hi' ? mapHi : mapEn
  return map[status] || status
}
