import { type RefObject, useLayoutEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'

/** The client width of the element the ref is put on, kept current as it resizes; 0 until measured. */
function useWidth<T extends HTMLElement>(): [RefObject<T | null>, number] {
  const ref = useRef<T | null>(null)
  const [width, setWidth] = useState(0)
  // Measured before paint, so the first frame is laid out for the real width rather than 0.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) {
      return
    }
    // Rendered before the browser paints the resize: a default-priority update would paint one frame laid out for the
    // old width, with whatever columns or scrollbar that width implies.
    const ro = new ResizeObserver(() => flushSync(() => setWidth(el.clientWidth)))
    ro.observe(el)
    setWidth(el.clientWidth)
    return () => ro.disconnect()
  }, [])
  return [ref, width]
}

export { useWidth }
