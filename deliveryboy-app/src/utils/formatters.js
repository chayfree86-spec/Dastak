export const formatCurrency = (amount) => {
  const num = Number(amount) || 0
  return `₹${num.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

export const formatDistance = (metersOrKm) => {
  if (!metersOrKm && metersOrKm !== 0) return '0 km'
  const val = Number(metersOrKm)
  if (val < 1) {
    return `${Math.round(val * 1000)} m`
  }
  return `${val.toFixed(1)} km`
}

export const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export const formatTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

export const formatDateTime = (dateString) => {
  if (!dateString) return ''
  return `${formatDate(dateString)}, ${formatTime(dateString)}`
}

export const formatElapsedTime = (startTime) => {
  if (!startTime) return '0 min'
  const start = new Date(startTime).getTime()
  const now = Date.now()
  const diffSec = Math.floor((now - start) / 1000)

  if (diffSec < 60) return 'Just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHours = Math.floor(diffMin / 60)
  return `${diffHours}h ${diffMin % 60}m ago`
}
