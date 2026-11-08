import { afterAll, expect, test } from 'bun:test'
import { createElement } from 'react'

const testing = await import('@testing-library/react')
const { usePopoverAnchor } = await import('./usePopoverAnchor.ts')

afterAll(() => {
  testing.cleanup()
})

test('show hangs the popover on the click target, hide clears it', () => {
  let seen: HTMLElement | null | undefined
  function Host() {
    const { anchor, show, hide } = usePopoverAnchor()
    seen = anchor
    return createElement(
      'div',
      null,
      createElement('button', { type: 'button', onClick: show }, 'open'),
      createElement('button', { type: 'button', onClick: hide }, 'hide'),
    )
  }
  const view = testing.render(createElement(Host))
  const [open, close] = view.container.querySelectorAll('button')
  expect(seen).toBe(null)

  testing.act(() => {
    open.click()
  })
  expect(seen).toBe(open)

  testing.act(() => {
    close.click()
  })
  expect(seen).toBe(null)
})
