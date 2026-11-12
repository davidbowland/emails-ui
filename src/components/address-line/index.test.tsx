import React from 'react'

import AddressLine, { forwardAddressError } from './index'
import { addresses } from '@test/__mocks__'
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('Address line component', () => {
  const setAddresses = jest.fn()

  it('should render addresses without edit capability when no setAddresses provided', async () => {
    render(<AddressLine addresses={addresses} label="To:" />)
    expect(await screen.findByText(/to:/i)).toBeVisible()
    expect(await screen.findByText(/a@domain.com/i)).toBeVisible()
    expect(screen.queryByTestId('CancelIcon')).not.toBeInTheDocument()
  })

  it('should allow editing and saving an address', async () => {
    render(<AddressLine addresses={addresses} label="To:" setAddresses={setAddresses} />)

    const input = (await screen.findByRole('textbox')) as HTMLInputElement
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

    const deleteButtons = await screen.findAllByTestId('CancelIcon')
    fireEvent.click(deleteButtons[1])

    expect(setAddresses).toHaveBeenCalledWith([{ address: 'a@domain.com', name: '' }])
  })

  it('should allow adding a new address', async () => {
    render(<AddressLine addresses={addresses} label="To:" setAddresses={setAddresses} />)

    const input = (await screen.findByRole('textbox')) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'new@domain.com' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(setAddresses).toHaveBeenCalledWith([
      { address: 'a@domain.com', name: '' },
      { address: 'b@domain.com', name: '' },
      { address: 'new@domain.com', name: '' },
    ])
  })

  it('should commit value on blur', async () => {
    render(<AddressLine addresses={addresses} label="To:" setAddresses={setAddresses} />)

    const input = (await screen.findByRole('textbox')) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'blur@domain.com' } })
    fireEvent.blur(input)

    expect(setAddresses).toHaveBeenCalledWith([
      { address: 'a@domain.com', name: '' },
      { address: 'b@domain.com', name: '' },
      { address: 'blur@domain.com', name: '' },
    ])
  })

  it('should not commit empty value on blur', async () => {
    render(<AddressLine addresses={addresses} label="To:" setAddresses={setAddresses} />)

    const input = (await screen.findByRole('textbox')) as HTMLInputElement
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.blur(input)

    expect(setAddresses).not.toHaveBeenCalled()
  })

  it('should add nothing while read-only', async () => {
    render(<AddressLine addresses={addresses} label="To:" readOnly setAddresses={setAddresses} />)

    await userEvent.type(await screen.findByRole('textbox'), 'late@domain.com{Enter}')

    expect(setAddresses).not.toHaveBeenCalled()
  })

  it('should show an icon, not a text glyph, on the remove button', async () => {
    render(<AddressLine addresses={addresses} label="To:" setAddresses={setAddresses} />)

    const button = await screen.findByRole('button', { name: 'Remove b@domain.com' })
    expect(button).not.toHaveTextContent('✕')
    expect(screen.getAllByTestId('icon-X')).toHaveLength(addresses.length)
  })

  it('should remove an address when its named remove button is clicked', async () => {
    render(<AddressLine addresses={addresses} label="To:" setAddresses={setAddresses} />)

    await userEvent.click(await screen.findByRole('button', { name: 'Remove b@domain.com' }))

    expect(setAddresses).toHaveBeenCalledWith([{ address: 'a@domain.com', name: '' }])
  })

  it('should remove nothing while read-only, and say why', async () => {
    render(
      <AddressLine
        addresses={addresses}
        label="To:"
        readOnly
        readOnlyReason="Wait until Save finishes."
        setAddresses={setAddresses}
      />,
    )

    await userEvent.click((await screen.findAllByTestId('CancelIcon'))[0])

    expect(setAddresses).not.toHaveBeenCalled()
    expect(screen.getAllByRole('status').map((region) => region.textContent)).toContain('Wait until Save finishes.')
  })

  it('should commit nothing when it turns writable again', async () => {
    const { rerender } = render(<AddressLine addresses={addresses} label="To:" setAddresses={setAddresses} />)

    await userEvent.type(screen.getByRole('textbox', { name: 'Email address' }), 'late@domain.com')
    rerender(<AddressLine addresses={addresses} label="To:" readOnly setAddresses={setAddresses} />)
    rerender(<AddressLine addresses={addresses} label="To:" setAddresses={setAddresses} />)

    expect(setAddresses).not.toHaveBeenCalled()
    expect(screen.getByRole('textbox', { name: 'Email address' })).toHaveValue('late@domain.com')
  })

  it('should keep typed text in the box, uncommitted, while read-only', async () => {
    const { rerender } = render(<AddressLine addresses={addresses} label="To:" setAddresses={setAddresses} />)

    await userEvent.type(screen.getByRole('textbox', { name: 'Email address' }), 'late@domain.com')
    rerender(<AddressLine addresses={addresses} label="To:" readOnly setAddresses={setAddresses} />)
    await userEvent.tab()

    expect(setAddresses).not.toHaveBeenCalled()
    expect(screen.getByRole('textbox', { name: 'Email address' })).toHaveValue('late@domain.com')
  })

  describe('forwardAddressError', () => {
    it('explains a malformed address', () => {
      expect(forwardAddressError([], 'bob')).toBe('Enter an email address, like name@example.com.')
    })

    it('explains a case-insensitive repeat', () => {
      expect(forwardAddressError(['A@b.co'], 'a@B.co')).toBe('\u201Ca@B.co\u201D is already on your list.')
    })

    it('accepts a new valid address', () => {
      expect(forwardAddressError(['x@y.co'], 'a@b.co')).toBeUndefined()
    })
  })

  it('AddressLine without addLabel keeps adding on blur', async () => {
    const setAddresses = jest.fn()
    render(<AddressLine addresses={[]} label="To" setAddresses={setAddresses} />)

    await userEvent.type(screen.getByRole('textbox'), 'a@b.co')
    await userEvent.tab()

    expect(setAddresses).toHaveBeenCalledWith([{ address: 'a@b.co', name: '' }])
    expect(screen.queryByRole('button', { name: /add/i })).not.toBeInTheDocument()
  })

  it('AddressLine validate refuses and calls onInvalid', async () => {
    const setAddresses = jest.fn()
    const onInvalid = jest.fn()
    render(
      <AddressLine
        addresses={[]}
        label="To"
        onInvalid={onInvalid}
        setAddresses={setAddresses}
        validate={() => false}
      />,
    )

    await userEvent.type(screen.getByRole('textbox'), 'bob{Enter}')

    expect(onInvalid).toHaveBeenCalledWith('bob')
    expect(setAddresses).not.toHaveBeenCalled()
  })

  it('savedEntries marks unsaved addresses as new', () => {
    render(
      <AddressLine
        addresses={[{ address: 'a@b.co', name: '' }]}
        label="To"
        savedEntries={[]}
        setAddresses={jest.fn()}
      />,
    )

    expect(screen.getByText(/not saved yet/i)).toBeInTheDocument()
  })

  it('names the input by its label when inputId is given', () => {
    render(<AddressLine addresses={[]} inputId="fwd" label="To" setAddresses={jest.fn()} />)

    expect(screen.getByRole('textbox', { name: 'To' })).toHaveAttribute('id', 'fwd')
  })

  it('inputRef reaches the input', async () => {
    const ref = React.createRef<HTMLInputElement>()
    render(<AddressLine addresses={[]} inputRef={ref} label="To" setAddresses={jest.fn()} />)

    ref.current?.focus()

    expect(screen.getByRole('textbox')).toHaveFocus()
  })

  it('shows a controlled draft and reports typing', async () => {
    const onDraftChange = jest.fn()
    render(<AddressLine addresses={[]} draft="abc" label="To" onDraftChange={onDraftChange} setAddresses={jest.fn()} />)

    expect(screen.getByRole('textbox')).toHaveValue('abc')
    await userEvent.type(screen.getByRole('textbox'), 'd')

    expect(onDraftChange).toHaveBeenCalledWith('abcd')
  })

  it('pendingHintId joins aria-describedby while a draft is present', () => {
    const { rerender } = render(
      <AddressLine
        addresses={[]}
        describedBy="err"
        draft=""
        label="To"
        pendingHintId="hint"
        setAddresses={jest.fn()}
      />,
    )
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-describedby', 'err')

    rerender(
      <AddressLine
        addresses={[]}
        describedBy="err"
        draft="a"
        label="To"
        pendingHintId="hint"
        setAddresses={jest.fn()}
      />,
    )
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-describedby', 'err hint')
  })

  it('addLabel shows the Add button once there is a draft', () => {
    render(
      <AddressLine
        addLabel="Add forwarding address"
        addresses={[]}
        draft="a@b.co"
        label="To"
        setAddresses={jest.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Add forwarding address' })).toBeInTheDocument()
  })
})
