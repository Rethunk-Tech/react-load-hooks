import { afterAll, expect, test } from 'bun:test'

const testing = await import('@testing-library/react')
const { useOnWindowFocus } = await import('./useOnWindowFocus.ts')

afterAll(() => {
  testing.cleanup()
})

test('fn runs on window focus while active, and not once it is off', () => {
  let n = 0
  const fn = () => {
    n += 1
  }
  const view = testing.renderHook(({ active }) => useOnWindowFocus(fn, active), {
    initialProps: { active: true },
  })
  testing.act(() => {
    globalThis.dispatchEvent(new Event('focus'))
  })
  expect(n).toBe(1)

  view.rerender({ active: false })
  testing.act(() => {
    globalThis.dispatchEvent(new Event('focus'))
  })
  expect(n).toBe(1)
})
