import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { addresses } from '@test/__mocks__'
import React from 'react'

import AddressLine from './index'

jest.mock('aws-amplify')

describe('Address line component', () => {
  const setAddresses = jest.fn()

  test('expect addresses rendered with no edit capability', async () => {
    render(<AddressLine addresses={addresses} label="To:" />)
    expect(await screen.findByText(/to:/i)).toBeVisible()
    expect(await screen.findByText(/a@domain.com/i)).toBeVisible()
    expect(screen.queryByLabelText(/Edit recipient/i)).not.toBeInTheDocument()
  })

  test('expect ability to edit and save an address', async () => {
    render(<AddressLine addresses={addresses} label="To:" setAddresses={setAddresses} />)

    const editButton = (
      await screen.findAllByLabelText(/Edit recipient/i, {
        selector: 'button',
      })
    )[0] as HTMLButtonElement
    fireEvent.click(editButton)
    const addressInput = (await screen.findByLabelText(/Email address/i)) as HTMLInputElement
    fireEvent.change(addressInput, { target: { value: 'c@domain.com' } })
    const saveButton = (await screen.findByLabelText(/Save changes/i, {
      selector: 'button',
    })) as HTMLButtonElement
    fireEvent.click(saveButton)

    expect(setAddresses).toHaveBeenCalledWith([
      { address: 'c@domain.com', name: '' },
      { address: 'b@domain.com', name: '' },
    ])
  })

  test('expect ability to remove an address', async () => {
    render(
      <AddressLine
        addresses={[
          { address: 'a@domain.com', name: 'A' },
          { address: '', name: '' },
        ]}
        label="To:"
        setAddresses={setAddresses}
      />
    )

    const editButton = (
      await screen.findAllByLabelText(/Edit recipient/i, {
        selector: 'button',
      })
    )[1] as HTMLButtonElement
    fireEvent.click(editButton)
    const saveButton = (await screen.findByLabelText(/Save changes/i, {
      selector: 'button',
    })) as HTMLButtonElement
    fireEvent.click(saveButton)

    expect(setAddresses).toHaveBeenCalledWith([{ address: 'a@domain.com', name: 'A' }])
  })

  test('expect ability to add an address', async () => {
    render(<AddressLine addresses={addresses} label="To:" setAddresses={setAddresses} />)

    const addButton = (await screen.findByLabelText(/Add recipient/i, { selector: 'button' })) as HTMLButtonElement
    fireEvent.click(addButton)

    expect(setAddresses).toHaveBeenCalledWith([
      { address: 'a@domain.com', name: 'A' },
      { address: 'b@domain.com', name: '' },
      { address: '', name: '' },
    ])
  })
})
