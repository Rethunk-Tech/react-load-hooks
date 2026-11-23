import { useEffect, useState } from 'react'

/**
 * `value` once it has held still for `ms`; the first render returns it at once, and so does every render where
 * `immediate(value)` holds (an emptied search box clears its results without waiting).
 */
export function useDebouncedValue<T>(
  value: T,
  ms: number,
  { immediate }: { immediate?: (value: T) => boolean } = {},
): T {
  const [settled, setSettled] = useState(() => value)
  const now = immediate?.(value) ?? false
  useEffect(() => {
    if (now) {
      setSettled(() => value)
      return
    }
    const timer = setTimeout(() => setSettled(() => value), ms)
    return () => clearTimeout(timer)
  }, [value, ms, now])
  return now ? value : settled
}
