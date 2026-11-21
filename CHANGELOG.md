# Changelog

Notable changes to `react-load-hooks`. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.6.0] - 2026-11-21

### Changed

- Breaking: `useWidth` now returns a `RefCallback<T>` instead of a `RefObject<T | null>`, so it can see an element that mounts later. If you read `.current` off that ref, keep your own ref and call both from one callback: `ref={(el) => { mine.current = el; widthRef(el) }}`.

### Added

- `loader()` returns `changed(deps, load)`, which says whether a set of deps would act (new deps, or the null switch, which resets even on unchanged deps).

### Fixed

- `useWidth` observes an element that mounts later, and `useSize` resets to 0 when the measured node unmounts.
- Load hooks reset on a deps change in the render that changes it, not one render late.
- `useLoaded` stores a function initial value as the value instead of calling it.
- `useDebouncedLoad` clears its error when a load starts.
- `loader`'s `run()` cancels a pending debounce, and `coalescer` runs the latest queued task.
- `useStoredState` reads storage after mount so SSR hydrates, and drops the key when you write `undefined`.
- `useNow` provides a server snapshot.
- `sameValue` keeps `NaN` distinct from `null`.
- `when` treats the Unix epoch as a zero time, counts calendar days for relative day labels, and returns an empty string for an invalid locale.

## [0.5.0] - 2026-11-08

### Added

- `useOnWindowFocus`, `useRestoreFocus` and `usePopoverAnchor`: run a callback on window focus, return focus when a surface closes, and hold the element a popover hangs from.

## [0.4.0] - 2026-11-08

### Added

- `useSize`: an element's client width and height, kept current before paint. `useWidth` is the same measurement for width only.

## [0.3.1] - 2026-11-07

### Fixed

- A load that throws synchronously settles through the sink instead of escaping the caller.

## [0.3.0] - 2026-11-02

### Added

- `useLoaded`, `useDebouncedLoad` and `loader` pass the load an `AbortSignal`, aborted when a later load, new deps or unmount supersedes it, so a `fetch` given the signal stops too. Existing loads without the parameter work unchanged. Exports the `Load` type.

## [0.2.0] - 2026-10-30

### Added

- `sameValue`, `keepUnchanged` and `keepFields`: keep the stored value when a fresh backend answer is equal.
- `clockWhen`, `absoluteWhen` and `relativeWhen` (with `WhenOptions`): `Intl` time labels.

## [0.1.1] - 2026-10-30

### Added

- `coalescer`: per key, one slow task running and at most one queued, so a result is never older than its ask.
- `useLoaded(..., { keepAcrossKeys })`: keep `data` across new deps until the new answer lands.

## [0.1.0] - 2026-10-30

### Added

- `useLoaded`, `useDebouncedLoad` and the React-free `loader`: loads where only the newest answer lands.
- `useStoredState`, `readStored`, `writeStored`: `localStorage` state under the caller's exact key.
- `useWidth`, `useDebouncedValue`, `useNowValue`, `useSecondValue`.

[0.2.0]: https://github.com/Rethunk-Tech/react-load-hooks/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/Rethunk-Tech/react-load-hooks/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/Rethunk-Tech/react-load-hooks/releases/tag/v0.1.0
[Unreleased]: https://github.com/Rethunk-Tech//usr/local/src/com.github/Rethunk-Tech/react-load-hooks/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/Rethunk-Tech//usr/local/src/com.github/Rethunk-Tech/react-load-hooks/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/Rethunk-Tech/react-load-hooks/compare/v0.3.1...v0.4.0
[0.3.1]: https://github.com/Rethunk-Tech/react-load-hooks/compare/v0.3.0...v0.3.1
