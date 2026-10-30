# Changelog

Notable changes to `react-load-hooks`. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.1] - 2026-10-30

### Added

- `coalescer`: per key, one slow task running and at most one queued, so a result is never older than its ask.
- `useLoaded(..., { keepAcrossKeys })`: keep `data` across new deps until the new answer lands.

## [0.1.0] - 2026-10-30

### Added

- `useLoaded`, `useDebouncedLoad` and the React-free `loader`: loads where only the newest answer lands.
- `useStoredState`, `readStored`, `writeStored`: `localStorage` state under the caller's exact key.
- `useWidth`, `useDebouncedValue`, `useNowValue`, `useSecondValue`.

[0.1.1]: https://github.com/Rethunk-Tech/react-load-hooks/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/Rethunk-Tech/react-load-hooks/releases/tag/v0.1.0
[Unreleased]: https://github.com/Rethunk-Tech/react-load-hooks/commits/main
