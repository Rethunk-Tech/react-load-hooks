import { expect, test } from 'bun:test'
import { render, waitFor } from '@testing-library/react'
import { type Load, useDebouncedLoad } from '../src/index.ts'

interface Snapshot {
  data: string
  loading: boolean
}

function Probe({ load, seen }: { load: Load<string> | null; seen: Snapshot[] }) {
  const { data, loading } = useDebouncedLoad(load, [], { initial: 'INITIAL', delayMs: 0 })
  seen.push({ data, loading })
  return null
}

test('the first render after the load becomes null shows the initial value again', async () => {
  const seen: Snapshot[] = []
  const load: Load<string> = () => Promise.resolve('data')
  const { rerender } = render(<Probe load={load} seen={seen} />)
  await waitFor(() => expect(seen.at(-1)).toEqual({ data: 'data', loading: false }))

  seen.length = 0
  rerender(<Probe load={null} seen={seen} />)
  expect(seen[0]).toEqual({ data: 'INITIAL', loading: false })
})

function ModeProbe({
  load,
  heard,
  seen,
}: {
  load: Load<string> | null
  heard: string[]
  seen: Snapshot[]
}) {
  const { data, loading } = useDebouncedLoad(load, [load], {
    initial: 'INITIAL',
    delayMs: 0,
    keepWhenIdle: true,
    onValue: (value) => heard.push(value),
    errorValue: () => 'EMPTY',
  })
  seen.push({ data, loading })
  return null
}

test('opt-in modes keep data while idle, hear each value, and replace data on failure', async () => {
  const seen: Snapshot[] = []
  const heard: string[] = []
  const { rerender } = render(
    <ModeProbe load={() => Promise.resolve('data')} heard={heard} seen={seen} />,
  )
  await waitFor(() => expect(seen.at(-1)).toEqual({ data: 'data', loading: false }))
  expect(heard).toEqual(['data'])

  seen.length = 0
  rerender(<ModeProbe load={null} heard={heard} seen={seen} />)
  await waitFor(() => expect(seen.at(-1)).toEqual({ data: 'data', loading: false }))
  expect(seen.every((s) => s.data === 'data')).toBe(true)

  rerender(<ModeProbe load={() => Promise.reject(new Error('down'))} heard={heard} seen={seen} />)
  await waitFor(() => expect(seen.at(-1)).toEqual({ data: 'EMPTY', loading: false }))
})
