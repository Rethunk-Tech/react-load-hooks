import { afterAll, expect, test } from 'bun:test'
import { createElement } from 'react'

const testing = await import('@testing-library/react')
const { usePopoverAnchor } = await import('./usePopoverAnchor.ts')

afterAll(() => {
  testing.cleanup()
})

function Host() {
  const { anchor, show, hide } = usePopoverAnchor()
  return createElement(
    'div',
    { 'data-anchor': anchor ? anchor.id : '' },
    createElement('button', { type: 'button', id: 'open', onClick: show }, 'open'),
    createElement('button', { type: 'button', id: 'hide', onClick: hide }, 'hide'),
  )
}

test('show hangs the popover on the click target, hide clears it', () => {
  const view = testing.render(createElement(Host))
  expect(view.container.firstElementChild?.getAttribute('data-anchor')).toBe('')

  testing.act(() => {
    view.getByRole('button', { name: 'open' }).click()
  })
  expect(view.container.firstElementChild?.getAttribute('data-anchor')).toBe('open')

  testing.act(() => {
    view.getByRole('button', { name: 'hide' }).click()
  })
  expect(view.container.firstElementChild?.getAttribute('data-anchor')).toBe('')
})
