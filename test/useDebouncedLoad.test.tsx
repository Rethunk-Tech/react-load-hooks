import { expect, test } from 'bun:test'
import { render, waitFor } from '@testing-library/react'
import { type Load, useDebouncedLoad } from '../src/index.ts'

type Snapshot = { data: string; loading: boolean }

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
