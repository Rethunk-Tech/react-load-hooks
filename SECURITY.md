# Security

## Supported versions

The latest tagged release. There are no long-lived release branches, so a fix ships in the next tag
rather than being backported.

## Reporting a vulnerability

Use GitHub's **private vulnerability reporting** on this repository (Security → Report a
vulnerability). It stays private until a fix ships.

Please do not open a public issue for a suspected vulnerability first.

## What is in scope

- `readStored` and `useStoredState` parse whatever `localStorage` holds for a key. A crafted value
  must reach the caller only if it passes the caller's `valid` guard, and must never throw.

## What is out of scope

- The keys and the values an application chooses to store, and what `valid` accepts.
- Storage another script on the same origin rewrites: `localStorage` is not a trust boundary.
