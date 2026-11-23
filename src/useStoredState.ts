import { useCallback, useMemo, useSyncExternalStore } from 'react'

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

function storedRaw(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

interface Snapshot {
  raw: string | null
  value: unknown
}

interface Entry {
  snapshot: Snapshot
  listeners: Set<() => void>
}

const missing: Snapshot = { raw: null, value: undefined }
// One entry per key while some component watches it, so every watcher sees the same value and a write reaches them
// all. The entry goes with its last watcher, so a later mount reads storage afresh.
const entries = new Map<string, Entry>()

function fromStorage(key: string): Snapshot {
  const raw = storedRaw(key)
  return raw === null ? missing : { raw, value: parseOrRaw(raw) }
}

function entryOf(key: string): Entry {
  let entry = entries.get(key)
  if (entry === undefined) {
    entry = { snapshot: fromStorage(key), listeners: new Set() }
    entries.set(key, entry)
  }
  return entry
}

function publish(entry: Entry, snapshot: Snapshot) {
  entry.snapshot = snapshot
  for (const listener of entry.listeners) {
    listener()
  }
}

function subscribe(key: string, listener: () => void) {
  const entry = entryOf(key)
  if (entry.listeners.size === 0) {
    // An entry left by a render that never mounted may predate a write by other code.
    const fresh = fromStorage(key)
    if (fresh.raw !== entry.snapshot.raw) {
      entry.snapshot = fresh
    }
  }
  entry.listeners.add(listener)
  return () => {
    entry.listeners.delete(listener)
    if (entry.listeners.size === 0 && entries.get(key) === entry) {
      entries.delete(key)
    }
  }
}

/** Writes `value` as JSON (undefined removes the key) and shows it to every useStoredState on `key`. */
function write(key: string, value: unknown) {
  try {
    if (value === undefined) {
      localStorage.removeItem(key)
    } else {
      localStorage.setItem(key, JSON.stringify(value))
    }
  } catch {
    // Storage can be blocked or full; the choice then lasts while some component shows it.
  }
  const entry = entries.get(key)
  if (entry !== undefined) {
    publish(entry, value === undefined ? missing : { raw: JSON.stringify(value), value })
  }
}

/**
 * State that survives a restart in localStorage. A stored value that fails `valid` is ignored. Every component on one
 * key shares one value, read from storage on the first render; server rendering and hydration show `fallback`.
 */
export function useStoredState<T>(
  key: string,
  fallback: T,
  valid: (value: unknown) => value is T,
): [T, (value: T) => void] {
  const watch = useCallback((listener: () => void) => subscribe(key, listener), [key])
  const snapshot = useSyncExternalStore(
    watch,
    () => entryOf(key).snapshot,
    () => missing,
  )
  // A fresh `valid` or `fallback` identity must not re-parse or hand out a new value.
  // biome-ignore lint/correctness/useExhaustiveDependencies: once per snapshot
  const value = useMemo(
    () => (snapshot.raw !== null && valid(snapshot.value) ? snapshot.value : fallback),
    [snapshot],
  )
  const set = useCallback((next: T) => write(key, next), [key])
  return [value, set]
}

export { read as readStored, write as writeStored }
