import { addresses } from '@test/__mocks__'
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'

import AddressLine from './index'

jest.mock('aws-amplify')

describe('Address line component', () => {
  const setAddresses = jest.fn()

  it('should render addresses without edit capability when no setAddresses provided', async () => {
    render(<AddressLine addresses={addresses} label="To:" />)
    expect(await screen.findByText(/to:/i)).toBeVisible()
    expect(await screen.findByText(/a@domain.com/i)).toBeVisible()
    expect(screen.queryByLabelText(/Edit recipient/i)).not.toBeInTheDocument()
  })

  it('should allow editing and saving an address', async () => {
    render(<AddressLine addresses={addresses} label="To:" setAddresses={setAddresses} />)

    const input = (await screen.findByRole('combobox')) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'c@domain.com' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(setAddresses).toHaveBeenCalledWith([
      { address: 'a@domain.com', name: '' },
      { address: 'b@domain.com', name: '' },
      { address: 'c@domain.com', name: '' },
    ])
  })

  it('should allow removing an address', async () => {
    render(
      <AddressLine
        addresses={[
          { address: 'a@domain.com', name: 'A' },
          { address: '', name: '' },
        ]}
        label="To:"
        setAddresses={setAddresses}
      />,
    )

    // Click the X button on the second chip (empty address)
    const deleteButtons = await screen.findAllByTestId('CancelIcon')
    fireEvent.click(deleteButtons[1])

    expect(setAddresses).toHaveBeenCalledWith([{ address: 'a@domain.com', name: '' }])
  })

  it('should allow adding a new address', async () => {
    render(<AddressLine addresses={addresses} label="To:" setAddresses={setAddresses} />)

    const input = (await screen.findByRole('combobox')) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'new@domain.com' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(setAddresses).toHaveBeenCalledWith([
      { address: 'a@domain.com', name: '' },
      { address: 'b@domain.com', name: '' },
      { address: 'new@domain.com', name: '' },
    ])
  })
})
