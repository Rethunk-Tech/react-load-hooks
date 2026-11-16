import { afterAll, expect, test } from 'bun:test'
import { createElement } from 'react'

const testing = await import('@testing-library/react')
const { readStored, useStoredState, writeStored } = await import('./useStoredState.ts')

afterAll(() => {
  testing.cleanup()
})

const isText = (v: unknown): v is string => typeof v === 'string'

function SsrStoredProbe() {
  const [value] = useStoredState('stored-test.ssr', 'fallback', isText)
  return createElement('span', null, value)
}

test('a stored string reads back whether it was written as JSON or bare', () => {
  localStorage.setItem('stored-test.json', JSON.stringify('run-1'))
  localStorage.setItem('stored-test.bare', 'run-2')
  expect(readStored('stored-test.json', '', isText)).toBe('run-1')
  expect(readStored('stored-test.bare', '', isText)).toBe('run-2')
  expect(readStored('stored-test.missing', 'none', isText)).toBe('none')
  localStorage.removeItem('stored-test.json')
  localStorage.removeItem('stored-test.bare')
})

test('the value follows the key when the key changes', () => {
  localStorage.setItem('stored-test.a', JSON.stringify('one'))
  localStorage.setItem('stored-test.b', JSON.stringify('two'))
  const view = testing.renderHook(({ key }) => useStoredState(key, '', isText), {
    initialProps: { key: 'stored-test.a' },
  })
  expect(view.result.current[0]).toBe('one')
  view.rerender({ key: 'stored-test.b' })
  expect(view.result.current[0]).toBe('two')
  testing.act(() => view.result.current[1]('three'))
  expect(localStorage.getItem('stored-test.b')).toBe('"three"')
  expect(localStorage.getItem('stored-test.a')).toBe('"one"')
  localStorage.removeItem('stored-test.a')
  localStorage.removeItem('stored-test.b')
})

test('the caller key reaches localStorage verbatim, with no prefix', () => {
  writeStored('stored-test.verbatim', { a: 1 })
  expect(localStorage.getItem('stored-test.verbatim')).toBe(JSON.stringify({ a: 1 }))
  expect(localStorage.length).toBe(1)
  localStorage.removeItem('stored-test.verbatim')
})

test('storage that throws reads as the fallback and writes nothing', () => {
  const real = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  const blocked = {
    getItem: () => {
      throw new Error('blocked')
    },
    setItem: () => {
      throw new Error('full')
    },
  }
  Object.defineProperty(globalThis, 'localStorage', { value: blocked, configurable: true })
  try {
    expect(readStored('stored-test.blocked', 'none', isText)).toBe('none')
    expect(() => writeStored('stored-test.blocked', 'x')).not.toThrow()
  } finally {
    if (real) {
      Object.defineProperty(globalThis, 'localStorage', real)
    }
  }
})

test('writeStored of undefined removes the key', () => {
  writeStored('stored-test.undef', 'keep')
  writeStored('stored-test.undef', undefined)
  expect(readStored('stored-test.undef', 'none', isText)).toBe('none')
})

test('hydrateRoot matches the fallback HTML, then storage replaces it after mount', async () => {
  localStorage.setItem('stored-test.ssr', JSON.stringify('from-storage'))
  const { renderToString } = await import('react-dom/server')
  const { hydrateRoot } = await import('react-dom/client')

  const realStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      throw new ReferenceError('localStorage is not defined')
    },
  })
  let html: string
  try {
    html = renderToString(createElement(SsrStoredProbe))
  } finally {
    if (realStorage) {
      Object.defineProperty(globalThis, 'localStorage', realStorage)
    }
  }
  expect(html).toContain('fallback')
  expect(html).not.toContain('from-storage')

  const container = document.createElement('div')
  document.body.appendChild(container)
  container.innerHTML = html

  const hydration: unknown[] = []
  const realError = console.error
  console.error = (...args: unknown[]) => {
    hydration.push(args)
    realError.apply(console, args)
  }
  let root: ReturnType<typeof hydrateRoot> | undefined
  try {
    testing.act(() => {
      root = hydrateRoot(container, createElement(SsrStoredProbe), {
        onRecoverableError(error) {
          hydration.push(error)
        },
      })
    })
    expect(String(hydration)).not.toMatch(/hydrat/i)
    expect(container.textContent).toBe('from-storage')
  } finally {
    console.error = realError
    testing.act(() => root?.unmount())
    container.remove()
    localStorage.removeItem('stored-test.ssr')
  }
})
