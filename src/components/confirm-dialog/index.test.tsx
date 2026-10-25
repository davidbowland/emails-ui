import React from 'react'

import ConfirmDialog from './index'
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('ConfirmDialog component', () => {
  const onCancel = jest.fn()
  const onConfirm = jest.fn()

  it('should render title and children when open', () => {
    render(
      <ConfirmDialog onCancel={onCancel} onConfirm={onConfirm} open={true} title="Delete item?">
        Are you sure?
      </ConfirmDialog>,
    )

    expect(screen.getByText(/Delete item\?/i)).toBeVisible()
    expect(screen.getByText(/Are you sure\?/i)).toBeVisible()
  })

  it('should call onCancel when cancel button is clicked', () => {
    render(
      <ConfirmDialog onCancel={onCancel} onConfirm={onConfirm} open={true} title="Delete item?">
        Are you sure?
      </ConfirmDialog>,
    )

    fireEvent.click(screen.getByText(/Cancel/i, { selector: 'button' }))

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('should call onConfirm when confirm button is clicked', () => {
    render(
      <ConfirmDialog onCancel={onCancel} onConfirm={onConfirm} open={true} title="Delete item?">
        Are you sure?
      </ConfirmDialog>,
    )

    fireEvent.click(screen.getByText(/Confirm/i, { selector: 'button' }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('should use custom button labels when provided', () => {
    render(
      <ConfirmDialog
        cancelLabel="Go back"
        confirmLabel="Continue"
        onCancel={onCancel}
        onConfirm={onConfirm}
        open={true}
        title="Delete item?"
      >
        Are you sure?
      </ConfirmDialog>,
    )

    expect(screen.getByText(/Go back/i, { selector: 'button' })).toBeVisible()
    expect(screen.getByText(/Continue/i, { selector: 'button' })).toBeVisible()
  })

  it('should be named by its title', () => {
    render(
      <ConfirmDialog onCancel={onCancel} onConfirm={onConfirm} open={true} title="Delete item?">
        Are you sure?
      </ConfirmDialog>,
    )

    expect(screen.getByRole('dialog', { name: 'Delete item?' })).toBeInTheDocument()
  })

  it('should render a custom footer in place of the default buttons', async () => {
    const onApply = jest.fn()
    render(
      <ConfirmDialog
        footer={<button onClick={onApply}>Apply changes</button>}
        onCancel={onCancel}
        open={true}
        title="Suggested rule changes"
      >
        Pick the changes you want.
      </ConfirmDialog>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Apply changes' }))

    expect(onApply).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
  })

  it('should show its content and buttons when scrollable', async () => {
    render(
      <ConfirmDialog onCancel={onCancel} onConfirm={onConfirm} open={true} scrollable={true} title="Long list">
        <p>First row</p>
        <p>Last row</p>
      </ConfirmDialog>,
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
        <ConfirmDialog footer={footer} onCancel={onCancel} onConfirm={onConfirm} open={open} title="Check">
          Body
        </ConfirmDialog>
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

    it('should return focus to the trigger when closed', async () => {
      const { rerender } = render(<DialogHarness open={false} />)
      await userEvent.click(screen.getByRole('button', { name: 'Open dialog' }))
      rerender(<DialogHarness open={true} />)

      rerender(<DialogHarness open={false} />)

      expect(screen.getByRole('button', { name: 'Open dialog' })).toHaveFocus()
    })
  })
})
