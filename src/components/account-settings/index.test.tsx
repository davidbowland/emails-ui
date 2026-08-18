import { getCurrentUser } from 'aws-amplify/auth'
import React from 'react'

import AccountSettings from './index'
import AddressLine from '@components/address-line'
import BounceSenderInput from '@components/bounce-sender-input'
import * as emails from '@services/emails'
import { account, user } from '@test/__mocks__'
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

jest.mock('aws-amplify/auth')
jest.mock('@components/address-line')
jest.mock('@components/bounce-sender-input')
jest.mock('@components/error-snackbar', () => {
  const React = require('react')
  // eslint-disable-next-line react/display-name
  return ({ message, onClose }: any) =>
    message
      ? React.createElement(
          'div',
          { role: 'alert' },
          message,
          React.createElement('button', { 'aria-label': 'Close', onClick: onClose }, '✕'),
        )
      : null
})
jest.mock('@components/loading-spinner', () => {
  const React = require('react')
  // eslint-disable-next-line react/display-name
  return () => React.createElement('div', null, 'Loading...')
})
jest.mock('@components/install-offer', () => {
  const React = require('react')
  // eslint-disable-next-line react/display-name
  return () => React.createElement('div', null, 'InstallOfferMounted')
})
jest.mock('@config/amplify')
jest.mock('@services/emails')

describe('AccountSettings component', () => {
  beforeAll(() => {
    jest.mocked(getCurrentUser).mockResolvedValue(user)
    jest.mocked(AddressLine).mockReturnValue(<>AddressLine</>)
    jest.mocked(BounceSenderInput).mockReturnValue(<>BounceSenderInput</>)
    jest.mocked(emails).getAccount.mockResolvedValue(account)
    jest.mocked(emails).putAccount.mockResolvedValue(account)

    console.error = jest.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { reload: jest.fn() },
    })
  })

  it('expect error message when user not logged in', async () => {
    jest.mocked(getCurrentUser).mockRejectedValueOnce(undefined)
    render(<AccountSettings />)

    expect(await screen.findByText(/We couldn't sign you in. Reload the page to try again./i)).toBeVisible()
  })

  it('expect closing snackbar removes error', async () => {
    jest.mocked(getCurrentUser).mockRejectedValueOnce(undefined)
    render(<AccountSettings />)

    await screen.findByText(/We couldn't sign you in. Reload the page to try again./i)
    const closeSnackbarButton = (await screen.findByLabelText(/Close/i, { selector: 'button' })) as HTMLButtonElement
    fireEvent.click(closeSnackbarButton)

    expect(screen.queryByText(/We couldn't sign you in. Reload the page to try again./i)).not.toBeInTheDocument()
  })

  it('expect error message when getAccount rejects', async () => {
    jest.mocked(emails).getAccount.mockRejectedValueOnce(undefined)
    render(<AccountSettings />)

    expect(await screen.findByText(/Couldn't load your settings. Reload the page to try again./i)).toBeVisible()
  })

  it('expect error message when putAccount rejects', async () => {
    jest.mocked(emails).putAccount.mockRejectedValueOnce(undefined)
    render(<AccountSettings />)

    const linkTextInput = (await screen.findByLabelText(/From name/i)) as HTMLInputElement
    fireEvent.change(linkTextInput, { target: { value: 'George' } })
    const saveButton = (await screen.findByText(/Save/i, { selector: 'button' })) as HTMLButtonElement
    fireEvent.click(saveButton)

    expect(
      await screen.findByText(/Error saving account settings. Please refresh the page and try again./i),
    ).toBeVisible()
  })

  it('expect putAccount not called when no changes', async () => {
    render(<AccountSettings />)

    const saveButton = (await screen.findByText(/Save/i, { selector: 'button' })) as HTMLButtonElement
    fireEvent.click(saveButton)

    expect(emails.putAccount).not.toHaveBeenCalled()
  })

  it('expect the install offer mounted in the App section', async () => {
    render(<AccountSettings />)

    expect(await screen.findByText('InstallOfferMounted')).toBeInTheDocument()
  })

  it('expect the whole updated account passed to putAccount', async () => {
    render(<AccountSettings />)

    const linkTextInput = (await screen.findByLabelText(/From name/i)) as HTMLInputElement
    fireEvent.change(linkTextInput, { target: { value: 'George' } })
    const saveButton = (await screen.findByText(/Save/i, { selector: 'button' })) as HTMLButtonElement
    fireEvent.click(saveButton)

    expect(emails.putAccount).toHaveBeenCalledWith(user.username, {
      bounceSenders: account.bounceSenders,
      forwardTargets: account.forwardTargets,
      id: user.username,
      name: 'George',
    })
  })

  it('expect saving twice to send the same account, because a PUT is replay-safe', async () => {
    render(<AccountSettings />)

    const linkTextInput = (await screen.findByLabelText(/From name/i)) as HTMLInputElement
    fireEvent.change(linkTextInput, { target: { value: 'George' } })
    const saveButton = (await screen.findByText(/Save/i, { selector: 'button' })) as HTMLButtonElement
    fireEvent.click(saveButton)
    await screen.findByText(/Account Settings/i)
    fireEvent.click(saveButton)

    const calls = jest.mocked(emails).putAccount.mock.calls
    expect(calls.every((call) => JSON.stringify(call) === JSON.stringify(calls[0]))).toBe(true)
  })

  it('expect bounce senders BounceSenderInput rendered', async () => {
    render(<AccountSettings />)

    await screen.findByText(/Account Settings/i)
    expect(BounceSenderInput).toHaveBeenCalledWith(
      expect.objectContaining({
        label: 'Reject emails from:',
        rules: ['spam@domain.com'],
      }),
      undefined,
    )
    expect(
      await screen.findByText(
        /Block senders by address \(user@domain\.com\), domain \(@domain\.com\), or enter \* to block everyone\./i,
      ),
    ).toBeVisible()
  })
})
