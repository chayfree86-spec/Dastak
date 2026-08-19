/**
 * Device & Installation Identifier Helper for Restaurant Partner App
 */

const DEVICE_STORAGE_KEY = 'dastak_partner_device_id'

export const getDeviceId = () => {
  let deviceId = localStorage.getItem(DEVICE_STORAGE_KEY)
  if (!deviceId) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      deviceId = `dev_ptr_${crypto.randomUUID().replace(/-/g, '')}`
    } else {
      deviceId = `dev_ptr_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`
    }
    localStorage.setItem(DEVICE_STORAGE_KEY, deviceId)
  }
  return deviceId
}

export const getDevicePlatform = () => {
  const ua = navigator.userAgent || ''
  const isMobileUa = /android|iphone|ipad|ipod|mobile|blackberry|iemobile|opera mini/i.test(ua)
  const isTouch = (typeof window !== 'undefined') && ('ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0))
  const isSmallScreen = (typeof window !== 'undefined') && window.innerWidth <= 768

  if (isMobileUa || (isTouch && isSmallScreen)) {
    return 'mobile'
  }
  return 'desktop'
}

export const getDeviceName = () => {
  const ua = navigator.userAgent || ''
  if (/android/i.test(ua)) return 'Partner Tablet/Android'
  if (/iPad|iPhone|iPod/.test(ua)) return 'Partner iPad/iOS'
  if (/windows/i.test(ua)) return 'Partner Windows POS'
  return 'Partner Web Terminal'
}
