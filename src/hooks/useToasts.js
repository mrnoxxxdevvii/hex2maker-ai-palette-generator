import { useCallback, useEffect, useRef, useState } from 'react'

let toastSequence = 0

export function useToasts() {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const dismissToast = useCallback((id) => {
    const timer = timers.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      timers.current.delete(id)
    }

    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const pushToast = useCallback((toast) => {
    const id = ++toastSequence
    const duration = toast.duration ?? (toast.type === 'error' ? 6500 : 3800)

    setToasts((current) => [...current.slice(-2), { type: 'info', ...toast, id, duration }])

    const timer = window.setTimeout(() => {
      timers.current.delete(id)
      setToasts((current) => current.filter((item) => item.id !== id))
    }, duration)

    timers.current.set(id, timer)
    return id
  }, [])

  useEffect(() => {
    const activeTimers = timers.current

    return () => {
      activeTimers.forEach((timer) => window.clearTimeout(timer))
      activeTimers.clear()
    }
  }, [])

  return { toasts, pushToast, dismissToast }
}
