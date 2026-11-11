import React from 'react'

import Checkbox from './index'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('Checkbox component', () => {
  const onChange = jest.fn()

  it('should be named by its label and reflect checked', () => {
    render(<Checkbox checked={true} label="Block spam.example" onChange={onChange} />)

    expect(screen.getByRole('checkbox', { name: 'Block spam.example' })).toBeChecked()
  })

  it('should report the new state when clicked', async () => {
    render(<Checkbox checked={false} label="Block spam.example" onChange={onChange} />)

    await userEvent.click(screen.getByRole('checkbox', { name: 'Block spam.example' }))

    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('should toggle from the keyboard', async () => {
    render(<Checkbox checked={false} label="Block spam.example" onChange={onChange} />)

    await userEvent.tab()
    await userEvent.keyboard(' ')

    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('should toggle from a click anywhere in the label, padding included', async () => {
    render(<Checkbox checked={false} className="px-3 py-2.5" label="Block spam.example" onChange={onChange} />)

    await userEvent.click(screen.getByText('Block spam.example').closest('label') as HTMLLabelElement)

    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('should ignore changes while read-only', async () => {
    render(<Checkbox checked={false} label="Block spam.example" onChange={onChange} readOnly />)

    await userEvent.click(screen.getByRole('checkbox', { name: 'Block spam.example' }))

    expect(onChange).not.toHaveBeenCalled()
  })

  it('should expose its description', () => {
    render(
      <>
        <p id="why">Seen in 3 emails</p>
        <Checkbox checked={false} describedBy="why" label="Block spam.example" onChange={onChange} />
      </>,
    )

    expect(screen.getByRole('checkbox', { name: 'Block spam.example' })).toHaveAccessibleDescription('Seen in 3 emails')
  })

  describe('details', () => {
    const details = <span>Seen in 3 emails</span>

    it('should keep the details out of the name and use them as the description', () => {
      render(<Checkbox checked={false} details={details} label="Block spam.example" onChange={onChange} />)

      const checkbox = screen.getByRole('checkbox', { name: 'Block spam.example' })
      expect(checkbox).toHaveAccessibleDescription('Seen in 3 emails')
      expect(screen.getByText('Seen in 3 emails')).toBeVisible()
    })

    it('should toggle when the details are clicked', async () => {
      render(<Checkbox checked={false} details={details} label="Block spam.example" onChange={onChange} />)

      await userEvent.click(screen.getByText('Seen in 3 emails'))

      expect(onChange).toHaveBeenCalledWith(true)
    })

    it('should ignore a click on the details while read-only', async () => {
      render(<Checkbox checked={false} details={details} label="Block spam.example" onChange={onChange} readOnly />)

      await userEvent.click(screen.getByText('Seen in 3 emails'))

      expect(onChange).not.toHaveBeenCalled()
    })

    it("should let the caller's description replace the details", () => {
      render(
        <>
          <p id="why">Matches 2 emails</p>
          <Checkbox
            checked={false}
            describedBy="why"
            details={details}
            label="Block spam.example"
            onChange={onChange}
          />
        </>,
      )

      expect(screen.getByRole('checkbox', { name: 'Block spam.example' })).toHaveAccessibleDescription(
        'Matches 2 emails',
      )
    })

    it('should have no description without details or describedBy', () => {
      render(<Checkbox checked={false} label="Block spam.example" onChange={onChange} />)

      expect(screen.getByRole('checkbox', { name: 'Block spam.example' })).toHaveAccessibleDescription('')
    })
  })
})
