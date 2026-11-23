import {
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type TouchEvent,
  useEffect,
  useRef,
  useState,
} from 'react'

const HOVER_INTENT_MS = 400
const LEAVE_GRACE_MS = 150
const LONG_PRESS_MS = 500
const TOUCH_SLOP_PX = 10

/**
 * When a row's details popover opens, without rendering it. With a mouse it opens on hover intent or keyboard focus,
 * stays open while the pointer or focus is on the row or the popover, and closes a grace period after both leave or at
 * once on Escape. On a touch screen (`touch`) a long press opens it and swallows the tap that would select the row.
 * Spread `bind` on the row and `surface` on the popover; `anchor` is the row while open. Back-button closing belongs to
 * the app's overlay stack: call it with `anchor !== null` and `close`.
 */
export function useInfoPopover() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pressed = useRef<{ fired: boolean; x: number; y: number }>({ fired: false, x: 0, y: 0 })
  const touch = globalThis.matchMedia?.('(hover: none)').matches ?? false
  const clear = () => globalThis.clearTimeout(timer.current)
  const later = (ms: number, run: () => void) => {
    clear()
    timer.current = globalThis.setTimeout(run, ms)
  }
  useEffect(() => () => globalThis.clearTimeout(timer.current), [])
  const close = () => {
    clear()
    setAnchor(null)
  }
  const leave = () => later(LEAVE_GRACE_MS, () => setAnchor(null))
  const onEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      close()
    }
  }
  const bind = touch
    ? {
        onTouchStart: (e: TouchEvent<HTMLElement>) => {
          const t = e.touches[0]
          const row = e.currentTarget
          pressed.current = { fired: false, x: t?.clientX ?? 0, y: t?.clientY ?? 0 }
          later(LONG_PRESS_MS, () => {
            pressed.current.fired = true
            setAnchor(row)
          })
        },
        onTouchMove: (e: TouchEvent<HTMLElement>) => {
          const t = e.touches[0]
          const p = pressed.current
          if (t && Math.hypot(t.clientX - p.x, t.clientY - p.y) > TOUCH_SLOP_PX) {
            clear()
          }
        },
        onTouchEnd: clear,
        onTouchCancel: clear,
        onContextMenu: (e: MouseEvent) => e.preventDefault(),
        onClickCapture: (e: MouseEvent) => {
          if (pressed.current.fired) {
            pressed.current.fired = false
            e.stopPropagation()
          }
        },
      }
    : {
        onMouseEnter: (e: MouseEvent<HTMLElement>) => {
          const row = e.currentTarget
          later(HOVER_INTENT_MS, () => setAnchor(row))
        },
        onMouseLeave: leave,
        onFocus: (e: FocusEvent<HTMLElement>) => {
          if (e.target.matches(':focus-visible')) {
            clear()
            setAnchor(e.currentTarget)
          }
        },
        onBlur: leave,
        onKeyDown: onEscape,
      }
  const surface = {
    onMouseEnter: clear,
    onMouseLeave: leave,
    onFocus: clear,
    onBlur: leave,
    onKeyDown: onEscape,
  }
  return { anchor, touch, close, bind, surface }
}
