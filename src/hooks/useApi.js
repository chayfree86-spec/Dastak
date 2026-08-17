import { useState, useEffect, useCallback, useRef } from 'react'

export const useApi = (apiFn, params = null, options = {}) => {
  const { immediate = true, initialData = null, onSuccess, onError } = options
  // NOTE: initialData is treated as a placeholder/type hint ONLY — it is never
  // rendered. Data starts empty and `loading` is true so pages show a proper
  // loading/empty state and then REAL data, instead of flashing demo/mock data.
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState(null)
  const [meta, setMeta] = useState(null)

  const isMounted = useRef(true)
  const apiFnRef = useRef(apiFn)
  apiFnRef.current = apiFn

  const optionsRef = useRef({ onSuccess, onError, initialData })
  optionsRef.current = { onSuccess, onError, initialData }

  const paramsRef = useRef(params)
  paramsRef.current = params

  const paramsKey = JSON.stringify(params)

  const execute = useCallback(async (overrideParams) => {
    // Show loading while we have no data yet (keeps current data visible on refetch).
    if (!data) {
      setLoading(true)
    }
    setError(null)
    try {
      const queryParams = overrideParams !== undefined ? overrideParams : paramsRef.current
      const response = await apiFnRef.current(queryParams)

      if (isMounted.current) {
        const resultData = response?.data !== undefined ? response.data : response
        setData(resultData)

        if (response?.meta || response?.pagination) {
          setMeta(response.meta || response.pagination)
        }

        if (optionsRef.current.onSuccess) {
          optionsRef.current.onSuccess(resultData)
        }
      }
      return response
    } catch (err) {
      if (isMounted.current) {
        // Never fall back to mock/placeholder data — surface a real error state.
        setError(err)
        if (optionsRef.current.onError) {
          optionsRef.current.onError(err)
        }
      }
      return null
    } finally {
      if (isMounted.current) {
        setLoading(false)
      }
    }
  }, [data])

  useEffect(() => {
    isMounted.current = true
    if (immediate) {
      execute()
    }
    return () => {
      isMounted.current = false
    }
  }, [immediate, paramsKey])

  const isEmpty = !loading && !error && (data === null || data === undefined || (Array.isArray(data) && data.length === 0))

  return {
    data,
    loading,
    error,
    isEmpty,
    meta,
    refetch: execute,
    retry: execute,
    setData,
  }
}

export default useApi
