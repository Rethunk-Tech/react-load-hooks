# AGENTS.md

`@rethunk/react-load-hooks` is a set of React hooks for async loads and small screen state. It
peers on `react` and `react-dom` and imports nothing else; it knows no application, framework or
backend. The tests use happy-dom (`test/dom.ts`) and Testing Library, as devDependencies only.

## Gate

`gate` is the command; each check in `.gate.toml` is a `package.json` script, so a contributor, the
pre-push hook and CI run the same thing. The `build` gate emits `dist` and then checks what `npm pack`
would upload.

## Shape

- Relative imports keep their `.ts` extension; `tsc -p tsconfig.json` rewrites it to `.js` on emit.
- `package.json` `files` is `dist` and `src`: the declaration maps point at `../src`.
- The only entry point is `src/index.ts`; a name not exported there is not API.
- `loader` owns the ordering rule (a generation counter); both load hooks are thin adapters, so a
  change to "who may land" is made once, there, and covered by `loader.test.ts` without a DOM.
- The `useNow` clocks hold their time outside React and expose it through `useSyncExternalStore`.
  The snapshot is `compute(now)`, a primitive, which is what makes React skip a render when the
  answer is unchanged. Do not return an object from `compute`.
- Storage keys are the caller's, verbatim. A prefix here would orphan data an application already
  wrote.
- `react` and `react-dom` stay peers: a second copy of React breaks every hook.

## Files

| File                                          | Holds                                                                                                                             |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `src/index.ts`                                | The public surface                                                                                                                |
| `src/loader.ts`                               | React-free newest-load-wins logic                                                                                                 |
| `src/useLoaded.ts`, `src/useDebouncedLoad.ts` | The load hooks over `loader`                                                                                                      |
| `src/coalescer.ts`                            | Per-key one-running, one-queued task runner                                                                                       |
| `src/useDebouncedValue.ts`                    | Settled value                                                                                                                     |
| `src/useStoredState.ts`                       | `localStorage` state and its plain read and write                                                                                 |
| `src/useWidth.ts`                             | Element width                                                                                                                     |
| `src/sameValue.ts`                            | `sameValue`, `keepUnchanged`, `keepFields`: keep the stored value when a fresh answer is equal                                    |
| `src/when.ts`                                 | `clockWhen`, `absoluteWhen`, `relativeWhen`: Intl time labels; the caller passes the locale and the translated "few seconds" text |
| `src/useNow.ts`                               | Shared clocks                                                                                                                     |
