import { afterAll, expect, test } from 'bun:test'
import type { MouseEvent } from 'react'

const testing = await import('@testing-library/react')
const { usePopoverAnchor } = await import('./usePopoverAnchor.ts')

afterAll(() => {
  testing.cleanup()
})

test('show hangs the popover on the click target, hide clears it', () => {
  const view = testing.renderHook(() => usePopoverAnchor())
  expect(view.result.current.anchor).toBe(null)

  const el = document.createElement('button')
  testing.act(() => {
    view.result.current.show({ currentTarget: el } as MouseEvent<HTMLElement>)
  })
  expect(view.result.current.anchor).toBe(el)

  testing.act(() => {
    view.result.current.hide()
  })
  expect(view.result.current.anchor).toBe(null)
})
