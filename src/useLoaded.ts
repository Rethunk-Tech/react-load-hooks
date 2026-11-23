import { type DependencyList, useCallback, useEffect, useRef, useState } from 'react'
import { type Load, loader } from './loader.ts'

export interface LoadedOptions<T = unknown> {
  onError?: (error: unknown) => void
  /** Keep `data` across new deps until the new answer lands. Read on mount. */
  keepAcrossKeys?: boolean
  /** Keep `data` while `load` is null instead of resetting it to `initial`. Read on mount. */
  keepWhenIdle?: boolean
  /** Hears each answer that lands, after `data` takes it. */
  onValue?: (value: T) => void
  /** On a failed load, `data` becomes this function's answer instead of keeping the last good value. */
  errorValue?: (error: unknown) => T
}

/**
 * Runs `load` whenever `deps` change (never while `load` is null) and drops the answer of any run that has been
 * superseded or unmounted. New deps and a null load reset `data` to `initial`; a failed load keeps the last good `data`
 * and sets `error`. `reload` runs it again with the same deps and keeps the old value until the answer arrives;
 * `setData` edits the loaded value in place. The fourth argument is `onError` or `LoadedOptions`. With `keepAcrossKeys`,
 * new deps keep `data` until the new answer lands; with `keepWhenIdle`, a null load keeps it too.
 */
export function useLoaded<T>(
  load: Load<T> | null,
  deps: DependencyList,
  initial: T,
  options?: ((error: unknown) => void) | LoadedOptions<T>,
) {
  const {
    onError,
    keepAcrossKeys = false,
    keepWhenIdle = false,
    onValue,
    errorValue,
  }: LoadedOptions<T> = typeof options === 'function' ? { onError: options } : (options ?? {})
  const [data, setData] = useState(() => initial)
  const [loading, setLoading] = useState(load !== null)
  const [error, setError] = useState<unknown>(null)
  const latest = useRef({ load, initial, onError, onValue, errorValue })
  latest.current = { load, initial, onError, onValue, errorValue }
  const [runs] = useState(() =>
    loader<T>(
      {
        value: (value) => {
          setData(() => value)
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
      { keepAcrossKeys, keepWhenIdle },
    ),
  )
  // The reset happens in the effect, after a paint, so this render has to answer for the change itself.
  const moved = runs.changed(deps, load)
  const idle = load === null
  // Runs after every render and starts a load only when the caller's deps changed: an effect cannot take a
  // caller-supplied dependency list.
  useEffect(() => {
    runs.deps(deps, load)
  })
  useEffect(() => () => runs.stop(), [runs])
  const reload = useCallback(() => runs.run(latest.current.load), [runs])
  const reset = idle ? !keepWhenIdle : moved && !keepAcrossKeys
  return {
    data: reset ? initial : data,
    setData,
    loading: idle ? false : moved || loading,
    error: idle || moved ? null : error,
    reload,
  }
}
