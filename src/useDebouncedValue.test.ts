import { afterAll, expect, jest, test } from 'bun:test'

const testing = await import('@testing-library/react')
const { useDebouncedValue } = await import('./useDebouncedValue.ts')

afterAll(() => {
  jest.useRealTimers()
  testing.cleanup()
})

test('first render is immediate; later values settle after a quiet ms', () => {
  jest.useFakeTimers()
  const view = testing.renderHook(
    ({ value, ms }: { value: string; ms: number }) => useDebouncedValue(value, ms),
    { initialProps: { value: 'a', ms: 100 } },
  )

  let props = { value: 'a', ms: 100 }
  for (const step of [
    { value: 'a', ms: 100, advance: 0, want: 'a' },
    { value: 'b', ms: 100, advance: 99, want: 'a' },
    { value: 'b', ms: 100, advance: 1, want: 'b' },
    { value: 'c', ms: 100, advance: 50, want: 'b' },
    { value: 'd', ms: 100, advance: 99, want: 'b' },
    { value: 'd', ms: 100, advance: 1, want: 'd' },
    { value: 'e', ms: 200, advance: 100, want: 'd' },
    { value: 'e', ms: 200, advance: 100, want: 'e' },
  ]) {
    if (step.value !== props.value || step.ms !== props.ms) {
      props = { value: step.value, ms: step.ms }
      view.rerender(props)
    }
    if (step.advance > 0) {
      testing.act(() => {
        jest.advanceTimersByTime(step.advance)
      })
    }
    expect(view.result.current).toBe(step.want)
  }
})
