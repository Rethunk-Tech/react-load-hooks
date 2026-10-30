import { expect, test } from 'bun:test'
import { coalescer } from './coalescer.ts'

function gate() {
  let open: () => void = () => undefined
  const promise = new Promise<void>((resolve) => {
    open = resolve
  })
  return { promise, open }
}

test('asks made while one runs share one follow-up run, per key', async () => {
  const run = coalescer()
  const first = gate()
  let calls = 0
  const task = (g?: ReturnType<typeof gate>) => () => {
    calls += 1
    return g ? g.promise : Promise.resolve()
  }
  const a = run('k', task(first))
  const b = run('k', task())
  const c = run('k', task())
  expect(b).toBe(c)
  expect(calls).toBe(1)
  await run('other', task())
  expect(calls).toBe(2)
  first.open()
  await Promise.all([a, b])
  expect(calls).toBe(3)
  await run('k', task())
  expect(calls).toBe(4)
})

test('a failed run still lets the queued one start', async () => {
  const run = coalescer()
  const first = gate()
  const a = run('k', () => first.promise.then(() => Promise.reject(new Error('x'))))
  const b = run('k', () => Promise.resolve())
  first.open()
  await expect(a).rejects.toThrow('x')
  await b
})
