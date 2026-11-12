import React from 'react'

import { LeaveGuardProvider, useLeaveGuard, useLeaveGuardRegistration } from './index'
import '@testing-library/jest-dom'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

interface HarnessProps {
  // Given markLeaving, which a proceed that unloads the page calls first.
  proceed: (markLeaving: () => void) => void
  returnFocusTo?: () => HTMLElement | null
  sections?: string[]
}

const Harness = ({ proceed, returnFocusTo = () => null, sections }: HarnessProps): React.ReactNode => {
  useLeaveGuardRegistration(sections, returnFocusTo)
  const { markLeaving, requestLeave } = useLeaveGuard()
  return <button onClick={() => requestLeave(() => proceed(markLeaving))}>Go</button>
}

// A proceed that unloads the page, the way signing out does.
const unload = (markLeaving: () => void): void => markLeaving()

const setup = (props: HarnessProps) =>
  render(
    <LeaveGuardProvider>
      <Harness {...props} />
    </LeaveGuardProvider>,
  )

const beforeUnload = (): Event => {
  const event = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(event)
  return event
}

describe('LeaveGuardProvider', () => {
  it('requestLeave runs proceed at once with no registration', async () => {
    const proceed = jest.fn()
    setup({ proceed })

    await userEvent.click(screen.getByRole('button', { name: 'Go' }))

    expect(proceed).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('Leave without saving?')).not.toBeVisible()
  })

  it('with a registration, requestLeave opens "Leave without saving?"', async () => {
    const proceed = jest.fn()
    setup({ proceed, sections: ['Spam filter'] })

    await userEvent.click(screen.getByRole('button', { name: 'Go' }))

    expect(screen.getByRole('dialog', { name: 'Leave without saving?' })).toBeVisible()
    expect(screen.getByText("If you leave now, you'll lose your changes to Spam filter.")).toBeVisible()
    expect(proceed).not.toHaveBeenCalled()
  })

  it('Leave without saving runs proceed', async () => {
    const proceed = jest.fn()
    setup({ proceed, sections: ['Spam filter'] })

    await userEvent.click(screen.getByRole('button', { name: 'Go' }))
    await userEvent.click(screen.getByRole('button', { name: 'Leave without saving' }))

    expect(proceed).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog', { name: 'Leave without saving?' })).not.toBeInTheDocument()
  })

  it('Keep editing closes, runs nothing, and focuses returnFocusTo()', async () => {
    const proceed = jest.fn()
    const target = document.createElement('input')
    document.body.appendChild(target)
    setup({ proceed, returnFocusTo: () => target, sections: ['Spam filter'] })

    await userEvent.click(screen.getByRole('button', { name: 'Go' }))
    await userEvent.click(screen.getByRole('button', { name: 'Keep editing' }))

    expect(proceed).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog', { name: 'Leave without saving?' })).not.toBeInTheDocument()
    expect(target).toHaveFocus()
    target.remove()
  })

  it('Escape acts as Keep editing', async () => {
    const proceed = jest.fn()
    setup({ proceed, sections: ['Spam filter'] })

    await userEvent.click(screen.getByRole('button', { name: 'Go' }))
    await userEvent.keyboard('{Escape}')

    expect(proceed).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog', { name: 'Leave without saving?' })).not.toBeInTheDocument()
  })

  it('registers beforeunload only while sections are defined', () => {
    const proceed = jest.fn()
    const view = setup({ proceed, sections: ['Spam filter'] })
    expect(beforeUnload().defaultPrevented).toBe(true)

    view.rerender(
      <LeaveGuardProvider>
        <Harness proceed={proceed} />
      </LeaveGuardProvider>,
    )
    expect(beforeUnload().defaultPrevented).toBe(false)
  })

  it('expect no beforeunload warning once a proceed that unloads marks leaving', async () => {
    setup({ proceed: unload, sections: ['Spam filter'] })

    await userEvent.click(screen.getByRole('button', { name: 'Go' }))
    await userEvent.click(screen.getByRole('button', { name: 'Leave without saving' }))

    expect(beforeUnload().defaultPrevented).toBe(false)
  })

  it('expect the beforeunload warning kept after Leave when proceed does not unload', async () => {
    setup({ proceed: jest.fn(), sections: ['Spam filter'] })

    await userEvent.click(screen.getByRole('button', { name: 'Go' }))
    await userEvent.click(screen.getByRole('button', { name: 'Leave without saving' }))

    expect(beforeUnload().defaultPrevented).toBe(true)
  })

  it('expect a new registration after leaving to warn again', async () => {
    const view = setup({ proceed: unload, sections: ['Spam filter'] })

    await userEvent.click(screen.getByRole('button', { name: 'Go' }))
    await userEvent.click(screen.getByRole('button', { name: 'Leave without saving' }))
    view.rerender(
      <LeaveGuardProvider>
        <Harness proceed={unload} sections={['Spam filter', 'Forwarding']} />
      </LeaveGuardProvider>,
    )

    expect(beforeUnload().defaultPrevented).toBe(true)
  })

  it.each([
    [['A'], 'A'],
    [['A', 'B'], 'A and B'],
    [['A', 'B', 'C'], 'A, B, and C'],
  ])('sections join as %j', async (sections, joined) => {
    setup({ proceed: jest.fn(), sections })

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Go' }))
    })

    expect(screen.getByText(`If you leave now, you'll lose your changes to ${joined}.`)).toBeVisible()
  })
})
