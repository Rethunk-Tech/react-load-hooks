import { afterAll, expect, test } from 'bun:test'
import { createElement } from 'react'

const testing = await import('@testing-library/react')
const { usePopoverAnchor } = await import('./usePopoverAnchor.ts')

afterAll(() => {
  testing.cleanup()
})

const other = document.createElement('i')
other.setAttribute('data-name', 'elsewhere')

function Host() {
  const { anchor, show, open, hide } = usePopoverAnchor()
  return createElement(
    'div',
    { 'data-anchor': anchor?.getAttribute('data-name') ?? '' },
    createElement('button', { type: 'button', 'data-name': 'open', onClick: show }, 'open'),
    createElement('button', { type: 'button', 'data-name': 'hide', onClick: hide }, 'hide'),
    createElement(
      'button',
      { type: 'button', 'data-name': 'other', onClick: () => open(other) },
      'other',
    ),
    createElement(
      'button',
      { type: 'button', 'data-name': 'null', onClick: () => open(null) },
      'null',
    ),
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

test('open anchors to any element, null closes', () => {
  testing.cleanup()
  const view = testing.render(createElement(Host))
  const anchor = () => view.container.firstElementChild?.getAttribute('data-anchor')

  testing.act(() => {
    view.getByRole('button', { name: 'other' }).click()
  })
  expect(anchor()).toBe('elsewhere')

  testing.act(() => {
    view.getByRole('button', { name: 'null' }).click()
  })
  expect(anchor()).toBe('')
})
