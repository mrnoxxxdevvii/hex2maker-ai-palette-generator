import { useEffect, useState } from 'react'

export function useSessionState(key, initialValue) {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return initialValue

    try {
      return window.sessionStorage.getItem(key) ?? initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      if (value) window.sessionStorage.setItem(key, value)
      else window.sessionStorage.removeItem(key)
    } catch {
      return
    }
  }, [key, value])

  return [value, setValue]
}
