import { useSyncExternalStore } from 'react'

const second = 1000
const minute = 60_000

// One shared timer per period, running only while some component watches it.
function tickingClock(period: number) {
  const listeners = new Set<() => void>()
  let now = Date.now()
  let timer: ReturnType<typeof setInterval> | undefined

  function tick() {
    now = Date.now()
    for (const listener of listeners) {
      listener()
    }
  }

  function subscribe(listener: () => void) {
    listeners.add(listener)
    if (listeners.size === 1) {
      // The clock stood still while nobody watched it.
      now = Date.now()
      timer = setInterval(tick, period)
    }
    return () => {
      listeners.delete(listener)
      if (listeners.size === 0 && timer !== undefined) {
        clearInterval(timer)
        timer = undefined
      }
    }
  }

  return { subscribe, read: () => (listeners.size === 0 ? Date.now() : now) }
}

const minuteClock = tickingClock(minute)
const secondClock = tickingClock(second)
const unwatched = () => () => undefined

function useClockValue<T extends string | number | boolean>(
  clock: ReturnType<typeof tickingClock>,
  compute: (now: number) => T,
  on: boolean,
): T {
  return useSyncExternalStore(on ? clock.subscribe : unwatched, () => compute(clock.read()))
}

/** compute's answer from the minute clock; the component re-renders only when the answer changes, so compute returns a
 * primitive (a label rather than the time). */
export function useNowValue<T extends string | number | boolean>(compute: (now: number) => T): T {
  return useClockValue(minuteClock, compute, true)
}

/** useNowValue on a clock that ticks every second while `on`; compute should return a constant while off. */
export function useSecondValue<T extends string | number | boolean>(
  compute: (now: number) => T,
  on: boolean,
): T {
  return useClockValue(secondClock, compute, on)
}
