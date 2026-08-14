import { useState, useEffect, useCallback, useRef } from 'react'

export const useApi = (apiFn, params = null, options = {}) => {
  const { immediate = true, initialData = null, onSuccess, onError } = options
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(immediate && !initialData)
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
    // Only show loading if we don't have existing data
    if (!optionsRef.current.initialData && !data) {
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
        // If initialData was provided, gracefully keep initialData without breaking table UI
        if (optionsRef.current.initialData) {
          setData(optionsRef.current.initialData)
          setError(null)
        } else {
          setError(err)
        }
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
