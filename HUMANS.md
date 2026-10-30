# HUMANS.md

Run and use `react-load-hooks`. Internals: [AGENTS.md](AGENTS.md).

## Quick start

```bash
bun add @rethunk/react-load-hooks
```

```tsx
import { useLoaded, useStoredState } from '@rethunk/react-load-hooks'

const isSort = (v: unknown): v is 'name' | 'date' => v === 'name' || v === 'date'

function Repos({ owner }: { owner: string }) {
  const [sort, setSort] = useStoredState('repos.sort', 'name', isSort)
  const { data, loading, error } = useLoaded(
    () => fetch(`/api/${owner}/repos?sort=${sort}`).then((r) => r.json() as Promise<string[]>),
    [owner, sort],
    [],
  )
  if (loading) return <p>Loading</p>
  if (error) return <p>Failed</p>
  return (
    <ul onClick={() => setSort(sort === 'name' ? 'date' : 'name')}>
      {data.map((name) => (
        <li key={name}>{name}</li>
      ))}
    </ul>
  )
}
```

## Contracts

| Entry point | Contract |
| --- | --- |
| `useLoaded(load, deps, initial, onError?)` | Runs `load` when `deps` change, never while `load` is `null`. Only the newest run lands. New deps and a `null` load reset `data` to `initial`; a failed load keeps the last good `data` and sets `error`. `reload` re-runs with the same deps and keeps the old value until the answer arrives. |
| `useDebouncedLoad(load, deps, { initial, delayMs, onError? })` | `useLoaded` after `delayMs` of quiet, keeping the last answer meanwhile. `delayMs` is read each time a load is scheduled, so it may be state. `run(next)` loads at once. |
| `loader(sink, options?)` | The same rules without React: `deps`, `run`, `stop`. |
| `useStoredState(key, fallback, valid)` | Reads `localStorage[key]` once per key; a value failing `valid`, or storage that throws, gives `fallback`. A bare non-JSON string written by other code reads back as that string. Writes `JSON.stringify(value)`. |
| `readStored` / `writeStored` | The same read and write without a hook. The key is used verbatim: no prefix. |
| `useWidth()` | `[ref, width]`; `0` until measured. Updates are flushed synchronously so a resize paints once. |
| `useDebouncedValue(value, ms)` | Returns `value` once it has held still for `ms`; the first render returns it at once. |
| `useNowValue(compute)` / `useSecondValue(compute, on)` | `compute(now)` must return a primitive; the component re-renders only when it changes. The timer runs only while a component watches it. |

## Requirements

ES modules, read by a bundler or a runtime such as Bun or Node. Peer dependencies: `react` ^19.0.0, `react-dom` ^19.0.0. Developing the package takes `bun`, plus `lefthook`, `gitleaks` and `gate` on PATH if
you want the git hooks.

```bash
bun install
lefthook install
```

That is per clone; git does not commit hooks. Pre-commit scans staged changes for secrets, and
pre-push runs `gate`.

## Verify

```bash
gate
```
