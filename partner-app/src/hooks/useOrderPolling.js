import { useState, useEffect, useRef, useCallback } from 'react'
import ordersApi from '../api/orders.api'
import { soundAlert } from '../utils/soundAlert'

export const useOrderPolling = (intervalMs = 9000) => {
  const [newOrders, setNewOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const knownOrderIds = useRef(new Set())
  const isFirstLoad = useRef(true)

  const fetchNewOrders = useCallback(async () => {
    try {
      const res = await ordersApi.getOrders({ status: 'PENDING,CONFIRMED,PREPARING', per_page: 30 })
      const list = res.data?.data || []
      setNewOrders(list)
      setError(null)

      // Detect if new PENDING orders arrived that were not previously in our known set
      const currentPendingIds = new Set(
        list.filter((o) => o.status === 'PENDING').map((o) => o.id || o.order_number)
      )
      let hasFreshArrivals = false

      if (!isFirstLoad.current) {
        for (const id of currentPendingIds) {
          if (!knownOrderIds.current.has(id)) {
            hasFreshArrivals = true
            break
          }
        }
        if (hasFreshArrivals) {
          soundAlert.playOrderChime()
        }
      }

      knownOrderIds.current = currentPendingIds
      isFirstLoad.current = false
      setLoading(false)
      return list
    } catch (err) {
      setError(err.message || 'Unable to fetch new incoming orders')
      setLoading(false)
      throw err
    }
  }, [])

  useEffect(() => {
    fetchNewOrders().catch(() => {})

    const timer = setInterval(() => {
      // Only poll when page is active/visible to save battery and network
      if (!document.hidden) {
        fetchNewOrders().catch(() => {})
      }
    }, intervalMs)

    return () => clearInterval(timer)
  }, [fetchNewOrders, intervalMs])

  return {
    newOrders,
    count: newOrders.length,
    loading,
    error,
    refresh: fetchNewOrders,
  }
}
