import React from 'react'

import UnsavedBar from './index'
import { InsetWindow, useKeyboardInset } from './use-keyboard-inset'
import Button from '@components/ui/button'
import '@testing-library/jest-dom'
import { act, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('UnsavedBar component', () => {
  const onPrimary = jest.fn()
  const onSecondary = jest.fn()
  const primary = { label: 'Save changes', busyLabel: 'Saving…', onPress: onPrimary }
  const secondary = { label: 'Discard changes', onPress: onSecondary }

  it('should be labeled by regionLabel', () => {
    render(<UnsavedBar phase="dirty" regionLabel="Unsaved changes" title="You have changes" />)

    expect(screen.getByRole('region', { name: 'Unsaved changes' })).toBeVisible()
  })

  it('should show title, detail, secondary and primary in the dirty phase', async () => {
    render(
      <UnsavedBar
        detail="Spam filter changed."
        phase="dirty"
        primary={primary}
        regionLabel="Unsaved changes"
        secondary={secondary}
        title="You have changes"
      />,
    )

    expect(screen.getByText('You have changes')).toBeVisible()
    expect(screen.getByText('Spam filter changed.')).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Discard changes' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(onSecondary).toHaveBeenCalledTimes(1)
    expect(onPrimary).toHaveBeenCalledTimes(1)
  })

  it('should show the busy label and ignore primary presses when busy', async () => {
    render(<UnsavedBar phase="busy" primary={primary} regionLabel="Saving" title="Saving your changes" />)

    await userEvent.click(screen.getByRole('button', { name: /Saving…/ }))

    expect(onPrimary).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /Saving…/ })).toBeVisible()
  })

  it('should show an unavailable secondary action its reason when pressed', async () => {
    render(
      <UnsavedBar
        phase="dirty"
        primary={primary}
        regionLabel="Unsaved changes"
        secondary={{ ...secondary, unavailableReason: 'Wait for the save to finish.' }}
        title="You have changes"
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Discard changes' }))

    expect(screen.getByRole('status')).toHaveTextContent('Wait for the save to finish.')
    expect(onSecondary).not.toHaveBeenCalled()
  })

  it('should hand primaryRef the primary button', () => {
    const primaryRef = React.createRef<HTMLButtonElement>()
    render(
      <UnsavedBar
        phase="dirty"
        primary={primary}
        primaryRef={primaryRef}
        regionLabel="Unsaved changes"
        secondary={secondary}
        title="You have changes"
      />,
    )

    expect(primaryRef.current).toBe(screen.getByRole('button', { name: 'Save changes' }))
  })

  it('should show only the title and primary when compact', () => {
    render(
      <UnsavedBar
        compact={true}
        detail="Spam filter changed."
        note="A note."
        phase="dirty"
        primary={primary}
        regionLabel="Unsaved changes"
        secondary={secondary}
        title="You have changes"
      />,
    )

    expect(screen.getByText('You have changes')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeVisible()
    expect(screen.queryByText('Spam filter changed.')).toBeNull()
    expect(screen.queryByText('A note.')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Discard changes' })).toBeNull()
  })

  it('should render the note under the detail', () => {
    render(
      <UnsavedBar
        detail="Spam filter changed."
        note="Fix the highlighted box first."
        phase="failed"
        regionLabel="Unsaved changes"
        title="Can't save yet"
      />,
    )

    expect(screen.getByText('Fix the highlighted box first.')).toBeVisible()
  })

  it('should let the title hold buttons', async () => {
    const onSection = jest.fn()
    render(
      <UnsavedBar
        phase="dirty"
        regionLabel="Unsaved changes"
        title={
          <>
            Changes in <Button onClick={onSection}>Spam filter</Button>
          </>
        }
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Spam filter' }))

    expect(onSection).toHaveBeenCalledTimes(1)
  })

  it('should hand its ref to a focusable message block', () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<UnsavedBar phase="saved" ref={ref} regionLabel="Saved" title="Saved" />)

    ref.current?.focus()

    expect(ref.current).toHaveFocus()
  })
})

describe('useKeyboardInset', () => {
  // A visual viewport that can be resized the way the keyboard resizes it.
  const fakeWindow = (height: number): { viewport: EventTarget & { height: number }; win: InsetWindow } => {
    const viewport = Object.assign(new EventTarget(), { height, offsetTop: 0 })
    return { viewport, win: { innerHeight: 800, visualViewport: viewport as unknown as VisualViewport } }
  }

  it('should return what the keyboard covers below the visual viewport', () => {
    const { win } = fakeWindow(400)

    const { result } = renderHook(() => useKeyboardInset(win))

    expect(result.current).toBe(400)
  })

  it('should follow the visual viewport as it resizes', () => {
    const { viewport, win } = fakeWindow(400)
    const { result } = renderHook(() => useKeyboardInset(win))

    act(() => {
      viewport.height = 800
      viewport.dispatchEvent(new Event('resize'))
    })

    expect(result.current).toBe(0)
  })

  it('should return 0 without a visual viewport', () => {
    const { result } = renderHook(() => useKeyboardInset({ innerHeight: 800, visualViewport: null }))

    expect(result.current).toBe(0)
  })

  it('should read the page window when none is passed', () => {
    const { result } = renderHook(() => useKeyboardInset())

    expect(result.current).toBe(0)
  })
})
