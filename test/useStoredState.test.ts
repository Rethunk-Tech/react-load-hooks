import { afterEach, expect, test } from 'bun:test'
import fc from 'fast-check'
import { readStored, writeStored } from '../src/useStoredState.ts'

afterEach(() => {
  localStorage.clear()
})

function parseOrRaw(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

test('readStored never throws and matches parse-then-valid', () => {
  fc.assert(
    fc.property(fc.string(), fc.string(), fc.double(), (key, raw, fallback) => {
      localStorage.setItem(key, raw)
      const result = readStored(key, fallback, isFiniteNumber)
      const parsed = parseOrRaw(raw)
      expect(result).toBe(isFiniteNumber(parsed) ? parsed : fallback)
    }),
  )
})

test('writeStored then readStored round-trips JSON values', () => {
  fc.assert(
    fc.property(fc.string(), fc.jsonValue(), (key, value) => {
      writeStored(key, value)
      const roundTripped = JSON.parse(JSON.stringify(value)) as unknown
      expect(readStored(key, null, (_v): _v is unknown => true)).toEqual(roundTripped)
    }),
  )
})

test('writeStored never throws', () => {
  fc.assert(
    fc.property(fc.string(), fc.anything(), (key, value) => {
      expect(() => {
        writeStored(key, value)
      }).not.toThrow()
    }),
  )
})
