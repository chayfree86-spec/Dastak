import { useEffect, useRef } from 'react'

export const useKeyboardNav = (formRef, options = {}) => {
  const { autoFocusFirst = true, onSubmit } = options
  const isInitiated = useRef(false)

  useEffect(() => {
    if (!formRef?.current) return

    const form = formRef.current

    if (autoFocusFirst && !isInitiated.current) {
      const firstInput = form.querySelector('input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])')
      if (firstInput) {
        firstInput.focus()
        isInitiated.current = true
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        const target = e.target
        // Don't intercept Enter inside multi-line textareas
        if (target.tagName === 'TEXTAREA') return

        const focusables = Array.from(
          form.querySelectorAll('input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button[type="submit"]')
        )
        const index = focusables.indexOf(target)

        if (index > -1) {
          e.preventDefault()
          const nextIndex = index + 1

          if (nextIndex < focusables.length) {
            focusables[nextIndex].focus()
          } else if (onSubmit) {
            onSubmit(e)
          } else {
            const submitBtn = form.querySelector('button[type="submit"]')
            if (submitBtn) submitBtn.click()
          }
        }
      }
    }

    form.addEventListener('keydown', handleKeyDown)
    return () => {
      form.removeEventListener('keydown', handleKeyDown)
    }
  }, [formRef, autoFocusFirst, onSubmit])
}

export default useKeyboardNav
