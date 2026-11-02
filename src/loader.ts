import type { DependencyList } from 'react'

const sameDeps = (a: DependencyList | null, b: DependencyList) =>
  a !== null && a.length === b.length && b.every((dep, i) => Object.is(dep, a[i]))

export interface LoadSink<T> {
  value: (value: T) => void
  error: (error: unknown) => void
  loading: (on: boolean) => void
  /** Shows the hook's initial value again. */
  reset: () => void
}

/** `signal` aborts when a later load, new deps or stop supersedes this one: pass it to fetch to stop the abandoned work. */
export type Load<T> = (signal: AbortSignal) => Promise<T>

const now = (go: () => void) => {
  go()
  return () => undefined
}

/**
 * useLoaded's and useDebouncedLoad's logic without React. Only the newest load lands: a later load, new deps or stop
 * drops the answer, error and end of every one before it. New deps reset the value unless keepAcrossKeys, and a null
 * load always does. `defer` starts a load, now or later, and returns what cancels the start.
 */
export function loader<T>(
  sink: LoadSink<T>,
  {
    keepAcrossKeys = false,
    defer = now,
  }: { keepAcrossKeys?: boolean; defer?: (go: () => void) => () => void } = {},
) {
  let generation = 0
  let seen: DependencyList | null = null
  let cancel: () => void = () => undefined
  let controller: AbortController | null = null
  const drop = () => {
    generation += 1
    cancel()
    controller?.abort()
    controller = null
  }
  const start = (load: Load<T>): Promise<void> => {
    generation += 1
    controller?.abort()
    const mine = generation
    const current = () => generation === mine
    const mineController = new AbortController()
    controller = mineController
    sink.loading(true)
    return load(mineController.signal)
      .then(
        (value) => {
          if (current()) {
            sink.value(value)
          }
        },
        (error: unknown) => {
          if (current()) {
            sink.error(error)
          }
        },
      )
      .finally(() => {
        if (current()) {
          sink.loading(false)
        }
      })
  }
  const skip = () => {
    drop()
    sink.reset()
    sink.loading(false)
  }
  return {
    deps(deps: DependencyList, load: Load<T> | null) {
      if (sameDeps(seen, deps)) {
        return
      }
      const fresh = seen !== null
      seen = deps
      if (load === null) {
        skip()
        return
      }
      drop()
      if (fresh && !keepAcrossKeys) {
        sink.reset()
      }
      sink.loading(true)
      // start settles through the sink, so only a throwing sink handler reaches this catch.
      cancel = defer(() => {
        start(load).catch(sink.error)
      })
    },
    /** Runs a load at once with the same deps, keeping the value shown until it answers; resolves when it has. */
    run(load: Load<T> | null): Promise<void> {
      if (load === null) {
        skip()
        return Promise.resolve()
      }
      return start(load)
    },
    stop() {
      drop()
      seen = null
    },
  }
}
