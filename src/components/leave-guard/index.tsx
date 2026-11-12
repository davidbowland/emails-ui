import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

import Dialog from '@components/ui/dialog'

interface Registration {
  returnFocusTo: () => HTMLElement | null
  sections: string[]
}

interface PendingLeave extends Registration {
  proceed: () => void
}

interface LeaveGuardContextValue {
  // True once markLeaving is called, until the next registration.
  isLeaving: () => boolean
  markLeaving: () => void
  register: (registration: Registration | undefined) => void
  requestLeave: (proceed: () => void) => void
}

// Outside a provider nothing is guarded: leaving proceeds at once.
const LeaveGuardContext = createContext<LeaveGuardContextValue>({
  isLeaving: () => false,
  markLeaving: () => undefined,
  register: () => undefined,
  requestLeave: (proceed) => proceed(),
})

// "A", "A and B", "A, B, and C".
export const joinSections = (sections: string[]): string =>
  sections.length <= 2
    ? sections.join(' and ')
    : `${sections.slice(0, -1).join(', ')}, and ${sections[sections.length - 1]}`

export const LeaveGuardProvider = ({ children }: { children: React.ReactNode }): React.ReactNode => {
  const registrationRef = useRef<Registration | undefined>(undefined)
  // Set by markLeaving, just before an exit that unloads the page (signing out, deleting the
  // account), so the page's own warning does not ask again. A proceed that does not unload (opening
  // the delete dialog) leaves the warning on. A new registration (a later edit) clears it.
  const leavingRef = useRef(false)
  // The last request stays after the dialog closes: Dialog reads returnFocusTo at that moment.
  const [pending, setPending] = useState<PendingLeave | undefined>()
  const [open, setOpen] = useState(false)
  // Leave queues proceed so it runs after the leave Dialog's close effect, not in the same render.
  const [queued, setQueued] = useState<(() => void) | undefined>()

  const register = useCallback((registration: Registration | undefined): void => {
    registrationRef.current = registration
    leavingRef.current = false
  }, [])

  const isLeaving = useCallback((): boolean => leavingRef.current, [])

  const markLeaving = useCallback((): void => {
    leavingRef.current = true
  }, [])

  const requestLeave = useCallback((proceed: () => void): void => {
    const registration = registrationRef.current
    if (!registration) {
      proceed()
      return
    }
    setPending({ ...registration, proceed })
    setOpen(true)
  }, [])

  const value = useMemo(
    () => ({ isLeaving, markLeaving, register, requestLeave }),
    [isLeaving, markLeaving, register, requestLeave],
  )

  const keepEditing = useCallback((): void => setOpen(false), [])
  const leave = (): void => {
    setQueued(() => pending?.proceed)
    setOpen(false)
  }

  useEffect(() => {
    if (!queued) return
    setQueued(undefined)
    queued()
  }, [queued])

  return (
    <LeaveGuardContext.Provider value={value}>
      {children}
      <Dialog
        cancelLabel="Keep editing"
        confirmLabel="Leave without saving"
        onCancel={keepEditing}
        onConfirm={leave}
        open={open}
        // Only Keep editing returns focus to the registration; Leave hands focus to what proceed opens.
        returnFocusTo={queued ? undefined : pending?.returnFocusTo}
        title="Leave without saving?"
      >
        <p>If you leave now, you&apos;ll lose your changes to {joinSections(pending?.sections ?? [])}.</p>
      </Dialog>
    </LeaveGuardContext.Provider>
  )
}

// Settings registers what would be lost; undefined when nothing would be.
export const useLeaveGuardRegistration = (
  sections: string[] | undefined,
  returnFocusTo: () => HTMLElement | null,
): void => {
  const { isLeaving, register } = useContext(LeaveGuardContext)
  const returnFocusRef = useRef(returnFocusTo)
  returnFocusRef.current = returnFocusTo
  const key = sections?.join('\u0000')

  useEffect(() => {
    if (key === undefined) return undefined
    register({ returnFocusTo: () => returnFocusRef.current(), sections: key.split('\u0000') })
    const warn = (event: BeforeUnloadEvent): void => {
      if (isLeaving()) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => {
      window.removeEventListener('beforeunload', warn)
      register(undefined)
    }
  }, [isLeaving, key, register])
}

// Callers that leave the page ask first. proceed runs at once when no guard is registered. A proceed
// that unloads the page calls markLeaving first, so the browser's own warning does not ask again.
export const useLeaveGuard = (): { markLeaving: () => void; requestLeave: (proceed: () => void) => void } => {
  const { markLeaving, requestLeave } = useContext(LeaveGuardContext)
  return { markLeaving, requestLeave }
}
