import { type RefObject, useLayoutEffect, useState } from 'react'
import { flushSync } from 'react-dom'

/** The client size of the element the ref points at, kept current as it resizes; 0 until measured. */
function useSize<T extends HTMLElement>(
  ref: RefObject<T | null>,
): { width: number; height: number } {
  const [size, setSize] = useState({ width: 0, height: 0 })
  // Measured before paint, so the first frame is laid out for the real size rather than 0.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) {
      return
    }
    const apply = () =>
      setSize((prev) =>
        prev.width === el.clientWidth && prev.height === el.clientHeight
          ? prev
          : { width: el.clientWidth, height: el.clientHeight },
      )
    // Rendered before the browser paints the resize: a default-priority update would paint one frame laid out for the
    // old size, with whatever columns or scrollbar that size implies.
    const ro = new ResizeObserver(() => flushSync(apply))
    ro.observe(el)
    apply()
    return () => ro.disconnect()
  })
  return size
}

export { useSize }
