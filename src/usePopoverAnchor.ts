import { type MouseEvent, useState } from 'react'

/**
 * The element a popover or menu hangs from, null while closed. `show` anchors to the click target;
 * `open` anchors to any element (null closes); `hide` closes.
 */
export function usePopoverAnchor() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  return {
    anchor,
    show: (e: MouseEvent<HTMLElement>) => setAnchor(e.currentTarget),
    open: setAnchor,
    hide: () => setAnchor(null),
  }
}
