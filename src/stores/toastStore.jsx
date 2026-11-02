import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

const ToastContext = createContext(undefined)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const seq = useRef(0)

  const dismiss = useCallback((id) => setToasts((prev) => prev.filter((t) => t.id !== id)), [])

  const push = useCallback(
    (kind, text, ms = 4200) => {
      const id = ++seq.current
      setToasts((prev) => [...prev.slice(-3), { id, kind, text }])
      setTimeout(() => dismiss(id), ms)
    },
    [dismiss],
  )

  const api = useMemo(
    () => ({
      toasts,
      dismiss,
      success: (text, ms) => push('success', text, ms),
      error: (text, ms) => push('error', text, ms ?? 6000),
      info: (text, ms) => push('info', text, ms),
    }),
    [toasts, dismiss, push],
  )

  return <ToastContext.Provider value={api}>{children}</ToastContext.Provider>
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
