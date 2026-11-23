import { afterAll, afterEach, expect, jest, test } from 'bun:test'

const testing = await import('@testing-library/react')
const { useInfoPopover } = await import('./useInfoPopover.ts')

afterEach(() => {
  testing.cleanup()
  jest.useRealTimers()
})
afterAll(() => {
  testing.cleanup()
})

function Host({ picked }: { picked: string[] }) {
  const { anchor, bind, surface } = useInfoPopover()
  return (
    <div>
      <button
        type="button"
        aria-label="row"
        data-testid="row"
        onClick={() => picked.push('row')}
        {...bind}
      />
      {anchor !== null && <div role="dialog" data-testid="pop" {...surface} />}
    </div>
  )
}

const advance = (ms: number) => testing.act(() => jest.advanceTimersByTime(ms))
const open = () => testing.screen.queryByTestId('pop') !== null

test('a mouse opens it on hover intent, the popover holds it open, and leaving or Escape closes it', () => {
  jest.useFakeTimers()
  testing.render(<Host picked={[]} />)
  const row = testing.screen.getByTestId('row')

  testing.fireEvent.mouseEnter(row)
  advance(399)
  expect(open()).toBe(false)
  advance(1)
  expect(open()).toBe(true)

  testing.fireEvent.mouseLeave(row)
  testing.fireEvent.mouseEnter(testing.screen.getByTestId('pop'))
  advance(1000)
  expect(open()).toBe(true)

  testing.fireEvent.mouseLeave(testing.screen.getByTestId('pop'))
  advance(149)
  expect(open()).toBe(true)
  advance(1)
  expect(open()).toBe(false)

  testing.fireEvent.mouseEnter(row)
  advance(400)
  testing.fireEvent.keyDown(row, { key: 'Escape' })
  expect(open()).toBe(false)
})

test('on a touch screen a long press opens it and swallows the tap; a drag does not open it', () => {
  jest.useFakeTimers()
  const real = globalThis.matchMedia
  globalThis.matchMedia = ((query: string) => ({
    matches: query === '(hover: none)',
  })) as typeof matchMedia
  try {
    const picked: string[] = []
    testing.render(<Host picked={picked} />)
    const row = testing.screen.getByTestId('row')

    testing.fireEvent.touchStart(row, { touches: [{ clientX: 0, clientY: 0 }] })
    testing.fireEvent.touchMove(row, { touches: [{ clientX: 20, clientY: 0 }] })
    advance(500)
    expect(open()).toBe(false)

    testing.fireEvent.touchStart(row, { touches: [{ clientX: 0, clientY: 0 }] })
    advance(500)
    expect(open()).toBe(true)
    testing.fireEvent.click(row)
    expect(picked).toEqual([])
    testing.fireEvent.click(row)
    expect(picked).toEqual(['row'])
  } finally {
    globalThis.matchMedia = real
  }
})
