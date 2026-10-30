import { afterAll, expect, test } from 'bun:test'

const testing = await import('@testing-library/react')
const { useLoaded } = await import('./useLoaded.ts')

afterAll(() => {
  testing.cleanup()
})

// Flushes pending promises inside act, so the state update they make renders before the test reads it.
const settle = () => testing.act(async () => new Promise<void>((resolve) => setTimeout(resolve, 0)))

// The ordering rules (newest load wins, reset, keepAcrossKeys, null load, stop) are loader.test.ts's; this is the React
// wiring: state set from the sink, onError read through the ref, setData, reload, and the unmount stop.
test('useLoaded wires loader to state, onError, reload and unmount', async () => {
  let mode: 'good' | 'fail' | 'late' = 'good'
  let n = 0
  const boom = new Error('offline')
  const late = Promise.withResolvers<number>()
  const seen: unknown[] = []
  const { result, rerender, unmount } = testing.renderHook(
    ({ key }) =>
      useLoaded(
        () => {
          n += 1
          if (mode === 'late') {
            return late.promise
          }
          return mode === 'good' ? Promise.resolve(n) : Promise.reject(boom)
        },
        [key],
        0,
        (e) => seen.push(e),
      ),
    { initialProps: { key: 'a' } },
  )
  expect(result.current.loading).toBe(true)
  await settle()
  expect(result.current).toMatchObject({ data: 1, loading: false, error: null })

  testing.act(() => result.current.setData(10))
  expect(result.current.data).toBe(10)

  mode = 'fail'
  await testing.act(() => result.current.reload())
  expect(result.current).toMatchObject({ data: 10, loading: false, error: boom })
  expect(seen).toEqual([boom])

  mode = 'good'
  rerender({ key: 'b' })
  expect(result.current).toMatchObject({ data: 0, loading: true, error: null })
  await settle()
  expect(result.current).toMatchObject({ data: 3, error: null })

  mode = 'late'
  testing.act(() => {
    result.current.reload()
  })
  unmount()
  late.reject(boom)
  await late.promise.catch(() => undefined)
  expect(seen).toEqual([boom])
})
