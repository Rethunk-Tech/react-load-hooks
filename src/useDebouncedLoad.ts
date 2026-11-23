import { type DependencyList, useEffect, useRef, useState } from 'react'
import { type Load, loader } from './loader.ts'
import type { LoadedOptions } from './useLoaded.ts'

/**
 * useLoaded for input that changes on every key: `load` runs `delayMs` (read afresh each time a load is scheduled)
 * after `deps` last changed, and `data` keeps the last answer meanwhile. Only the newest run lands, so `onError` hears
 * only the newest failure. A null `load` resets `data` to `initial` unless `keepWhenIdle` (read on mount). `onValue` hears
 * each answer that lands; with `errorValue`, a failed load sets `data` to its answer. `run` starts another load at once,
 * such as the next page, under the same rule.
 */
export function useDebouncedLoad<T>(
  load: Load<T> | null,
  deps: DependencyList,
  {
    initial,
    delayMs,
    onError,
    keepWhenIdle = false,
    onValue,
    errorValue,
  }: { initial: T; delayMs: number } & Omit<LoadedOptions<T>, 'keepAcrossKeys'>,
) {
  const [data, setData] = useState(initial)
  const [loading, setLoading] = useState(load !== null)
  const [error, setError] = useState<unknown>(null)
  const latest = useRef({ initial, onError, delayMs, onValue, errorValue })
  latest.current = { initial, onError, delayMs, onValue, errorValue }
  const [runs] = useState(() =>
    loader<T>(
      {
        value: (value) => {
          setData(() => value)
          setError(null)
          latest.current.onValue?.(value)
        },
        error: (e) => {
          setError(e)
          const fail = latest.current.errorValue
          if (fail) {
            setData(() => fail(e))
          }
          latest.current.onError?.(e)
        },
        loading: (on) => {
          setLoading(on)
          if (on) {
            setError(null)
          }
        },
        reset: () => setData(() => latest.current.initial),
      },
      {
        keepAcrossKeys: true,
        keepWhenIdle,
        defer: (go) => {
          const timer = globalThis.setTimeout(go, latest.current.delayMs)
          return () => globalThis.clearTimeout(timer)
        },
      },
    ),
  )
  // The reset happens in the effect, after a paint, so this render has to answer for a null load itself. `data` stays
  // across new deps, but a new deps' load is already owed, so loading shows it and error stays null until that load lands.
  const idle = load === null
  const moved = runs.changed(deps, load)
  // Runs after every render and acts only when the caller's deps changed: an effect cannot take a caller-supplied
  // dependency list.
  useEffect(() => {
    runs.deps(deps, load)
  })
  useEffect(() => () => runs.stop(), [runs])
  return {
    data: idle && !keepWhenIdle ? initial : data,
    loading: idle ? false : moved || loading,
    error: idle || moved ? null : error,
    run: (next: Load<T>) => runs.run(next),
  }
}
