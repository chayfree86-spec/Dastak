import { useState, useEffect, useCallback, useRef } from 'react'
import { realtimeBus } from '../utils/realtimeSync'

export const useApi = (apiFn, params = null, options = {}) => {
  const { immediate = true, initialData = null, onSuccess, onError, autoSync = true } = options
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

  const optionsRef = useRef({ onSuccess, onError, initialData, autoSync })
  optionsRef.current = { onSuccess, onError, initialData, autoSync }

  const paramsRef = useRef(params)
  paramsRef.current = params

  const paramsKey = JSON.stringify(params)

  const execute = useCallback(async (overrideParams, { silent = false } = {}) => {
    if (!silent) {
      setLoading(true)
      setError(null)
    }
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
        if (!silent) {
          setError(err)
        }
        if (optionsRef.current.onError) {
          optionsRef.current.onError(err)
        }
      }
      return null
    } finally {
      if (isMounted.current && !silent) {
        setLoading(false)
      }
    }
  }, [])

  const silentRefresh = useCallback(() => {
    return execute(undefined, { silent: true })
  }, [execute])

  useEffect(() => {
    isMounted.current = true
    if (immediate) {
      execute()
    }

    let unsubscribe = () => {}
    let handleFocus = () => {}

    if (autoSync) {
      // 0ms Realtime bus auto-refresh
      unsubscribe = realtimeBus.subscribe(() => {
        if (isMounted.current && !document.hidden) {
          silentRefresh()
        }
      })

      handleFocus = () => {
        if (isMounted.current) {
          silentRefresh()
        }
      }
      window.addEventListener('focus', handleFocus)
    }

    return () => {
      isMounted.current = false
      unsubscribe()
      window.removeEventListener('focus', handleFocus)
    }
  }, [immediate, paramsKey, autoSync, execute, silentRefresh])

  const isEmpty = !loading && !error && (data === null || data === undefined || (Array.isArray(data) && data.length === 0))

  return {
    data,
    loading,
    error,
    isEmpty,
    meta,
    refetch: execute,
    retry: execute,
    silentRefresh,
    setData,
  }
}

export default useApi
