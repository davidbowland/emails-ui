import { useEffect, useState } from 'react'

export type InsetWindow = Pick<Window, 'innerHeight' | 'visualViewport'>

// How far the on-screen keyboard covers the bottom of the layout viewport, in px. iOS Safari keeps
// the layout viewport the same size when the keyboard opens and shrinks only the visual viewport, so
// a bar stuck to the bottom would sit under the keyboard. 0 where there is no visualViewport, or
// where the browser resizes the page for the keyboard (Android with interactive-widget).
export const useKeyboardInset = (win?: InsetWindow): number => {
  const [inset, setInset] = useState(0)

  useEffect(() => {
    // Read here, not as a default parameter, so a static build (no window) never touches it.
    const target = win ?? window
    const viewport = target.visualViewport
    if (!viewport) return undefined
    const update = (): void =>
      setInset(Math.max(0, Math.round(target.innerHeight - viewport.height - viewport.offsetTop)))
    update()
    viewport.addEventListener('resize', update)
    viewport.addEventListener('scroll', update)
    return () => {
      viewport.removeEventListener('resize', update)
      viewport.removeEventListener('scroll', update)
    }
  }, [win])

  return inset
}
