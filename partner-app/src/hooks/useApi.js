import { useState, useEffect, useCallback, useRef } from 'react'

export const useApi = (apiFunc, deps = [], options = {}) => {
  const { initialData = null, immediate = true } = options
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState(null)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const execute = useCallback(
    async (...args) => {
      setLoading(true)
      setError(null)
      try {
        const response = await apiFunc(...args)
        const result = response.data?.data !== undefined ? response.data.data : response.data
        if (isMounted.current) {
          setData(result)
          setLoading(false)
        }
        return result
      } catch (err) {
        if (isMounted.current) {
          setError(err.message || 'An unexpected error occurred')
          setLoading(false)
        }
        throw err
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [...deps]
  )

  useEffect(() => {
    if (immediate) {
      execute().catch(() => {})
    }
  }, [execute, immediate])

  return {
    data,
    setData,
    loading,
    error,
    retry: execute,
    execute,
  }
}
