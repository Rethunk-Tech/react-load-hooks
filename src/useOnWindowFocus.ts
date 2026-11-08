import { useEffect } from 'react'

/** Runs `fn` on window focus while `active`. Pass a stable `fn`: a new one resubscribes. */
export function useOnWindowFocus(fn: () => void, active = true) {
  useEffect(() => {
    if (!active) {
      return
    }
    globalThis.addEventListener('focus', fn)
    return () => globalThis.removeEventListener('focus', fn)
  }, [fn, active])
}
