// Smart dynamic routing helper for local development and live production
const isLocal =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.'))

export const APP_URLS = {
  customer: isLocal ? 'http://127.0.0.1:5176' : 'https://user.dastak.cc',
  customerLogin: isLocal ? 'http://127.0.0.1:5176/login' : 'https://user.dastak.cc/login',
  partner: isLocal ? 'http://127.0.0.1:5174' : 'https://partner.dastak.cc',
  partnerLogin: isLocal ? 'http://127.0.0.1:5174/login' : 'https://partner.dastak.cc/login',
  rider: isLocal ? 'http://127.0.0.1:5175' : 'https://rider.dastak.cc',
  riderLogin: isLocal ? 'http://127.0.0.1:5175/login' : 'https://rider.dastak.cc/login',
  admin: isLocal ? 'http://127.0.0.1:5173' : 'https://admin.dastak.cc',
}

export default APP_URLS
