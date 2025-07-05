import { Authenticator, ThemeProvider } from '@aws-amplify/ui-react'
import { user } from '@test/__mocks__'
import '@testing-library/jest-dom'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Auth } from 'aws-amplify'
import * as gatsby from 'gatsby'
import React from 'react'

import Authenticated from './index'

jest.mock('aws-amplify')
jest.mock('gatsby')
jest.mock('@aws-amplify/analytics')
jest.mock('@aws-amplify/ui-react')
jest.mock('@config/amplify')

describe('Authenticated component', () => {
  const mockLocationReload = jest.fn()

  beforeAll(() => {
    jest.mocked(Auth.signOut).mockResolvedValue({})
    jest.mocked(Authenticator).mockReturnValue(<></>)
    jest.mocked(ThemeProvider).mockImplementation(({ children }) => children as unknown as JSX.Element)

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
      jest.mocked(Auth.currentAuthenticatedUser).mockRejectedValue(new Error('Not authenticated'))
    })

    it('should use system color mode', async () => {
      render(
        <Authenticated>
          <p>Testing children</p>
        </Authenticated>,
      )

      expect(ThemeProvider).toHaveBeenCalledWith(expect.objectContaining({ colorMode: 'system' }), expect.anything())
    })
  })

  describe('signed out', () => {
    beforeAll(() => {
      jest.mocked(Auth.currentAuthenticatedUser).mockRejectedValue(new Error('Not authenticated'))
    })

    it('should show title and children when showContent is true', async () => {
      render(
        <Authenticated showContent={true}>
          <p>Testing children</p>
        </Authenticated>,
      )

      expect(await screen.findByText(/Testing children/i)).toBeInTheDocument()
      expect(await screen.findByText(/Email/i)).toBeInTheDocument()
    })

    it('should show title but not children when showContent is false', async () => {
      render(
        <Authenticated>
          <p>Testing children</p>
        </Authenticated>,
      )

      expect(await screen.findByText(/Email/i)).toBeInTheDocument()
      expect(screen.queryByText(/Testing children/i)).not.toBeInTheDocument()
    })

    it('should show authenticator when not logged in', async () => {
      render(
        <Authenticated>
          <p>Testing children</p>
        </Authenticated>,
      )

      expect(Authenticator).toHaveBeenCalledTimes(1)
    })

    it('should set the user when logging in', async () => {
      const logInCallback = jest.fn()
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      jest.mocked(Authenticator).mockImplementationOnce(({ children }: any) => {
        logInCallback.mockImplementation(() => children && children({ signOut: jest.fn(), user }))
        return <></>
      })

      render(
        <Authenticated>
          <p>Testing children</p>
        </Authenticated>,
      )

      await act(async () => {
        logInCallback()
      })

      await waitFor(() => {
        expect(Authenticator).toHaveBeenCalled()
      })
      expect(Authenticator).toHaveBeenCalledTimes(1)
      expect(await screen.findByText(/Dave/i)).toBeInTheDocument()
    })
  })

  describe('signed in', () => {
    beforeAll(() => {
      jest.mocked(Auth.currentAuthenticatedUser).mockResolvedValue(user)
      user.deleteUser = jest.fn().mockImplementation((callback) => callback())
    })

    it('should display user name when logged in', async () => {
      render(
        <Authenticated>
          <p>Testing children</p>
        </Authenticated>,
      )

      expect(await screen.findByText(/Dave/i)).toBeInTheDocument()
    })

    it('should open menu when menu button is clicked', async () => {
      render(
        <Authenticated>
          <p>Testing children</p>
        </Authenticated>,
      )

      const menuButton = (await screen.findByLabelText(/Open navigation menu/i, {
        selector: 'button',
      })) as HTMLButtonElement

      await act(async () => {
        await userEvent.click(menuButton)
      })

      expect(await screen.findByText(/Sign out/i)).toBeVisible()
      expect(await screen.findByText(/Delete account/i)).toBeVisible()
    })

    it('should sign out user when sign out button is clicked', async () => {
      render(
        <Authenticated>
          <p>Testing children</p>
        </Authenticated>,
      )

      const menuButton = (await screen.findByLabelText(/Open navigation menu/i, {
        selector: 'button',
      })) as HTMLButtonElement

      await act(async () => {
        await userEvent.click(menuButton)
      })

      const signOutButton = (await screen.findByText(/Sign out/i)) as HTMLButtonElement

      await act(async () => {
        await userEvent.click(signOutButton)
      })

      expect(user.deleteUser).not.toHaveBeenCalled()
      expect(Auth.signOut).toHaveBeenCalled()
      expect(screen.queryByText(/Dave/i)).not.toBeInTheDocument()
      await waitFor(() => expect(mockLocationReload).toHaveBeenCalled())
    })

    it.each([
      [/compose/i, '/compose'],
      [/inbox/i, '/inbox'],
      [/sent/i, '/outbox'],
      [/settings/i, '/settings'],
      [/privacy policy/i, '/privacy-policy'],
    ])('should navigate to %s when menu item is clicked', async (label, path) => {
      window.location.pathname = path
      render(
        <Authenticated>
          <p>Testing children</p>
        </Authenticated>,
      )

      const menuButton = (await screen.findByLabelText(/Open navigation menu/i, {
        selector: 'button',
      })) as HTMLButtonElement

      await act(async () => {
        await userEvent.click(menuButton)
      })

      const selectionButton = (await screen.findByText(label)) as HTMLButtonElement

      await act(async () => {
        await userEvent.click(selectionButton)
      })

      expect(gatsby.navigate).toHaveBeenCalledWith(path)
    })

    describe('delete account', () => {
      it('should not delete account when back button is clicked', async () => {
        render(
          <Authenticated>
            <p>Testing children</p>
          </Authenticated>,
        )

        const menuButton = (await screen.findByLabelText(/Open navigation menu/i, {
          selector: 'button',
        })) as HTMLButtonElement

        await act(async () => {
          await userEvent.click(menuButton)
        })

        const deleteAccountMenuOption = (await screen.findByText(/Delete account/i)) as HTMLButtonElement

        await act(async () => {
          await userEvent.click(deleteAccountMenuOption)
        })

        const goBackButton = (await screen.findByText(/Go back/i)) as HTMLButtonElement

        await act(async () => {
          await userEvent.click(goBackButton)
        })

        expect(user.deleteUser).not.toHaveBeenCalled()
        expect(Auth.signOut).not.toHaveBeenCalled()
        expect(screen.queryByText(/Sign in/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/Dave/i)).toBeInTheDocument()
        expect(mockLocationReload).not.toHaveBeenCalled()
      })

      it('should delete account when continue button is clicked', async () => {
        render(
          <Authenticated>
            <p>Testing children</p>
          </Authenticated>,
        )

        const menuButton = (await screen.findByLabelText(/Open navigation menu/i, {
          selector: 'button',
        })) as HTMLButtonElement

        await act(async () => {
          await userEvent.click(menuButton)
        })

        const deleteAccountMenuOption = (await screen.findByText(/Delete account/i)) as HTMLButtonElement

        await act(async () => {
          await userEvent.click(deleteAccountMenuOption)
        })

        const continueButton = (await screen.findByText(/Continue/i)) as HTMLButtonElement

        await act(async () => {
          await userEvent.click(continueButton)
        })

        expect(user.deleteUser).toHaveBeenCalled()
        expect(Auth.signOut).toHaveBeenCalled()
        expect(screen.queryByText(/Dave/i)).not.toBeInTheDocument()
        await waitFor(() => expect(mockLocationReload).toHaveBeenCalled())
      })

      it('should show error message when account deletion fails', async () => {
        jest
          .mocked(user.deleteUser)
          .mockImplementationOnce((callback: any) => callback(new Error('Thar be errors here')))

        render(
          <Authenticated>
            <p>Testing children</p>
          </Authenticated>,
        )

        const menuButton = (await screen.findByLabelText(/Open navigation menu/i, {
          selector: 'button',
        })) as HTMLButtonElement

        await act(async () => {
          await userEvent.click(menuButton)
        })

        const deleteAccountMenuOption = (await screen.findByText(/Delete account/i)) as HTMLButtonElement

        await act(async () => {
          await userEvent.click(deleteAccountMenuOption)
        })

        const continueButton = (await screen.findByText(/Continue/i)) as HTMLButtonElement

        await act(async () => {
          await userEvent.click(continueButton)
        })

        expect(user.deleteUser).toHaveBeenCalled()
        expect(Auth.signOut).not.toHaveBeenCalled()
        expect(console.error).toHaveBeenCalled()
        expect(await screen.findByText(/There was a problem deleting your account/i)).toBeVisible()
      })

      it('should remove error message when close button is clicked', async () => {
        jest
          .mocked(user.deleteUser)
          .mockImplementationOnce((callback: any) => callback(new Error('Thar be errors here')))
        render(
          <Authenticated>
            <p>Testing children</p>
          </Authenticated>,
        )

        const menuButton = (await screen.findByLabelText(/Open navigation menu/i, {
          selector: 'button',
        })) as HTMLButtonElement

        await act(async () => {
          await userEvent.click(menuButton)
        })

        const deleteAccountMenuOption = (await screen.findByText(/Delete account/i)) as HTMLButtonElement

        await act(async () => {
          await userEvent.click(deleteAccountMenuOption)
        })

        const continueButton = (await screen.findByText(/Continue/i)) as HTMLButtonElement

        await act(async () => {
          await userEvent.click(continueButton)
        })

        const closeSnackbarButton = (await screen.findByLabelText(/Close$/i, {
          selector: 'button',
        })) as HTMLButtonElement

        await act(async () => {
          await userEvent.click(closeSnackbarButton)
        })

        expect(await screen.findByText(/There was a problem deleting your account/i)).not.toBeVisible()
      })
    })
  })
})
