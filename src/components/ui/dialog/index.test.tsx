import React from 'react'

import Dialog from './index'
import Button from '@components/ui/button'
import '@testing-library/jest-dom'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('Dialog component', () => {
  const onCancel = jest.fn()
  const onConfirm = jest.fn()

  it('should render title and children when open', () => {
    render(
      <Dialog onCancel={onCancel} onConfirm={onConfirm} open={true} title="Delete item?">
        Are you sure?
      </Dialog>,
    )

    expect(screen.getByText(/Delete item\?/i)).toBeVisible()
    expect(screen.getByText(/Are you sure\?/i)).toBeVisible()
  })

  it('should be described by the element describedBy names', () => {
    render(
      <Dialog describedBy="dialog-lead" onCancel={onCancel} onConfirm={onConfirm} open={true} title="Delete item?">
        <p id="dialog-lead">This cannot be undone.</p>
        <p>Other detail.</p>
      </Dialog>,
    )

    expect(screen.getByRole('dialog', { name: 'Delete item?' })).toHaveAccessibleDescription('This cannot be undone.')
  })

  it('should have no description without describedBy', () => {
    render(
      <Dialog onCancel={onCancel} onConfirm={onConfirm} open={true} title="Delete item?">
        Are you sure?
      </Dialog>,
    )

    expect(screen.getByRole('dialog', { name: 'Delete item?' })).toHaveAccessibleDescription('')
  })

  it('should call onCancel when cancel button is clicked', async () => {
    render(
      <Dialog onCancel={onCancel} onConfirm={onConfirm} open={true} title="Delete item?">
        Are you sure?
      </Dialog>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('should call onConfirm when confirm button is clicked', async () => {
    render(
      <Dialog onCancel={onCancel} onConfirm={onConfirm} open={true} title="Delete item?">
        Are you sure?
      </Dialog>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('should use custom button labels when provided', () => {
    render(
      <Dialog
        cancelLabel="Go back"
        confirmLabel="Continue"
        onCancel={onCancel}
        onConfirm={onConfirm}
        open={true}
        title="Delete item?"
      >
        Are you sure?
      </Dialog>,
    )

    expect(screen.getByRole('button', { name: 'Go back' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Continue' })).toBeVisible()
  })

  it('should be named by its title', () => {
    render(
      <Dialog onCancel={onCancel} onConfirm={onConfirm} open={true} title="Delete item?">
        Are you sure?
      </Dialog>,
    )

    expect(screen.getByRole('dialog', { name: 'Delete item?' })).toBeInTheDocument()
  })

  it('should render a custom footer in place of the default buttons', async () => {
    const onApply = jest.fn()
    render(
      <Dialog
        footer={<button onClick={onApply}>Apply changes</button>}
        onCancel={onCancel}
        open={true}
        title="Suggested rule changes"
      >
        Pick the changes you want.
      </Dialog>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Apply changes' }))

    expect(onApply).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
  })

  it('should show its content and buttons when scrollable', async () => {
    render(
      <Dialog onCancel={onCancel} onConfirm={onConfirm} open={true} scrollable={true} title="Long list">
        <p>First row</p>
        <p>Last row</p>
      </Dialog>,
    )

    expect(screen.getByText('First row')).toBeVisible()
    expect(screen.getByText('Last row')).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  describe('focus', () => {
    const DialogHarness = ({ footer, open }: { footer?: React.ReactNode; open: boolean }): React.ReactNode => (
      <>
        <button>Open dialog</button>
        <Dialog footer={footer} onCancel={onCancel} onConfirm={onConfirm} open={open} title="Check">
          Body
        </Dialog>
      </>
    )

    it('should move focus to the first control when opened', () => {
      const { rerender } = render(<DialogHarness open={false} />)

      rerender(<DialogHarness open={true} />)

      expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
    })

    it('should skip aria-disabled controls for the initial focus', () => {
      const footer = (
        <>
          <button aria-disabled="true">Apply changes</button>
          <button>Close</button>
        </>
      )
      const { rerender } = render(<DialogHarness footer={footer} open={false} />)

      rerender(<DialogHarness footer={footer} open={true} />)

      expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
    })

    it('should keep aria-disabled controls in the tab order', async () => {
      const footer = (
        <>
          <button aria-disabled="true">Apply changes</button>
          <button>Close</button>
        </>
      )
      const { rerender } = render(<DialogHarness footer={footer} open={false} />)
      rerender(<DialogHarness footer={footer} open={true} />)

      await userEvent.tab()

      expect(screen.getByRole('button', { name: 'Apply changes' })).toHaveFocus()
    })

    it('should trap focus within the dialog', async () => {
      const { rerender } = render(<DialogHarness open={false} />)
      rerender(<DialogHarness open={true} />)

      await userEvent.tab()
      expect(screen.getByRole('button', { name: 'Confirm' })).toHaveFocus()
      await userEvent.tab()
      expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
      await userEvent.tab({ shift: true })
      expect(screen.getByRole('button', { name: 'Confirm' })).toHaveFocus()
    })

    it('should call onCancel when Escape is pressed', async () => {
      const { rerender } = render(<DialogHarness open={false} />)
      rerender(<DialogHarness open={true} />)

      await userEvent.keyboard('{Escape}')

      expect(onCancel).toHaveBeenCalledTimes(1)
    })

    it('should stay open when a control inside has already handled Escape', async () => {
      const footer = (
        <button onKeyDown={(event) => event.key === 'Escape' && event.preventDefault()}>Handles Escape</button>
      )
      const { rerender } = render(<DialogHarness footer={footer} open={false} />)
      rerender(<DialogHarness footer={footer} open={true} />)

      await userEvent.keyboard('{Escape}')

      expect(onCancel).not.toHaveBeenCalled()
      expect(screen.getByRole('dialog', { name: 'Check' })).toBeVisible()
    })

    it('should close only the reason when Escape is pressed on an unavailable button', async () => {
      const footer = <Button unavailableReason="Pick a sender first.">Apply</Button>
      const { rerender } = render(<DialogHarness footer={footer} open={false} />)
      rerender(<DialogHarness footer={footer} open={true} />)
      const dialog = screen.getByRole('dialog', { name: 'Check' })
      await userEvent.click(within(dialog).getByRole('button', { name: 'Apply' }))
      expect(within(dialog).getByRole('status')).toHaveTextContent('Pick a sender first.')

      await userEvent.keyboard('{Escape}')

      expect(within(dialog).getByRole('status')).toBeEmptyDOMElement()
      expect(dialog).toBeVisible()
      expect(onCancel).not.toHaveBeenCalled()
    })

    it('should return focus to the trigger when closed', async () => {
      const { rerender } = render(<DialogHarness open={false} />)
      await userEvent.click(screen.getByRole('button', { name: 'Open dialog' }))
      rerender(<DialogHarness open={true} />)

      rerender(<DialogHarness open={false} />)

      expect(screen.getByRole('button', { name: 'Open dialog' })).toHaveFocus()
    })

    it('should move focus to returnFocusTo on close instead of the opener', async () => {
      const Harness = ({ open }: { open: boolean }): React.ReactNode => (
        <>
          <button>Open dialog</button>
          <button>Elsewhere</button>
          <Dialog
            onCancel={onCancel}
            onConfirm={onConfirm}
            open={open}
            returnFocusTo={() => screen.getByRole('button', { name: 'Elsewhere' })}
            title="Check"
          >
            Body
          </Dialog>
        </>
      )
      const { rerender } = render(<Harness open={false} />)
      await userEvent.click(screen.getByRole('button', { name: 'Open dialog' }))
      rerender(<Harness open={true} />)

      rerender(<Harness open={false} />)

      expect(screen.getByRole('button', { name: 'Elsewhere' })).toHaveFocus()
    })
  })
})
