import { type DependencyList, useEffect, useRef, useState } from 'react'
import { type Load, loader } from './loader.ts'

/**
 * useLoaded for input that changes on every key: `load` runs `delayMs` (read afresh each time a load is scheduled)
 * after `deps` last changed, and `data` keeps the last answer meanwhile. Only the newest run lands, so `onError` hears
 * only the newest failure. A null `load` resets `data` to `initial`. `run` starts another load at once, such as the
 * next page, under the same rule.
 */
export function useDebouncedLoad<T>(
  load: Load<T> | null,
  deps: DependencyList,
  {
    initial,
    delayMs,
    onError,
  }: { initial: T; delayMs: number; onError?: (error: unknown) => void },
) {
  const [data, setData] = useState(initial)
  const [loading, setLoading] = useState(load !== null)
  const [error, setError] = useState<unknown>(null)
  const latest = useRef({ initial, onError, delayMs })
  latest.current = { initial, onError, delayMs }
  const [runs] = useState(() =>
    loader<T>(
      {
        value: (value) => {
          setData(() => value)
          setError(null)
        },
        error: (e) => {
          setError(e)
          latest.current.onError?.(e)
        },
        loading: setLoading,
        reset: () => setData(() => latest.current.initial),
      },
      {
        keepAcrossKeys: true,
        defer: (go) => {
          const timer = globalThis.setTimeout(go, latest.current.delayMs)
          return () => globalThis.clearTimeout(timer)
        },
      },
    ),
  )
  // Runs after every render and acts only when the caller's deps changed: an effect cannot take a caller-supplied
  // dependency list.
  useEffect(() => {
    runs.deps(deps, load)
  })
  useEffect(() => () => runs.stop(), [runs])
  return {
    data,
    loading,
    error,
    run: (next: Load<T>) => runs.run(next),
  }
}
