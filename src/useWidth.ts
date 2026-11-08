import { type RefObject, useRef } from 'react'
import { useSize } from './useSize.ts'

/** The client width of the element the ref is put on, kept current as it resizes; 0 until measured. */
function useWidth<T extends HTMLElement>(): [RefObject<T | null>, number] {
  const ref = useRef<T | null>(null)
  const { width } = useSize(ref)
  return [ref, width]
}

export { useWidth }
