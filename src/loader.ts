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
 * load does unless keepWhenIdle. `defer` starts a load, now or later, and returns what cancels the start.
 */
export function loader<T>(
  sink: LoadSink<T>,
  {
    keepAcrossKeys = false,
    keepWhenIdle = false,
    defer = now,
  }: {
    keepAcrossKeys?: boolean
    keepWhenIdle?: boolean
    defer?: (go: () => void) => () => void
  } = {},
) {
  let generation = 0
  let seen: DependencyList | null = null
  let idle = false
  let cancel: () => void = () => undefined
  let controller: AbortController | null = null
  const drop = () => {
    generation += 1
    cancel()
    controller?.abort()
    controller = null
  }
  const start = (load: Load<T>): Promise<void> => {
    idle = false
    generation += 1
    cancel()
    cancel = () => undefined
    controller?.abort()
    const mine = generation
    const current = () => generation === mine
    const mineController = new AbortController()
    controller = mineController
    sink.loading(true)
    // A load that throws before returning a promise settles through the sink like a rejection.
    return new Promise<T>((resolve) => resolve(load(mineController.signal)))
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
    idle = true
    if (!keepWhenIdle) {
      sink.reset()
    }
    sink.loading(false)
  }
  const changed = (deps: DependencyList, load: Load<T> | null) =>
    !sameDeps(seen, deps) || (load === null) !== idle
  return {
    /** Whether `deps` would act: new deps, or the null switch, which resets even on unchanged deps. */
    changed,
    deps(deps: DependencyList, load: Load<T> | null) {
      if (!changed(deps, load)) {
        return
      }
      const fresh = seen !== null
      seen = deps
      if (load === null) {
        skip()
        return
      }
      // Ends idle now rather than in start, so a call repeated before defer fires does not restart the timer.
      idle = false
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
