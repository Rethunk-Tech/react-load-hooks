import { type RefObject, useEffect, useRef } from 'react'

/** When `active` turns off and focus fell to `document.body`, focus `target`. */
export function useRestoreFocus(active: boolean, target: RefObject<HTMLElement | null>) {
  const was = useRef(active)
  useEffect(() => {
    if (was.current && !active && document.activeElement === document.body) {
      target.current?.focus()
    }
    was.current = active
  }, [active, target])
}
