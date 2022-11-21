import '@testing-library/jest-dom'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { Auth } from 'aws-amplify'
import React from 'react'
import { mocked } from 'jest-mock'

import * as emails from '@services/emails'
import { account, user } from '@test/__mocks__'
import AccountSettings from './index'
import AddressLine from '@components/address-line'

jest.mock('aws-amplify')
jest.mock('@components/address-line')
jest.mock('@services/emails')

describe('AccountSettings component', () => {
  beforeAll(() => {
    mocked(Auth).currentAuthenticatedUser.mockResolvedValue(user)
    mocked(AddressLine).mockReturnValue(<>AddressLine</>)
    mocked(emails).getAccount.mockResolvedValue(account)
    mocked(emails).patchAccount.mockResolvedValue(account)

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { reload: jest.fn() },
    })
  })

  test('expect error message when user not logged in', async () => {
    mocked(Auth).currentAuthenticatedUser.mockRejectedValueOnce(undefined)
    render(<AccountSettings />)

    expect(await screen.findByText(/Error authenticating user. Please reload the page to try again./i)).toBeVisible()
  })

  test('expect closing snackbar removes error', async () => {
    mocked(Auth).currentAuthenticatedUser.mockRejectedValueOnce(undefined)
    render(<AccountSettings />)

    await screen.findByText(/Error authenticating user. Please reload the page to try again./i)
    const closeSnackbarButton = (await screen.findByLabelText(/Close/i, { selector: 'button' })) as HTMLButtonElement
    act(() => {
      closeSnackbarButton.click()
    })
    expect(
      screen.queryByText(/Error authenticating user. Please reload the page to try again./i)
    ).not.toBeInTheDocument()
  })

  test('expect error message when getAccount rejects', async () => {
    mocked(emails).getAccount.mockRejectedValueOnce(undefined)
    render(<AccountSettings />)

    expect(
      await screen.findByText(/Error fetching account settings. Please reload the page to try again./i)
    ).toBeVisible()
  })

  test('expect error message when patchAccount rejects', async () => {
    mocked(emails).patchAccount.mockRejectedValueOnce(undefined)
    render(<AccountSettings />)

    const saveButton = (await screen.findByText(/Save/i, { selector: 'button' })) as HTMLButtonElement
    await act(async () => {
      await saveButton.click()
    })

    expect(
      await screen.findByText(/Error saving account settings. Please refresh the page and try again./i)
    ).toBeVisible()
  })

  test('expect patchAccount not called when no changes', async () => {
    render(<AccountSettings />)

    await screen.findByDisplayValue(/Dave/i)
    const saveButton = (await screen.findByText(/Save/i, { selector: 'button' })) as HTMLButtonElement
    await act(async () => {
      await saveButton.click()
    })

    expect(mocked(emails).patchAccount).not.toHaveBeenCalled()
  })

  test('expect patch instructions passed to patchAccount', async () => {
    render(<AccountSettings />)

    await screen.findByDisplayValue(/Dave/i)
    const linkTextInput = (await screen.findByLabelText(/From name/i)) as HTMLInputElement
    await act(async () => {
      await fireEvent.change(linkTextInput, { target: { value: 'George' } })
    })
    const saveButton = (await screen.findByText(/Save/i, { selector: 'button' })) as HTMLButtonElement
    await act(async () => {
      await saveButton.click()
    })

    expect(mocked(emails).patchAccount).toHaveBeenCalledWith(user.username, [
      { op: 'test', path: '/name', value: 'Dave' },
      { op: 'replace', path: '/name', value: 'George' },
    ])
  })
})
