import React from 'react'

import Button from './index'
import { placeBubble, throttleToFrame } from './use-press-state'
import Dialog from '@components/ui/dialog'
import { SaveIcon } from '@components/ui/icons'
import Spinner from '@components/ui/spinner'
import '@testing-library/jest-dom'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

jest.mock('@components/ui/spinner')

describe('Button component', () => {
  const onClick = jest.fn()

  beforeAll(() => {
    jest.mocked(Spinner).mockReturnValue(<span data-testid="spinner" />)
  })

  describe('ready', () => {
    it('should call onClick when clicked', async () => {
      render(<Button onClick={onClick}>Save</Button>)

      await userEvent.click(screen.getByRole('button', { name: 'Save' }))

      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it.each(['{Enter}', ' '])('should call onClick when %s is pressed', async (key) => {
      render(<Button onClick={onClick}>Save</Button>)

      await userEvent.tab()
      await userEvent.keyboard(key)

      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('should not submit a form by default', async () => {
      const onSubmit = jest.fn((event: React.FormEvent) => event.preventDefault())
      render(
        <form onSubmit={onSubmit}>
          <Button>Save</Button>
        </form>,
      )

      await userEvent.click(screen.getByRole('button', { name: 'Save' }))

      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('should submit a form when it is a submit button', async () => {
      const onSubmit = jest.fn((event: React.FormEvent) => event.preventDefault())
      render(
        <form onSubmit={onSubmit}>
          <Button type="submit">Save</Button>
        </form>,
      )

      await userEvent.click(screen.getByRole('button', { name: 'Save' }))

      expect(onSubmit).toHaveBeenCalledTimes(1)
    })

    it('should draw its icon at the given size', () => {
      render(
        <Button icon={SaveIcon} iconSize={13}>
          Save
        </Button>,
      )

      expect(screen.getByTestId('icon-Save')).toHaveAttribute('size', '13')
    })

    it('should render its icon without adding to its name', () => {
      render(
        <Button icon={SaveIcon} variant="primary">
          Save
        </Button>,
      )

      expect(screen.getByRole('button', { name: 'Save' })).toContainElement(screen.getByTestId('icon-Save'))
    })

    it.each(['primary', 'secondary', 'danger', 'toolbar', 'shell', 'attachment'] as const)(
      'should render the %s variant as a button',
      (variant) => {
        render(<Button variant={variant}>Go</Button>)

        expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument()
      },
    )

    it('should have no description of its own', () => {
      render(<Button>Save</Button>)

      expect(screen.getByRole('button', { name: 'Save' })).not.toHaveAccessibleDescription()
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
  })

  describe('busy', () => {
    it('should show the busy label and a spinner', () => {
      render(
        <Button busy busyLabel="Saving…" icon={SaveIcon} variant="primary">
          Save
        </Button>,
      )

      const button = screen.getByRole('button', { name: 'Saving…' })
      expect(button).toHaveAttribute('aria-busy', 'true')
      expect(button).toContainElement(screen.getByTestId('spinner'))
      expect(jest.mocked(Spinner)).toHaveBeenCalledWith({ size: 16, surface: 'accent' }, undefined)
    })

    it('should keep its label when there is no busy label', () => {
      render(
        <Button busy variant="shell">
          Save
        </Button>,
      )

      expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('aria-busy', 'true')
      expect(jest.mocked(Spinner)).toHaveBeenCalledWith({ size: 16, surface: 'shell' }, undefined)
    })

    it('should render its label once when there is no busy label', () => {
      render(
        <Button busy icon={SaveIcon}>
          Save
        </Button>,
      )

      expect(screen.getAllByText('Save')).toHaveLength(1)
      expect(screen.queryByTestId('icon-Save')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Save' })).toContainElement(screen.getByTestId('spinner'))
    })

    it('should keep a hidden copy of the ready label behind a busy label', () => {
      render(
        <Button busy busyLabel="Saving…">
          Save
        </Button>,
      )

      expect(screen.getByRole('button', { name: 'Saving…' })).toBeInTheDocument()
      expect(screen.getByText('Save')).toHaveAttribute('aria-hidden', 'true')
    })

    it.each([
      [9, 12],
      [13, 12],
      [15, 14],
      [18, 16],
      [20, 20],
      [28, 24],
    ] as const)('should size the spinner for a %i icon at %i', (iconSize, spinnerSize) => {
      render(
        <Button busy icon={SaveIcon} iconSize={iconSize}>
          Save
        </Button>,
      )

      expect(jest.mocked(Spinner)).toHaveBeenCalledWith({ size: spinnerSize, surface: 'paper' }, undefined)
    })

    it('should draw a paper spinner for the other variants', () => {
      render(
        <Button busy variant="danger">
          Delete
        </Button>,
      )

      expect(jest.mocked(Spinner)).toHaveBeenCalledWith({ size: 16, surface: 'paper' }, undefined)
    })

    it('should ignore a click, even a double click', async () => {
      render(
        <Button busy busyLabel="Saving…" onClick={onClick}>
          Save
        </Button>,
      )

      await userEvent.dblClick(screen.getByRole('button', { name: 'Saving…' }))

      expect(onClick).not.toHaveBeenCalled()
      expect(screen.getByRole('button', { name: 'Saving…' })).toBeInTheDocument()
    })

    it.each(['{Enter}', ' '])('should stay focusable and ignore %s', async (key) => {
      render(
        <Button busy busyLabel="Saving…" onClick={onClick}>
          Save
        </Button>,
      )

      await userEvent.tab()
      await userEvent.keyboard(key)

      expect(screen.getByRole('button', { name: 'Saving…' })).toHaveFocus()
      expect(onClick).not.toHaveBeenCalled()
    })

    it('should not submit its form', async () => {
      const onSubmit = jest.fn((event: React.FormEvent) => event.preventDefault())
      render(
        <form onSubmit={onSubmit}>
          <Button busy busyLabel="Saving…" type="submit">
            Save
          </Button>
        </form>,
      )

      await userEvent.click(screen.getByRole('button', { name: 'Saving…' }))
      await userEvent.keyboard('{Enter}')

      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('should win over an unavailable reason', async () => {
      render(
        <>
          <p id="hint">Saves your settings</p>
          <Button
            aria-describedby="hint"
            busy
            busyLabel="Saving…"
            onClick={onClick}
            unavailableReason="Nothing to save."
          >
            Save
          </Button>
        </>,
      )

      await userEvent.click(screen.getByRole('button', { name: 'Saving…' }))

      expect(onClick).not.toHaveBeenCalled()
      expect(screen.getByRole('status')).toBeEmptyDOMElement()
      expect(screen.getByRole('button', { name: 'Saving…' })).toHaveAccessibleDescription('Saves your settings')
    })
  })

  describe('unavailable', () => {
    it('should describe the reason before any press', () => {
      render(<Button unavailableReason="Nothing to save yet.">Save</Button>)

      expect(screen.getByRole('button', { name: 'Save' })).toHaveAccessibleDescription('Nothing to save yet.')
      expect(screen.getByRole('status')).toBeEmptyDOMElement()
    })

    it("should append the reason to the caller's description", () => {
      render(
        <>
          <p id="hint">Saves your settings</p>
          <Button aria-describedby="hint" unavailableReason="Nothing to save yet.">
            Save
          </Button>
        </>,
      )

      expect(screen.getByRole('button', { name: 'Save' })).toHaveAccessibleDescription(
        'Saves your settings Nothing to save yet.',
      )
    })

    it('should show the reason instead of calling onClick', async () => {
      render(
        <Button onClick={onClick} unavailableReason="Nothing to save yet.">
          Save
        </Button>,
      )

      await userEvent.click(screen.getByRole('button', { name: 'Save' }))

      expect(onClick).not.toHaveBeenCalled()
      expect(screen.getByRole('status')).toHaveTextContent('Nothing to save yet.')
    })

    it.each(['{Enter}', ' '])('should show the reason when %s is pressed', async (key) => {
      render(
        <Button onClick={onClick} unavailableReason="Nothing to save yet.">
          Save
        </Button>,
      )

      await userEvent.tab()
      await userEvent.keyboard(key)

      expect(onClick).not.toHaveBeenCalled()
      expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus()
      expect(screen.getByRole('status')).toHaveTextContent('Nothing to save yet.')
    })

    it('should keep the reason open when pressed again', async () => {
      render(<Button unavailableReason="Nothing to save yet.">Save</Button>)

      await userEvent.click(screen.getByRole('button', { name: 'Save' }))
      await userEvent.click(screen.getByRole('button', { name: 'Save' }))

      expect(screen.getByRole('status')).toHaveTextContent('Nothing to save yet.')
    })

    it('should not submit its form', async () => {
      const onSubmit = jest.fn((event: React.FormEvent) => event.preventDefault())
      render(
        <form onSubmit={onSubmit}>
          <Button type="submit" unavailableReason="Add a recipient first.">
            Send
          </Button>
        </form>,
      )

      await userEvent.click(screen.getByRole('button', { name: 'Send' }))

      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('should close the reason on Escape without reaching document listeners', async () => {
      const onDocumentKeyDown = jest.fn()
      document.addEventListener('keydown', onDocumentKeyDown)
      render(<Button unavailableReason="Nothing to save yet.">Save</Button>)

      await userEvent.click(screen.getByRole('button', { name: 'Save' }))
      await userEvent.keyboard('{Escape}')
      document.removeEventListener('keydown', onDocumentKeyDown)

      expect(screen.getByRole('status')).toBeEmptyDOMElement()
      expect(onDocumentKeyDown).not.toHaveBeenCalled()
    })

    it('should let Escape through when the reason is closed', async () => {
      const onKeyDown = jest.fn()
      const onDocumentKeyDown = jest.fn()
      document.addEventListener('keydown', onDocumentKeyDown)
      render(
        <Button onKeyDown={onKeyDown} unavailableReason="Nothing to save yet.">
          Save
        </Button>,
      )

      await userEvent.tab()
      await userEvent.keyboard('{Escape}')
      document.removeEventListener('keydown', onDocumentKeyDown)

      expect(onKeyDown).toHaveBeenCalledWith(expect.objectContaining({ key: 'Escape' }))
      expect(onDocumentKeyDown).toHaveBeenCalledWith(expect.objectContaining({ key: 'Escape' }))
    })

    it('should close the reason on Escape and leave a surrounding dialog open', async () => {
      const onCancel = jest.fn()
      render(
        <Dialog
          footer={<Button unavailableReason="Pick a sender first.">Apply</Button>}
          onCancel={onCancel}
          open
          title="Suggestions"
        >
          Pick senders to block.
        </Dialog>,
      )

      const dialog = screen.getByRole('dialog', { name: 'Suggestions' })
      await userEvent.click(within(dialog).getByRole('button', { name: 'Apply' }))

      // Inside the aria-modal dialog, where a screen reader still hears it.
      expect(within(dialog).getByRole('status')).toHaveTextContent('Pick a sender first.')

      await userEvent.keyboard('{Escape}')

      expect(within(dialog).getByRole('status')).toBeEmptyDOMElement()
      expect(dialog).toBeVisible()
      expect(onCancel).not.toHaveBeenCalled()
    })

    it('should close the reason on blur', async () => {
      const onBlur = jest.fn()
      render(
        <>
          <Button onBlur={onBlur} unavailableReason="Nothing to save yet.">
            Save
          </Button>
          <Button>Cancel</Button>
        </>,
      )

      await userEvent.click(screen.getByRole('button', { name: 'Save' }))
      await userEvent.tab()

      expect(screen.getByRole('status')).toBeEmptyDOMElement()
      expect(onBlur).toHaveBeenCalledTimes(1)
    })

    // fireEvent, not userEvent: userEvent moves focus on a press, so blur would close the reason
    // too. A bare pointerdown is what iOS Safari sends on a tap, with focus left where it was.
    it('should close the reason on a pointerdown outside the button', async () => {
      render(
        <>
          <Button unavailableReason="Nothing to save yet.">Save</Button>
          <p>Elsewhere</p>
        </>,
      )

      await userEvent.click(screen.getByRole('button', { name: 'Save' }))
      fireEvent.pointerDown(screen.getByText('Elsewhere'))

      expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus()
      expect(screen.getByRole('status')).toBeEmptyDOMElement()
    })

    it('should keep the reason open on a pointerdown on the button', async () => {
      render(<Button unavailableReason="Nothing to save yet.">Save</Button>)

      await userEvent.click(screen.getByRole('button', { name: 'Save' }))
      fireEvent.pointerDown(screen.getByRole('button', { name: 'Save' }))

      expect(screen.getByRole('status')).toHaveTextContent('Nothing to save yet.')
    })

    it('should show a new reason when the reason changes', async () => {
      const { rerender } = render(<Button unavailableReason="Nothing to save yet.">Save</Button>)

      await userEvent.click(screen.getByRole('button', { name: 'Save' }))
      rerender(<Button unavailableReason="Wait until your changes finish saving.">Save</Button>)

      expect(screen.getByRole('status')).toHaveTextContent('Wait until your changes finish saving.')
      expect(screen.getByRole('button', { name: 'Save' })).toHaveAccessibleDescription(
        'Wait until your changes finish saving.',
      )
    })

    it('should close the reason and run the next press when the reason clears', async () => {
      const { rerender } = render(
        <Button onClick={onClick} unavailableReason="Nothing to save yet.">
          Save
        </Button>,
      )

      await userEvent.click(screen.getByRole('button', { name: 'Save' }))
      rerender(<Button onClick={onClick}>Save</Button>)

      expect(screen.queryByRole('status')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Save' })).not.toHaveAccessibleDescription()

      await userEvent.click(screen.getByRole('button', { name: 'Save' }))

      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('should leave focus in a text field when Enter submits through it', async () => {
      const onSubmit = jest.fn((event: React.FormEvent) => event.preventDefault())
      render(
        <form onSubmit={onSubmit}>
          <label>
            To
            <input type="text" />
          </label>
          <Button type="submit" unavailableReason="Add a recipient first.">
            Send
          </Button>
        </form>,
      )

      await userEvent.type(screen.getByRole('textbox', { name: 'To' }), 'a{Enter}')

      expect(screen.getByRole('textbox', { name: 'To' })).toHaveFocus()
      expect(screen.getByRole('status')).toHaveTextContent('Add a recipient first.')
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('should not reopen when the reason returns', async () => {
      const { rerender } = render(<Button unavailableReason="Nothing to save yet.">Save</Button>)

      await userEvent.click(screen.getByRole('button', { name: 'Save' }))
      rerender(<Button>Save</Button>)
      rerender(<Button unavailableReason="Nothing to save yet.">Save</Button>)

      expect(screen.getByRole('status')).toBeEmptyDOMElement()
    })

    it('should keep the reason up through scroll and resize (smoke test)', async () => {
      render(<Button unavailableReason="Nothing to save yet.">Save</Button>)

      await userEvent.click(screen.getByRole('button', { name: 'Save' }))
      act(() => {
        window.dispatchEvent(new Event('scroll'))
        window.dispatchEvent(new Event('resize'))
      })

      expect(screen.getByRole('status')).toHaveTextContent('Nothing to save yet.')
    })
  })

  describe('throttleToFrame', () => {
    const fn = jest.fn()
    const requestFrame = jest.fn()
    const cancelFrame = jest.fn()

    beforeAll(() => {
      requestFrame.mockReturnValue(7)
    })

    it('should run once on the next frame however many calls arrive before it', () => {
      const throttle = throttleToFrame(fn, requestFrame, cancelFrame)

      throttle.run()
      throttle.run()
      throttle.run()

      expect(requestFrame).toHaveBeenCalledTimes(1)
      expect(fn).not.toHaveBeenCalled()

      requestFrame.mock.calls[0][0](0)

      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should schedule again once the frame has run', () => {
      const throttle = throttleToFrame(fn, requestFrame, cancelFrame)

      throttle.run()
      requestFrame.mock.calls[0][0](0)
      throttle.run()

      expect(requestFrame).toHaveBeenCalledTimes(2)
    })

    it('should cancel a waiting frame', () => {
      const throttle = throttleToFrame(fn, requestFrame, cancelFrame)

      throttle.run()
      throttle.cancel()

      expect(cancelFrame).toHaveBeenCalledWith(7)
    })

    it('should cancel nothing when no frame is waiting', () => {
      const throttle = throttleToFrame(fn, requestFrame, cancelFrame)

      throttle.cancel()

      expect(cancelFrame).not.toHaveBeenCalled()
    })
  })

  describe('placeBubble', () => {
    const viewport = { height: 800, width: 1000 }

    const bubble = { height: 40, width: 200 }

    it('should place the bubble below the button', () => {
      expect(placeBubble({ bottom: 140, left: 100, top: 100 }, viewport, bubble)).toEqual({ left: 100, top: 146 })
    })

    it('should flip above when there is under 80px below', () => {
      expect(placeBubble({ bottom: 730, left: 100, top: 700 }, viewport, bubble)).toEqual({ bottom: 106, left: 100 })
    })

    it('should flip above when a tall bubble would not fit below', () => {
      const tall = { height: 120, width: 200 }

      expect(placeBubble({ bottom: 690, left: 100, top: 660 }, viewport, tall)).toEqual({ bottom: 146, left: 100 })
      expect(placeBubble({ bottom: 674, left: 100, top: 644 }, viewport, tall)).toEqual({ left: 100, top: 680 })
    })

    it('should keep the bubble inside the right edge', () => {
      expect(placeBubble({ bottom: 140, left: 900, top: 100 }, viewport, bubble)).toEqual({ left: 792, top: 146 })
    })

    it('should keep the bubble inside the left edge', () => {
      expect(placeBubble({ bottom: 140, left: -20, top: 100 }, viewport, bubble)).toEqual({ left: 8, top: 146 })
    })
  })

  describe('passthrough', () => {
    it('should forward attributes and handlers to the button', async () => {
      const onMouseEnter = jest.fn()
      const onMouseLeave = jest.fn()
      const onFocus = jest.fn()
      render(
        <Button
          data-testid="save-button"
          id="save"
          onFocus={onFocus}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          role="option"
          tabIndex={0}
          title="Save your settings"
        >
          Save
        </Button>,
      )

      const button = screen.getByRole('option', { name: 'Save your settings' })
      await userEvent.hover(button)
      await userEvent.unhover(button)
      await userEvent.tab()

      expect(screen.getByTestId('save-button')).toBe(button)
      expect(button).toHaveAttribute('id', 'save')
      expect(onMouseEnter).toHaveBeenCalledTimes(1)
      expect(onMouseLeave).toHaveBeenCalledTimes(1)
      expect(onFocus).toHaveBeenCalledTimes(1)
    })

    it('should forward an object ref to the button element', () => {
      const ref = React.createRef<HTMLButtonElement>()
      render(<Button ref={ref}>Save</Button>)

      expect(ref.current).toBeInstanceOf(HTMLButtonElement)
      expect(ref.current).toBe(screen.getByRole('button', { name: 'Save' }))
    })

    it('should forward a callback ref to the button element', () => {
      const ref = jest.fn()
      render(<Button ref={ref}>Save</Button>)

      expect(ref).toHaveBeenCalledWith(screen.getByRole('button', { name: 'Save' }))
    })

    it('should have no disabled prop', () => {
      // @ts-expect-error -- Button has no disabled prop (spec G4)
      render(<Button disabled>Save</Button>)

      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    })

    it('should never be natively disabled, even when disabled is forced past the types', async () => {
      render(
        <Button {...({ disabled: true } as object)} onClick={onClick}>
          Save
        </Button>,
      )

      await userEvent.click(screen.getByRole('button', { name: 'Save' }))

      expect(onClick).toHaveBeenCalledTimes(1)
    })
  })
})
