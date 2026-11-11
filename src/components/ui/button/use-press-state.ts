import React, { useCallback, useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'

import { TriangleAlertIcon } from '@components/ui/icons'

// Shared by Button and IconButton only. A button is ready, busy or unavailable (spec G4), and is
// never natively disabled, so it stays in the tab order in every state.

export interface PressStateOptions {
  'aria-describedby'?: string
  busy?: boolean
  onBlur?: React.FocusEventHandler<HTMLButtonElement>
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
  onKeyDown?: React.KeyboardEventHandler<HTMLButtonElement>
  ref?: React.Ref<HTMLButtonElement>
  unavailableReason?: string
}

export interface PressButtonProps {
  'aria-busy'?: true
  'aria-describedby'?: string
  'aria-disabled'?: true
  onBlur: React.FocusEventHandler<HTMLButtonElement>
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
  onKeyDown: React.KeyboardEventHandler<HTMLButtonElement>
  ref: (node: HTMLButtonElement | null) => void
}

export interface PressState {
  buttonProps: PressButtonProps
  // The hidden description, the status region and the bubble; render it beside the button.
  reason: React.ReactNode
}

export interface BubblePosition {
  bottom?: number
  left: number
  top?: number
}

interface AnchorRect {
  bottom: number
  left: number
  top: number
}

interface Size {
  height: number
  width: number
}

const BUBBLE_GAP = 6
const VIEWPORT_MARGIN = 8
// The bubble opens above the button when there is under this much room below, or under the
// bubble's own height plus the gap, whichever is more.
const FLIP_THRESHOLD = 80

// Below the button, or above it when it wouldn't fit below. Kept inside the viewport sideways.
export const placeBubble = (anchor: AnchorRect, viewport: Size, bubble: Size): BubblePosition => {
  const left = Math.max(VIEWPORT_MARGIN, Math.min(anchor.left, viewport.width - bubble.width - VIEWPORT_MARGIN))
  return viewport.height - anchor.bottom < Math.max(FLIP_THRESHOLD, bubble.height + BUBBLE_GAP)
    ? { bottom: viewport.height - anchor.top + BUBBLE_GAP, left }
    : { left, top: anchor.bottom + BUBBLE_GAP }
}

export interface FrameThrottle {
  // Drops a scheduled call that hasn't run yet.
  cancel: () => void
  // Schedules fn for the next animation frame, unless a call is already waiting for it.
  run: () => void
}

// Collapses a burst of calls (every scroll or resize event) into one call per animation frame.
// The frame functions are injectable so tests can step frames by hand.
export const throttleToFrame = (
  fn: () => void,
  requestFrame: (callback: FrameRequestCallback) => number = (callback) => window.requestAnimationFrame(callback),
  cancelFrame: (handle: number) => void = (handle) => window.cancelAnimationFrame(handle),
): FrameThrottle => {
  let pending: number | undefined
  return {
    cancel: () => {
      if (pending !== undefined) {
        cancelFrame(pending)
        pending = undefined
      }
    },
    run: () => {
      if (pending === undefined) {
        pending = requestFrame(() => {
          pending = undefined
          fn()
        })
      }
    },
  }
}

const assignRef = <T>(ref: React.Ref<T> | undefined, value: T | null): void => {
  if (typeof ref === 'function') {
    ref(value)
  } else if (ref) {
    ref.current = value
  }
}

const subscribeToNothing = (): (() => void) => () => undefined

// False while rendering on the server and hydrating, true after: the bubble portals into
// document.body, which only exists in the browser.
const useIsClient = (): boolean =>
  useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  )

export const usePressState = ({
  'aria-describedby': callerDescribedBy,
  busy = false,
  onBlur,
  onClick,
  onKeyDown,
  ref,
  unavailableReason,
}: PressStateOptions): PressState => {
  const reasonId = useId()
  const isClient = useIsClient()
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const bubbleRef = useRef<HTMLSpanElement | null>(null)
  const [open, setOpen] = useState(false)
  const [pressCount, setPressCount] = useState(0)
  const [position, setPosition] = useState<BubblePosition>({ left: 0, top: 0 })

  const unavailable = !busy && Boolean(unavailableReason)
  // Busy wins, and a cleared reason closes the bubble, so the next press runs onClick.
  if (open && !unavailable) {
    setOpen(false)
  }
  const shown = open && unavailable

  useLayoutEffect(() => {
    if (!shown) return
    const place = (): void => {
      const button = buttonRef.current
      if (button) {
        setPosition(
          placeBubble(
            button.getBoundingClientRect(),
            { height: window.innerHeight, width: window.innerWidth },
            { height: bubbleRef.current?.offsetHeight ?? 0, width: bubbleRef.current?.offsetWidth ?? 0 },
          ),
        )
      }
    }
    place()
    // At most one placement per frame, however fast the scroll and resize events arrive.
    const throttledPlace = throttleToFrame(place)
    // Capture, so scrolling any ancestor (not just the window) moves the bubble with its button.
    window.addEventListener('scroll', throttledPlace.run, true)
    window.addEventListener('resize', throttledPlace.run)
    return () => {
      window.removeEventListener('scroll', throttledPlace.run, true)
      window.removeEventListener('resize', throttledPlace.run)
      throttledPlace.cancel()
    }
  }, [shown, unavailableReason, pressCount])

  // A tap elsewhere closes the bubble. iOS Safari doesn't move focus on a tap, so blur alone would
  // leave it open.
  useLayoutEffect(() => {
    if (!shown) return
    const closeOnOutsidePress = (event: PointerEvent): void => {
      if (!buttonRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', closeOnOutsidePress)
    return () => document.removeEventListener('pointerdown', closeOnOutsidePress)
  }, [shown])

  const mergedRef = useCallback(
    (node: HTMLButtonElement | null): void => {
      buttonRef.current = node
      assignRef(ref, node)
    },
    [ref],
  )

  // Enter and Space on a native <button> fire click, so this one handler covers every press.
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
    if (busy) {
      event.preventDefault()
    } else if (unavailable) {
      event.preventDefault()
      // Safari doesn't focus a clicked button; focusing it here lets blur close the bubble. Only for
      // a real pointer press (detail > 0): a synthetic click, such as a form's implicit submit from
      // Enter in a text field, must leave focus where it is.
      if (event.detail > 0) {
        event.currentTarget.focus()
      }
      setOpen(true)
      setPressCount((count) => count + 1)
    } else {
      onClick?.(event)
    }
  }

  // Escape closes only the bubble: preventDefault tells a surrounding Dialog to ignore it, and
  // stopPropagation keeps it from reaching document-level listeners.
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>): void => {
    if (event.key === 'Escape' && shown) {
      event.preventDefault()
      event.stopPropagation()
      setOpen(false)
    }
    onKeyDown?.(event)
  }

  const handleBlur = (event: React.FocusEvent<HTMLButtonElement>): void => {
    setOpen(false)
    onBlur?.(event)
  }

  const describedBy = [callerDescribedBy, unavailable ? reasonId : undefined].filter(Boolean).join(' ') || undefined

  // The visual bubble only, hidden from assistive tech: the status region below speaks for it. It
  // portals to the body so position: fixed can't be trapped by a transformed or overflow-hidden
  // ancestor.
  const bubble =
    shown && isClient
      ? createPortal(
          React.createElement(
            'span',
            { 'aria-hidden': true, className: 'btn-reason animate-fade-in', ref: bubbleRef, style: position },
            React.createElement(TriangleAlertIcon, { size: 14, style: { color: 'var(--accent)', flexShrink: 0 } }),
            React.createElement('span', null, unavailableReason),
          ),
          document.body,
        )
      : null

  // The status region stays inline, beside the button, so it is inside any aria-modal dialog
  // around it; content outside a modal dialog is dropped by screen readers. It is mounted, empty,
  // whenever a reason is set, so filling it on a press is announced reliably, and each press
  // fills it with a fresh node (keyed by the press count) so the reason is announced again.
  // The description is `hidden`: aria-describedby still reads it, and browse mode doesn't.
  const reason = unavailableReason
    ? React.createElement(
        React.Fragment,
        null,
        React.createElement('span', { hidden: true, id: reasonId }, unavailableReason),
        React.createElement(
          'span',
          { 'aria-live': 'polite', className: 'sr-only', role: 'status' },
          shown ? React.createElement('span', { key: pressCount }, unavailableReason) : null,
        ),
        bubble,
      )
    : null

  return {
    buttonProps: {
      'aria-busy': busy || undefined,
      'aria-describedby': describedBy,
      'aria-disabled': busy || unavailable || undefined,
      onBlur: handleBlur,
      onClick: handleClick,
      onKeyDown: handleKeyDown,
      ref: mergedRef,
    },
    reason,
  }
}
