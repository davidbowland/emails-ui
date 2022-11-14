import '@testing-library/jest-dom'
import { act, render, screen } from '@testing-library/react'
import { Auth } from 'aws-amplify'
import React from 'react'
import { mocked } from 'jest-mock'

import * as emails from '@services/emails'
import { emailBatch, emailContents, emailId, user } from '@test/__mocks__'
import EmailViewer from '@components/email-viewer'
import Outbox from './index'

jest.mock('aws-amplify')
jest.mock('@components/email-viewer')
jest.mock('@services/emails')

describe('Inbox component', () => {
  beforeAll(() => {
    mocked(Auth).currentAuthenticatedUser.mockResolvedValue(user)
    mocked(EmailViewer).mockReturnValue(<>Email contents</>)
    mocked(emails).getAllSentEmails.mockResolvedValue(emailBatch)
    mocked(emails).getSentEmailContents.mockResolvedValue(emailContents)
  })

  test('expect error message when user not logged in', async () => {
    mocked(Auth).currentAuthenticatedUser.mockRejectedValueOnce(undefined)
    render(<Outbox />)

    expect(await screen.findByText(/Error authenticating user. Please reload the page to try again./i)).toBeVisible()
  })

  test('expect closing snackbar removes error', async () => {
    mocked(Auth).currentAuthenticatedUser.mockRejectedValueOnce(undefined)
    render(<Outbox />)

    await screen.findByText(/Error authenticating user. Please reload the page to try again./i)
    const closeSnackbarButton = (await screen.findByLabelText(/Close/i, { selector: 'button' })) as HTMLButtonElement
    act(() => {
      closeSnackbarButton.click()
    })
    expect(
      screen.queryByText(/Error authenticating user. Please reload the page to try again./i)
    ).not.toBeInTheDocument()
  })

  test('expect error message when getAllReceivedEmails rejects', async () => {
    mocked(emails).getAllSentEmails.mockRejectedValueOnce(undefined)
    render(<Outbox />)

    expect(await screen.findByText(/Error fetching emails. Please reload the page to try again./i)).toBeVisible()
  })

  test('expect render of email list', async () => {
    render(<Outbox />)

    expect(await screen.findByText(/Hello, world of email/i)).toBeVisible()
  })

  test('expect message when no emails', async () => {
    mocked(emails).getAllSentEmails.mockResolvedValueOnce([])
    render(<Outbox />)

    expect(await screen.findByText(/Your inbox is empty/i)).toBeVisible()
  })

  test('expect clicking on an email renders it', async () => {
    render(<Outbox />)

    await screen.findByText(/Select an email to view/i)
    const emailElement = (await screen.findByText(/Hello, world of email/i)) as HTMLBaseElement
    await act(async () => {
      await emailElement.click()
    })
    expect(await screen.findByText(/Email contents/i)).toBeVisible()
    expect(EmailViewer).toHaveBeenCalledWith(
      expect.objectContaining({ accountId: user.username, email: emailContents, emailId }),
      {}
    )
  })

  test('expect error message when getSentEmailContents rejects', async () => {
    mocked(emails).getSentEmailContents.mockRejectedValueOnce(undefined)
    render(<Outbox />)

    await screen.findByText(/Select an email to view/i)
    const emailElement = (await screen.findByText(/Hello, world of email/i)) as HTMLBaseElement
    act(() => {
      emailElement.click()
    })
    expect(await screen.findByText(/Error fetching email. Please try again./i)).toBeVisible()
  })

  test('expect deleteEmail invokes deleteSentEmail and getAllSentEmails', async () => {
    mocked(EmailViewer).mockImplementationOnce(({ deleteEmail }) => {
      deleteEmail && deleteEmail(user.username as string, emailId)
      return <>Delete invoked</>
    })
    render(<Outbox />)

    await screen.findByText(/Delete invoked/i)
    expect(mocked(emails).deleteSentEmail).toHaveBeenCalledWith(user.username, emailId)
    expect(mocked(emails).getAllSentEmails).toHaveBeenCalledWith(user.username)
  })

  test('expect forward shows email', async () => {
    render(<Outbox />)

    const forwardButton = (await screen.findByLabelText(/Show selected email/i, {
      selector: 'button',
    })) as HTMLButtonElement
    act(() => {
      forwardButton.click()
    })

    expect(await screen.findByText(/Email contents/i)).toBeVisible()
  })

  test('expect back button from email goes back', async () => {
    render(<Outbox />)

    const forwardButton = (await screen.findByLabelText(/Show selected email/i, {
      selector: 'button',
    })) as HTMLButtonElement
    act(() => {
      forwardButton.click()
    })
    const backButton = (await screen.findByLabelText(/Back to email list/i, {
      selector: 'button',
    })) as HTMLButtonElement
    act(() => {
      backButton.click()
    })

    expect(await screen.findByText(/4\/13\/1975, 4:21:13 PM/i)).toBeVisible()
  })
})
