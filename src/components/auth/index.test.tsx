import '@testing-library/jest-dom'
import { Authenticator, ThemeProvider } from '@aws-amplify/ui-react'
import { act, render, screen, waitFor } from '@testing-library/react'
import { Auth } from 'aws-amplify'
import React from 'react'
import { mocked } from 'jest-mock'

import Authenticated from './index'
import { user } from '@test/__mocks__'

jest.mock('aws-amplify')
jest.mock('@aws-amplify/analytics')
jest.mock('@aws-amplify/ui-react')

describe('Authenticated component', () => {
  const consoleError = console.error
  const mockLocationReload = jest.fn()
  const windowLocationReload = window.location.reload

  beforeAll(() => {
    mocked(Auth).signOut.mockResolvedValue({})
    mocked(Authenticator).mockReturnValue(<></>)
    mocked(ThemeProvider).mockImplementation(({ children }) => children as unknown as JSX.Element)

    console.error = jest.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { reload: mockLocationReload },
    })
  })

  afterAll(() => {
    console.error = consoleError
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { replace: windowLocationReload },
    })
  })

  describe('theme', () => {
    beforeAll(() => {
      mocked(Auth).currentAuthenticatedUser.mockRejectedValue(undefined)
    })

    test('expect system color mode', async () => {
      render(
        <Authenticated>
          <p>Testing children</p>
        </Authenticated>
      )

      expect(mocked(ThemeProvider)).toHaveBeenCalledWith(
        expect.objectContaining({ colorMode: 'system' }),
        expect.anything()
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
        </Authenticated>
      )

      expect(await screen.findByText(/Testing children/i)).toBeInTheDocument()
      expect(await screen.findByText(/Email/i)).toBeInTheDocument()
    })

    test('expect title and no children', async () => {
      render(
        <Authenticated>
          <p>Testing children</p>
        </Authenticated>
      )

      expect(await screen.findByText(/Email/i)).toBeInTheDocument()
      expect(screen.queryByText(/Testing children/i)).not.toBeInTheDocument()
    })

    test('expect authenticator shown', async () => {
      render(
        <Authenticated>
          <p>Testing children</p>
        </Authenticated>
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
        </Authenticated>
      )
      await act(async () => {
        logInCallback()
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
        </Authenticated>
      )

      expect(await screen.findByText(/Dave/i)).toBeInTheDocument()
    })

    test('expect working menu', async () => {
      render(
        <Authenticated>
          <p>Testing children</p>
        </Authenticated>
      )
      const menuButton = (await screen.findByLabelText(/menu/i, { selector: 'button' })) as HTMLButtonElement
      await act(async () => {
        menuButton.click()
      })

      expect(await screen.findByText(/Sign out/i)).toBeVisible()
      expect(await screen.findByText(/Delete account/i)).toBeVisible()
    })

    test('expect selecting sign out signs the user out', async () => {
      render(
        <Authenticated>
          <p>Testing children</p>
        </Authenticated>
      )
      const menuButton = (await screen.findByLabelText(/menu/i, { selector: 'button' })) as HTMLButtonElement
      await act(async () => {
        menuButton.click()
      })
      const signOutButton = (await screen.findByText(/Sign out/i)) as HTMLButtonElement
      await act(async () => {
        signOutButton.click()
      })

      expect(user.deleteUser).not.toHaveBeenCalled()
      expect(mocked(Auth).signOut).toHaveBeenCalled()
      expect(screen.queryByText(/Dave/i)).not.toBeInTheDocument()
      await waitFor(() => expect(mockLocationReload).toHaveBeenCalled())
    })

    describe('delete account', () => {
      test('expect selecting delete account and then back does not delete account', async () => {
        render(
          <Authenticated>
            <p>Testing children</p>
          </Authenticated>
        )
        const menuButton = (await screen.findByLabelText(/menu/i, { selector: 'button' })) as HTMLButtonElement
        await act(async () => {
          menuButton.click()
        })
        const deleteAccountMenuOption = (await screen.findByText(/Delete account/i)) as HTMLButtonElement
        await act(async () => {
          deleteAccountMenuOption.click()
        })
        const goBackButton = (await screen.findByText(/Go back/i)) as HTMLButtonElement
        act(() => {
          goBackButton.click()
        })

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
          </Authenticated>
        )
        const menuButton = (await screen.findByLabelText(/menu/i, { selector: 'button' })) as HTMLButtonElement
        act(() => {
          menuButton.click()
        })
        const deleteAccountMenuOption = (await screen.findByText(/Delete account/i)) as HTMLButtonElement
        act(() => {
          deleteAccountMenuOption.click()
        })
        const continueButton = (await screen.findByText(/Continue/i)) as HTMLButtonElement
        act(() => {
          continueButton.click()
        })

        expect(user.deleteUser).toHaveBeenCalled()
        expect(mocked(Auth).signOut).toHaveBeenCalled()
        expect(screen.queryByText(/Dave/i)).not.toBeInTheDocument()
        await waitFor(() => expect(mockLocationReload).toHaveBeenCalled())
      })

      test('expect delete account error shows snackbar', async () => {
        mocked(user.deleteUser).mockImplementationOnce((callback) => callback(new Error('Thar be errors here')))

        render(
          <Authenticated>
            <p>Testing children</p>
          </Authenticated>
        )
        const menuButton = (await screen.findByLabelText(/menu/i, { selector: 'button' })) as HTMLButtonElement
        act(() => {
          menuButton.click()
        })
        const deleteAccountMenuOption = (await screen.findByText(/Delete account/i)) as HTMLButtonElement
        act(() => {
          deleteAccountMenuOption.click()
        })
        const continueButton = (await screen.findByText(/Continue/i)) as HTMLButtonElement
        act(() => {
          continueButton.click()
        })

        expect(user.deleteUser).toHaveBeenCalled()
        expect(mocked(Auth).signOut).not.toHaveBeenCalled()
        expect(console.error).toHaveBeenCalled()
        expect(await screen.findByText(/There was a problem deleting your account/i)).toBeVisible()
      })

      test('expect closing delete error snackbar removes the text', async () => {
        mocked(user.deleteUser).mockImplementationOnce((callback) => callback(new Error('Thar be errors here')))

        render(
          <Authenticated>
            <p>Testing children</p>
          </Authenticated>
        )
        const menuButton = (await screen.findByLabelText(/menu/i, { selector: 'button' })) as HTMLButtonElement
        act(() => {
          menuButton.click()
        })
        const deleteAccountMenuOption = (await screen.findByText(/Delete account/i)) as HTMLButtonElement
        act(() => {
          deleteAccountMenuOption.click()
        })
        const continueButton = (await screen.findByText(/Continue/i)) as HTMLButtonElement
        act(() => {
          continueButton.click()
        })
        const closeSnackbarButton = (await screen.findByLabelText(/Close/i, {
          selector: 'button',
        })) as HTMLButtonElement
        act(() => {
          closeSnackbarButton.click()
        })

        expect(await screen.findByText(/There was a problem deleting your account/i)).not.toBeVisible()
      })
    })
  })
})
