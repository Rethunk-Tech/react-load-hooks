import { afterAll, afterEach, beforeEach, expect, jest, setSystemTime, test } from 'bun:test'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'

const testing = await import('@testing-library/react')
const { useNowValue, useSecondValue } = await import('./useNow.ts')

beforeEach(() => {
  jest.useFakeTimers()
  setSystemTime(new Date('2026-01-01T00:00:00Z'))
})
afterEach(() => {
  testing.cleanup()
  jest.useRealTimers()
  setSystemTime()
})
afterAll(() => {
  testing.cleanup()
})

test('a watcher re-renders only when its answer changes, and the clock stops with the last one', () => {
  let renders = 0
  const view = testing.renderHook(
    ({ on }) => {
      renders += 1
      return useSecondValue((now) => Math.floor(now / 10_000), on)
    },
    { initialProps: { on: true } },
  )
  const first = view.result.current
  const afterMount = renders

  testing.act(() => {
    setSystemTime(new Date('2026-01-01T00:00:03Z'))
    jest.advanceTimersByTime(3000)
  })
  expect(view.result.current).toBe(first)
  expect(renders).toBe(afterMount)

  testing.act(() => {
    setSystemTime(new Date('2026-01-01T00:00:10Z'))
    jest.advanceTimersByTime(7000)
  })
  expect(view.result.current).toBe(first + 1)

  view.rerender({ on: false })
  expect(jest.getTimerCount()).toBe(0)
  view.unmount()
  expect(jest.getTimerCount()).toBe(0)
})

function NowLabel() {
  return createElement(
    'span',
    null,
    useNowValue((now) => String(now)),
  )
}

test('useNowValue can render to a string on the server', () => {
  expect(() => renderToString(createElement(NowLabel))).not.toThrow()
})

test('the minute clock ticks once for every watcher and is idle when none is left', () => {
  const a = testing.renderHook(() => useNowValue((now) => Math.floor(now / 60_000)))
  const b = testing.renderHook(() => useNowValue((now) => Math.floor(now / 60_000)))
  expect(jest.getTimerCount()).toBe(1)
  a.unmount()
  expect(jest.getTimerCount()).toBe(1)
  b.unmount()
  expect(jest.getTimerCount()).toBe(0)
})
