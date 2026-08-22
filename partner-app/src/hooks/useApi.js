import { useState, useEffect, useCallback, useRef } from 'react'

export const useApi = (apiFunc, deps = [], options = {}) => {
  const { initialData = null, immediate = true } = options
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(immediate && initialData === null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  // Standard execute (shows loading state on first load)
  const execute = useCallback(
    async (showLoading = true, ...args) => {
      if (showLoading) {
        setLoading(true)
      } else {
        setIsRefreshing(true)
      }
      setError(null)
      try {
        const response = await apiFunc(...args)
        const result = response.data?.data !== undefined ? response.data.data : response.data
        if (isMounted.current) {
          setData(result)
          setLoading(false)
          setIsRefreshing(false)
        }
        return result
      } catch (err) {
        if (isMounted.current) {
          setError(err.message || 'An unexpected error occurred')
          setLoading(false)
          setIsRefreshing(false)
        }
        throw err
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [...deps]
  )

  // Silent background revalidate (Zero UI flicker, keeps current data visible while fetching latest)
  const revalidate = useCallback(() => {
    return execute(false).catch(() => {})
  }, [execute])

  useEffect(() => {
    if (immediate) {
      execute(true).catch(() => {})
    }
  }, [execute, immediate])

  return {
    data,
    setData,
    loading,
    isRefreshing,
    error,
    retry: () => execute(true),
    revalidate,
    execute,
  }
}
