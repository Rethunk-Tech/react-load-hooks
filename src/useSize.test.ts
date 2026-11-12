import { afterAll, expect, test } from 'bun:test'
import { createElement, useRef, useState } from 'react'

const testing = await import('@testing-library/react')
const { useSize } = await import('./useSize.ts')
const { useWidth } = await import('./useWidth.ts')

afterAll(() => {
  testing.cleanup()
})

const observers: TestResizeObserver[] = []

class TestResizeObserver implements ResizeObserver {
  readonly #cb: ResizeObserverCallback
  disconnected

  constructor(callback: ResizeObserverCallback) {
    this.#cb = callback
    this.disconnected = false
    observers.push(this)
  }

  observe(): void {
    // happy-dom's observer never delivers; tests call fire().
  }

  unobserve(): void {
    // Pair of observe(); tests do not unobserve individually.
  }

  disconnect(): void {
    this.disconnected = true
  }

  fire(): void {
    if (!this.disconnected) {
      this.#cb([], this)
    }
  }
}

globalThis.ResizeObserver = TestResizeObserver

function setClientSize(el: HTMLElement, width: number, height: number) {
  Object.defineProperty(el, 'clientWidth', { configurable: true, get: () => width })
  Object.defineProperty(el, 'clientHeight', { configurable: true, get: () => height })
}

function box(width: number, height: number) {
  const el = document.createElement('div')
  setClientSize(el, width, height)
  document.body.appendChild(el)
  return el
}

function WidthHost() {
  const [ref, width] = useWidth<HTMLDivElement>()
  return createElement('div', {
    ref: (node: HTMLDivElement | null) => {
      if (node) {
        setClientSize(node, 64, 20)
      }
      ref(node)
    },
    'data-width': String(width),
  })
}

test('a missing element stays 0; an attached one is measured before paint', () => {
  observers.length = 0
  const view = testing.renderHook(({ ref }) => useSize(ref), {
    initialProps: { ref: { current: null as HTMLDivElement | null } },
  })
  expect(view.result.current).toEqual({ width: 0, height: 0 })
  expect(observers).toHaveLength(0)

  const el = box(120, 40)
  view.rerender({ ref: { current: el } })
  expect(view.result.current).toEqual({ width: 120, height: 40 })
})

test('a resize lands before the caller continues, and an unchanged size keeps the same object', () => {
  observers.length = 0
  const el = box(80, 20)
  const view = testing.renderHook(() => useSize({ current: el }))
  const first = view.result.current
  expect(first).toEqual({ width: 80, height: 20 })

  observers.at(-1)?.fire()
  expect(view.result.current).toBe(first)

  setClientSize(el, 200, 90)
  observers.at(-1)?.fire()
  expect(view.result.current).toEqual({ width: 200, height: 90 })
})

test('a new ref is measured and unmount disconnects the observer', () => {
  observers.length = 0
  const a = box(10, 10)
  const b = box(30, 40)
  const view = testing.renderHook(({ ref }) => useSize(ref), {
    initialProps: { ref: { current: a } },
  })
  expect(view.result.current).toEqual({ width: 10, height: 10 })

  view.rerender({ ref: { current: b } })
  expect(view.result.current).toEqual({ width: 30, height: 40 })

  const ro = observers.at(-1)
  view.unmount()
  expect(ro?.disconnected).toBe(true)
  setClientSize(b, 99, 99)
  ro?.fire()
})

function DelayedSize() {
  const ref = useRef<HTMLDivElement | null>(null)
  const size = useSize(ref)
  const [show, setShow] = useState(false)
  return createElement(
    'div',
    { 'data-width': String(size.width), 'data-height': String(size.height) },
    createElement('button', { type: 'button', onClick: () => setShow(true) }, 'show'),
    show
      ? createElement('div', {
          ref: (node: HTMLDivElement | null) => {
            if (node) {
              setClientSize(node, 90, 30)
            }
            ref.current = node
          },
        })
      : null,
  )
}

function DelayedWidth() {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [show, setShow] = useState(false)
  return createElement(
    'div',
    null,
    createElement('button', { type: 'button', onClick: () => setShow(true) }, 'show'),
    show
      ? createElement('span', {
          ref: (node: HTMLDivElement | null) => {
            if (node) {
              setClientSize(node, 80, 24)
            }
            ref(node)
          },
          'data-width': String(width),
        })
      : null,
  )
}

test('useWidth still returns the measured client width', () => {
  observers.length = 0
  const view = testing.render(createElement(WidthHost))
  expect(view.container.firstElementChild?.getAttribute('data-width')).toBe('64')
})

test('useSize measures an element that mounts after the first layout', () => {
  observers.length = 0
  const view = testing.render(createElement(DelayedSize))
  expect(view.container.firstElementChild?.getAttribute('data-width')).toBe('0')
  testing.act(() => {
    view.getByRole('button').click()
  })
  expect(view.container.firstElementChild?.getAttribute('data-width')).toBe('90')
  expect(view.container.firstElementChild?.getAttribute('data-height')).toBe('30')
})

test('useWidth measures an element that mounts after the first layout', () => {
  observers.length = 0
  const view = testing.render(createElement(DelayedWidth))
  testing.act(() => {
    view.getByRole('button').click()
  })
  expect(view.container.querySelector('[data-width]')?.getAttribute('data-width')).toBe('80')
})
