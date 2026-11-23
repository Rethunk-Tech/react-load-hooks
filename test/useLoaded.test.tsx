import { expect, test } from 'bun:test'
import { render, waitFor } from '@testing-library/react'
import { type Load, useLoaded } from '../src/index.ts'

const settled = (data: unknown, loading: boolean, error: unknown = null) => ({
  data,
  loading,
  error,
})
type Snapshot = ReturnType<typeof settled>

function Probe({ which, load, seen }: { which: string; load: Load<string>; seen: Snapshot[] }) {
  const { data, loading, error } = useLoaded(load, [which], 'INITIAL', () => undefined)
  seen.push(settled(data, loading, error))
  return null
}

test('the first render after deps change answers for the new key, not the previous one', async () => {
  const seen: Snapshot[] = []
  const load: Load<string> = () => Promise.resolve('data')
  const { rerender } = render(<Probe which="a" load={load} seen={seen} />)
  await waitFor(() => expect(seen.at(-1)).toEqual(settled('data', false)))

  seen.length = 0
  rerender(<Probe which="b" load={load} seen={seen} />)
  expect(seen[0]).toEqual(settled('INITIAL', true))
})

test('the first render after deps change hides the previous key error', async () => {
  const seen: Snapshot[] = []
  const failing: Load<string> = () => Promise.reject(new Error('a failed'))
  const { rerender } = render(<Probe which="a" load={failing} seen={seen} />)
  await waitFor(() => expect(seen.at(-1)).toEqual(settled('INITIAL', false, new Error('a failed'))))

  seen.length = 0
  rerender(<Probe which="b" load={() => Promise.resolve('data')} seen={seen} />)
  expect(seen[0]).toEqual(settled('INITIAL', true))
})

function ModeProbe({
  load,
  which,
  heard,
  seen,
}: {
  load: Load<string> | null
  which: string
  heard: string[]
  seen: Snapshot[]
}) {
  const { data, loading, error } = useLoaded(load, [which], 'INITIAL', {
    keepAcrossKeys: true,
    keepWhenIdle: true,
    onValue: (value) => heard.push(value),
    errorValue: () => 'OFFLINE',
  })
  seen.push(settled(data, loading, error))
  return null
}

test('opt-in modes keep data while idle, hear each value, and replace data on failure', async () => {
  const seen: Snapshot[] = []
  const heard: string[] = []
  const ok: Load<string> = () => Promise.resolve('data')
  const { rerender } = render(<ModeProbe load={ok} which="a" heard={heard} seen={seen} />)
  await waitFor(() => expect(seen.at(-1)).toEqual(settled('data', false)))
  expect(heard).toEqual(['data'])

  seen.length = 0
  rerender(<ModeProbe load={null} which="b" heard={heard} seen={seen} />)
  await waitFor(() => expect(seen.at(-1)).toEqual(settled('data', false)))
  expect(seen.every((s) => s.data === 'data')).toBe(true)

  const failure = new Error('down')
  rerender(<ModeProbe load={() => Promise.reject(failure)} which="c" heard={heard} seen={seen} />)
  await waitFor(() => expect(seen.at(-1)).toEqual(settled('OFFLINE', false, failure)))
  expect(heard).toEqual(['data'])
})
