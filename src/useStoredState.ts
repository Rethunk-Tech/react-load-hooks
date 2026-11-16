import { useEffect, useState } from 'react'

function read<T>(key: string, fallback: T, valid: (value: unknown) => value is T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) {
      return fallback
    }
    const parsed = parseOrRaw(raw)
    return valid(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

// Other code may have written a bare string, which is not JSON.
function parseOrRaw(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === undefined) {
      localStorage.removeItem(key)
      return
    }
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage can be blocked or full; the choice then lasts until the app closes.
  }
}

/** State that survives a restart in localStorage. A stored value that fails `valid` is ignored. */
export function useStoredState<T>(
  key: string,
  fallback: T,
  valid: (value: unknown) => value is T,
): [T, (value: T) => void] {
  // Server has no localStorage; reading on the first client paint mismatches hydration.
  const [stored, setStored] = useState(() => ({ key, value: fallback }))
  let value = stored.value
  if (stored.key !== key) {
    value = fallback
    setStored({ key, value })
  }
  // Read once per key; a fresh `valid` or `fallback` identity must not re-parse storage.
  // biome-ignore lint/correctness/useExhaustiveDependencies: once per key
  useEffect(() => {
    const next = read(key, fallback, valid)
    setStored((prev) =>
      prev.key === key && Object.is(prev.value, next) ? prev : { key, value: next },
    )
  }, [key])
  return [
    value,
    (next) => {
      setStored({ key, value: next })
      write(key, next)
    },
  ]
}

export { read as readStored, write as writeStored }
