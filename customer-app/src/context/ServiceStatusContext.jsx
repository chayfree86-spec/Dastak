import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import customerApi from '../api/customer.api'
import StoreClosedModal from '../components/common/StoreClosedModal'

const ServiceStatusContext = createContext(null)

export const ServiceStatusProvider = ({ children }) => {
  const [status, setStatus] = useState(null)
  const [closedAlertOpen, setClosedAlertOpen] = useState(false)
  const serverOffsetRef = useRef(0)

  const fetchStatus = useCallback(async () => {
    try {
      const body = await customerApi.getServiceStatus()
      const data = body?.data || body
      if (data && typeof data.is_open === 'boolean') {
        setStatus(data)
        if (data.server_time) {
          serverOffsetRef.current = Date.parse(data.server_time) - Date.now()
        }
      }
    } catch (e) {
      // On failure keep last known status; default stays "open" so we never
      // block ordering just because the status check failed (backend still
      // enforces hours at checkout).
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    const iv = setInterval(fetchStatus, 60000)
    const onFocus = () => fetchStatus()
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(iv)
      window.removeEventListener('focus', onFocus)
    }
  }, [fetchStatus])

  // Unknown status → treat as open (don't block prematurely).
  const isOpen = status ? Boolean(status.is_open) : true
  const deliveryConfig = status?.delivery || null

  const openClosedAlert = useCallback(() => setClosedAlertOpen(true), [])

  // Guard for order actions: returns true if open; otherwise shows the alert.
  const requireOpen = useCallback(() => {
    if (isOpen) return true
    setClosedAlertOpen(true)
    return false
  }, [isOpen])

  return (
    <ServiceStatusContext.Provider
      value={{ status, isOpen, deliveryConfig, refresh: fetchStatus, requireOpen, openClosedAlert }}
    >
      {children}

      <StoreClosedModal
        isOpen={closedAlertOpen}
        onClose={() => setClosedAlertOpen(false)}
        status={status}
        serverOffset={serverOffsetRef.current}
      />
    </ServiceStatusContext.Provider>
  )
}

export const useServiceStatus = () => {
  const ctx = useContext(ServiceStatusContext)
  if (!ctx) {
    throw new Error('useServiceStatus must be used within ServiceStatusProvider')
  }
  return ctx
}

export default ServiceStatusContext
