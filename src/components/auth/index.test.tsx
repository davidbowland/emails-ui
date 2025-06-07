import { Authenticator, ThemeProvider } from '@aws-amplify/ui-react'
import { user } from '@test/__mocks__'
import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Auth } from 'aws-amplify'
import * as gatsby from 'gatsby'
import { mocked } from 'jest-mock'
import React from 'react'

import Authenticated from './index'

jest.mock('aws-amplify')
jest.mock('gatsby')
jest.mock('@aws-amplify/analytics')
jest.mock('@aws-amplify/ui-react')

describe('Authenticated component', () => {
  const mockLocationReload = jest.fn()

  beforeAll(() => {
    mocked(Auth).signOut.mockResolvedValue({})
    mocked(Authenticator).mockReturnValue(<></>)
    mocked(ThemeProvider).mockImplementation(({ children }) => children as unknown as JSX.Element)

    console.error = jest.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { pathname: '', reload: mockLocationReload },
    })
  })

  beforeEach(() => {
    window.location.pathname = ''
  })

  describe('theme', () => {
    beforeAll(() => {
      mocked(Auth).currentAuthenticatedUser.mockRejectedValue(undefined)
    })

    test('expect system color mode', async () => {
      render(
        <Authenticated>
          <p>Testing children</p>
        </Authenticated>,
      )

      expect(mocked(ThemeProvider)).toHaveBeenCalledWith(
        expect.objectContaining({ colorMode: 'system' }),
        expect.anything(),
      )
    })
  })

  describe('signed out', () => {
    beforeAll(() => {
      mocked(Auth).currentAuthenticatedUser.mockRejectedValue(undefined)
    })

    test('expect title and children', async () => {
      render(
        <Authenticated showContent={true}>
          <p>Testing children</p>
        </Authenticated>,
      )

      expect(await screen.findByText(/Testing children/i)).toBeInTheDocument()
      expect(await screen.findByText(/Email/i)).toBeInTheDocument()
    })

    test('expect title and no children', async () => {
      render(
        <Authenticated>
          <p>Testing children</p>
        </Authenticated>,
      )

      expect(await screen.findByText(/Email/i)).toBeInTheDocument()
      expect(screen.queryByText(/Testing children/i)).not.toBeInTheDocument()
    })

    test('expect authenticator shown', async () => {
      render(
        <Authenticated>
          <p>Testing children</p>
        </Authenticated>,
      )

      expect(mocked(Authenticator)).toHaveBeenCalledTimes(1)
    })

    test('expect logging in sets the user', async () => {
      const logInCallback = jest.fn()
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      mocked(Authenticator).mockImplementationOnce(({ children }: unknown) => {
        logInCallback.mockImplementation(() => children && children({ signOut: jest.fn(), user }))
        return <></>
      })

      render(
        <Authenticated>
          <p>Testing children</p>
        </Authenticated>,
      )
      logInCallback()

      await waitFor(() => {
        expect(mocked(Authenticator)).toHaveBeenCalled()
      })
      expect(mocked(Authenticator)).toHaveBeenCalledTimes(1)
      expect(await screen.findByText(/Dave/i)).toBeInTheDocument()
    })
  })

  describe('signed in', () => {
    beforeAll(() => {
      mocked(Auth).currentAuthenticatedUser.mockResolvedValue(user)
      user.deleteUser = jest.fn().mockImplementation((callback) => callback())
    })

    test('expect user name', async () => {
      render(
        <Authenticated>
          <p>Testing children</p>
        </Authenticated>,
      )

      expect(await screen.findByText(/Dave/i)).toBeInTheDocument()
    })

    test('expect working menu', async () => {
      render(
        <Authenticated>
          <p>Testing children</p>
        </Authenticated>,
      )

      const menuButton = (await screen.findByLabelText(/Open navigation menu/i, {
        selector: 'button',
      })) as HTMLButtonElement
      fireEvent.click(menuButton)

      expect(await screen.findByText(/Sign out/i)).toBeVisible()
      expect(await screen.findByText(/Delete account/i)).toBeVisible()
    })

    test('expect selecting sign out signs the user out', async () => {
      render(
        <Authenticated>
          <p>Testing children</p>
        </Authenticated>,
      )

      const menuButton = (await screen.findByLabelText(/Open navigation menu/i, {
        selector: 'button',
      })) as HTMLButtonElement
      fireEvent.click(menuButton)
      const signOutButton = (await screen.findByText(/Sign out/i)) as HTMLButtonElement
      fireEvent.click(signOutButton)

      expect(user.deleteUser).not.toHaveBeenCalled()
      expect(mocked(Auth).signOut).toHaveBeenCalled()
      expect(screen.queryByText(/Dave/i)).not.toBeInTheDocument()
      await waitFor(() => expect(mockLocationReload).toHaveBeenCalled())
    })

    test.each([
      [/compose/i, '/compose'],
      [/inbox/i, '/inbox'],
      [/sent/i, '/outbox'],
      [/settings/i, '/settings'],
      [/privacy policy/i, '/privacy-policy'],
    ])('expect selecting %s navigates to %s', async (label, path) => {
      window.location.pathname = path
      render(
        <Authenticated>
          <p>Testing children</p>
        </Authenticated>,
      )

      const menuButton = (await screen.findByLabelText(/Open navigation menu/i, {
        selector: 'button',
      })) as HTMLButtonElement
      fireEvent.click(menuButton)
      const selectionButton = (await screen.findByText(label)) as HTMLButtonElement
      fireEvent.click(selectionButton)

      expect(mocked(gatsby).navigate).toHaveBeenCalledWith(path)
    })

    describe('delete account', () => {
      test('expect selecting delete account and then back does not delete account', async () => {
        render(
          <Authenticated>
            <p>Testing children</p>
          </Authenticated>,
        )

        const menuButton = (await screen.findByLabelText(/Open navigation menu/i, {
          selector: 'button',
        })) as HTMLButtonElement
        fireEvent.click(menuButton)
        const deleteAccountMenuOption = (await screen.findByText(/Delete account/i)) as HTMLButtonElement
        fireEvent.click(deleteAccountMenuOption)
        const goBackButton = (await screen.findByText(/Go back/i)) as HTMLButtonElement
        fireEvent.click(goBackButton)

        expect(user.deleteUser).not.toHaveBeenCalled()
        expect(mocked(Auth).signOut).not.toHaveBeenCalled()
        expect(screen.queryByText(/Sign in/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/Dave/i)).toBeInTheDocument()
        expect(mockLocationReload).not.toHaveBeenCalled()
      })

      test('expect selecting delete account invokes delete function', async () => {
        render(
          <Authenticated>
            <p>Testing children</p>
          </Authenticated>,
        )

        const menuButton = (await screen.findByLabelText(/Open navigation menu/i, {
          selector: 'button',
        })) as HTMLButtonElement
        fireEvent.click(menuButton)
        const deleteAccountMenuOption = (await screen.findByText(/Delete account/i)) as HTMLButtonElement
        fireEvent.click(deleteAccountMenuOption)
        const continueButton = (await screen.findByText(/Continue/i)) as HTMLButtonElement
        fireEvent.click(continueButton)

        expect(user.deleteUser).toHaveBeenCalled()
        expect(mocked(Auth).signOut).toHaveBeenCalled()
        expect(screen.queryByText(/Dave/i)).not.toBeInTheDocument()
        await waitFor(() => expect(mockLocationReload).toHaveBeenCalled())
      })

      test('expect delete account error shows snackbar', async () => {
        mocked(user.deleteUser).mockImplementationOnce((callback: any) => callback(new Error('Thar be errors here')))

        render(
          <Authenticated>
            <p>Testing children</p>
          </Authenticated>,
        )

        const menuButton = (await screen.findByLabelText(/Open navigation menu/i, {
          selector: 'button',
        })) as HTMLButtonElement
        fireEvent.click(menuButton)
        const deleteAccountMenuOption = (await screen.findByText(/Delete account/i)) as HTMLButtonElement
        fireEvent.click(deleteAccountMenuOption)
        const continueButton = (await screen.findByText(/Continue/i)) as HTMLButtonElement
        fireEvent.click(continueButton)

        expect(user.deleteUser).toHaveBeenCalled()
        expect(mocked(Auth).signOut).not.toHaveBeenCalled()
        expect(console.error).toHaveBeenCalled()
        expect(await screen.findByText(/There was a problem deleting your account/i)).toBeVisible()
      })

      test('expect closing delete error snackbar removes the text', async () => {
        mocked(user.deleteUser).mockImplementationOnce((callback: any) => callback(new Error('Thar be errors here')))
        render(
          <Authenticated>
            <p>Testing children</p>
          </Authenticated>,
        )

        const menuButton = (await screen.findByLabelText(/Open navigation menu/i, {
          selector: 'button',
        })) as HTMLButtonElement
        fireEvent.click(menuButton)
        const deleteAccountMenuOption = (await screen.findByText(/Delete account/i)) as HTMLButtonElement
        fireEvent.click(deleteAccountMenuOption)
        const continueButton = (await screen.findByText(/Continue/i)) as HTMLButtonElement
        fireEvent.click(continueButton)
        const closeSnackbarButton = (await screen.findByLabelText(/Close$/i, {
          selector: 'button',
        })) as HTMLButtonElement
        fireEvent.click(closeSnackbarButton)

        expect(await screen.findByText(/There was a problem deleting your account/i)).not.toBeVisible()
      })
    })
  })
})
