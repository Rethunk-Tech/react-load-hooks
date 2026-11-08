import { afterAll, expect, test } from 'bun:test'

const testing = await import('@testing-library/react')
const { useRestoreFocus } = await import('./useRestoreFocus.ts')

afterAll(() => {
  testing.cleanup()
})

test('when active turns off and focus is on the body, the target is focused', () => {
  const target = document.createElement('button')
  const other = document.createElement('button')
  document.body.append(target, other)
  other.focus()

  const view = testing.renderHook(({ active }) => useRestoreFocus(active, { current: target }), {
    initialProps: { active: true },
  })
  other.blur()
  expect(document.activeElement).toBe(document.body)

  view.rerender({ active: false })
  expect(document.activeElement).toBe(target)
})
