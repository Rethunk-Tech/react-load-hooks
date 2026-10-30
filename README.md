<h1 align="center">react-load-hooks</h1>

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/@rethunk/react-load-hooks.svg)](https://www.npmjs.com/package/@rethunk/react-load-hooks)
[![TypeScript](https://img.shields.io/badge/TypeScript-typed-3178C6?logo=typescript&logoColor=white)](tsconfig.json)

</div>

---

React hooks for async loads that never land out of order, plus the small state hooks an app builds screens from. Package `@rethunk/react-load-hooks`. First consumer: Mortar.

Only the newest load lands: a slower, older answer or error never overwrites a newer one, and an
unmounted component hears nothing.

```tsx
const { data, loading, error, reload } = useLoaded(() => fetchRepos(owner), [owner], [])
```

## Quick start

```bash
bun add @rethunk/react-load-hooks
```

A worked example and the contracts: [HUMANS.md](HUMANS.md).

## Features

- `useLoaded` and `useDebouncedLoad` fetch on dependency changes and drop superseded answers.
- `loader` is the same logic without React, for a store or a class.
- `useStoredState` persists UI state in `localStorage`.
- `useWidth` tracks an element's width before paint; `useDebouncedValue` settles a fast-changing value.
- `useNowValue` and `useSecondValue` share one timer per period and re-render only on a changed answer.

## Documentation

| Doc | Audience |
| --- | --- |
| [HUMANS.md](HUMANS.md) | Running and using the package |
| [AGENTS.md](AGENTS.md) | Internals, invariants, and why |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Process — commits, tests, docs |
| [SECURITY.md](SECURITY.md) | Vulnerability disclosure |
| [CHANGELOG.md](CHANGELOG.md) | Release notes |

## License

MIT — see [LICENSE](LICENSE). © 2026 Rethunk.Tech, LLC.
