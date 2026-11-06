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

| Entry point                                                                  | Contract                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useLoaded(load, deps, initial, onError                                      | { onError?, keepAcrossKeys? }?)`                                                                                                                                                                                                                                                                                                                                  | Runs `load` when `deps` change, never while `load` is `null`. Only the newest run lands. New deps and a `null` load reset `data` to `initial`; a failed load keeps the last good `data` and sets `error`. `reload` re-runs with the same deps and keeps the old value until the answer arrives; `setData` edits the loaded value. `keepAcrossKeys: true` keeps `data` through new deps until the new answer lands; a `null` load still resets. |
| `useDebouncedLoad(load, deps, { initial, delayMs, onError? })`               | `useLoaded` after `delayMs` of quiet, keeping the last answer meanwhile. `delayMs` is read each time a load is scheduled, so it may be state. `run(next)` loads at once.                                                                                                                                                                                          |
| `loader(sink, options?)`                                                     | The same rules without React: `deps`, `run`, `stop`. `keepAcrossKeys` keeps the value across new deps; `defer` schedules each start.                                                                                                                                                                                                                              |
| `coalescer()`                                                                | Returns `(key, run)`. One `run` per key at a time; asks made meanwhile share a single follow-up run that starts when the current one settles, so a result is never older than its ask. Resolves with that run's outcome.                                                                                                                                          |
| `useStoredState(key, fallback, valid)`                                       | Reads `localStorage[key]` once per key; a value failing `valid`, or storage that throws, gives `fallback`. A bare non-JSON string written by other code reads back as that string. Writes `JSON.stringify(value)`.                                                                                                                                                |
| `readStored` / `writeStored`                                                 | The same read and write without a hook. The key is used verbatim: no prefix.                                                                                                                                                                                                                                                                                      |
| `useWidth()`                                                                 | `[ref, width]`; `0` until measured. Updates are flushed synchronously so a resize paints once.                                                                                                                                                                                                                                                                    |
| `sameValue(a, b)`                                                            | `a === b` or equal `JSON.stringify` text: for plain data a backend sends.                                                                                                                                                                                                                                                                                         |
| `keepUnchanged(prev, next, keyOf)`                                           | `next` with each item equal to the previous item of the same key replaced by that object; `prev` itself when the result is the same list.                                                                                                                                                                                                                         |
| `keepFields(prev, next)`                                                     | `next` with each field equal to `prev`'s kept as `prev`'s value, so a selector of an unchanged field returns the same object.                                                                                                                                                                                                                                     |
| `clockWhen(value, locale?)`                                                  | The time of day as the locale writes it; `''` for a zero (before 1970) or unparseable time. `value` is a string, number or `Date`.                                                                                                                                                                                                                                |
| `absoluteWhen(value, locale?)`                                               | Medium date and short time; `''` as above.                                                                                                                                                                                                                                                                                                                        |
| `relativeWhen(value, { withTime?, now?, locale?, fewSeconds?, absolute? }?)` | Within a minute either side of `now` it returns `fewSeconds` (English by default; pass the translated text); up to a week back, `Intl.RelativeTimeFormat` with `numeric: 'auto'`; otherwise (and for any time more than a minute ahead) a medium date, with the time when `withTime`. `absolute` always gives the date form. `''` for a zero or unparseable time. |
| `useDebouncedValue(value, ms)`                                               | Returns `value` once it has held still for `ms`; the first render returns it at once.                                                                                                                                                                                                                                                                             |
| `useNowValue(compute)` / `useSecondValue(compute, on)`                       | `compute(now)` must return a primitive; the component re-renders only when it changes. The timer runs only while a component watches it, and `useSecondValue`'s only while `on`.                                                                                                                                                                                  |

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
