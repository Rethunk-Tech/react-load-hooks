import { afterAll, expect, test } from 'bun:test'

const testing = await import('@testing-library/react')
const { useDebouncedLoad } = await import('./useDebouncedLoad.ts')

afterAll(() => {
  testing.cleanup()
})

const sleep = (ms: number) => testing.act(async () => new Promise<void>((r) => setTimeout(r, ms)))

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
