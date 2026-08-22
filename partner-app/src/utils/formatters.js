/**
 * Standard formatters for Dastak Partner App with strict Indian Standard Time (Asia/Kolkata)
 */

export const formatCurrency = (val) => {
  const num = Number(val) || 0
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(num)
}

export const formatPhone = (phone) => {
  if (!phone) return 'N/A'
  const clean = String(phone).replace(/\D/g, '')
  if (clean.length === 10) {
    return `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`
  }
  return phone
}

export const formatTime = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export const formatDateTime = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export const formatElapsedTime = (dateStr) => {
  if (!dateStr) return 'Just now'
  const start = new Date(dateStr).getTime()
  const now = Date.now()
  const diffSec = Math.max(0, Math.floor((now - start) / 1000))

  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} hr ${diffMin % 60}m ago`
  return `${Math.floor(diffHr / 24)} days ago`
}

export const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export const formatAddress = (addr) => {
  if (!addr) return ''
  if (typeof addr === 'string') return addr
  if (typeof addr === 'object') {
    if (addr.formatted_address) return addr.formatted_address
    if (addr.complete_address) return addr.complete_address
    if (addr.address && typeof addr.address === 'string') return addr.address

    const parts = [
      addr.house_number || addr.flat_no || addr.door_no || '',
      addr.address_line1 || addr.street || addr.area || '',
      addr.address_line2 || '',
      addr.landmark ? `Near ${addr.landmark}` : '',
      addr.city || '',
      addr.pincode ? `- ${addr.pincode}` : '',
    ].filter(Boolean)

    if (parts.length > 0) {
      return parts.join(', ')
    }
  }
  return ''
}
