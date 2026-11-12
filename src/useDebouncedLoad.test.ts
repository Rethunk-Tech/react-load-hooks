import { afterAll, expect, test } from 'bun:test'

const testing = await import('@testing-library/react')
const { useDebouncedLoad } = await import('./useDebouncedLoad.ts')

afterAll(() => {
  testing.cleanup()
})

const sleep = (ms: number) => testing.act(async () => new Promise<void>((r) => setTimeout(r, ms)))

test('a deps change clears the previous error while the new load runs', async () => {
  const next = Promise.withResolvers<string>()
  const view = testing.renderHook(
    ({ key }) =>
      useDebouncedLoad(
        () => (key === 'foo' ? Promise.reject(new Error('404')) : next.promise),
        [key],
        { initial: '', delayMs: 1 },
      ),
    { initialProps: { key: 'foo' } },
  )
  await sleep(20)
  expect(String(view.result.current.error)).toContain('404')

  view.rerender({ key: 'food' })
  await sleep(20)
  expect(view.result.current.loading).toBe(true)
  expect(view.result.current.error).toBe(null)
  next.resolve('food')
})

test('a delayMs that changes between renders applies to the next scheduled load', async () => {
  const view = testing.renderHook(
    ({ key, delayMs }) =>
      useDebouncedLoad(() => Promise.resolve(key), [key], { initial: '', delayMs }),
    { initialProps: { key: 'a', delayMs: 1 } },
  )
  await sleep(20)
  expect(view.result.current.data).toBe('a')

  view.rerender({ key: 'b', delayMs: 150 })
  await sleep(40)
  expect(view.result.current.data).toBe('a')
  await sleep(200)
  expect(view.result.current.data).toBe('b')
})
