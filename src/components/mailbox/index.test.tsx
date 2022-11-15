import '@testing-library/jest-dom'
import { act, render, screen } from '@testing-library/react'
import { Auth } from 'aws-amplify'
import React from 'react'
import { mocked } from 'jest-mock'

import { email, emailBatch, emailContents, emailId, user } from '@test/__mocks__'
import EmailViewer from '@components/email-viewer'
import Mailbox from './index'

jest.mock('aws-amplify')
jest.mock('@components/email-viewer')

describe('Mailbox component', () => {
  const deleteEmail = jest.fn().mockResolvedValue(email)
  const getAllEmails = jest.fn().mockResolvedValue(emailBatch)
  const getEmailAttachment = jest.fn()
  const getEmailContents = jest.fn().mockResolvedValue(emailContents)

  beforeAll(() => {
    mocked(Auth).currentAuthenticatedUser.mockResolvedValue(user)
    mocked(EmailViewer).mockReturnValue(<>Email contents</>)

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { reload: jest.fn() },
    })
  })

  test('expect error message when user not logged in', async () => {
    mocked(Auth).currentAuthenticatedUser.mockRejectedValueOnce(undefined)
    render(
      <Mailbox
        deleteEmail={deleteEmail}
        getAllEmails={getAllEmails}
        getEmailAttachment={getEmailAttachment}
        getEmailContents={getEmailContents}
      />
    )

    expect(await screen.findByText(/Error authenticating user. Please reload the page to try again./i)).toBeVisible()
  })

  test('expect closing snackbar removes error', async () => {
    mocked(Auth).currentAuthenticatedUser.mockRejectedValueOnce(undefined)
    render(
      <Mailbox
        deleteEmail={deleteEmail}
        getAllEmails={getAllEmails}
        getEmailAttachment={getEmailAttachment}
        getEmailContents={getEmailContents}
      />
    )

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
    getAllEmails.mockRejectedValueOnce(undefined)
    render(
      <Mailbox
        deleteEmail={deleteEmail}
        getAllEmails={getAllEmails}
        getEmailAttachment={getEmailAttachment}
        getEmailContents={getEmailContents}
      />
    )

    expect(await screen.findByText(/Error fetching emails. Please reload the page to try again./i)).toBeVisible()
  })

  test('expect render of email list', async () => {
    render(
      <Mailbox
        deleteEmail={deleteEmail}
        getAllEmails={getAllEmails}
        getEmailAttachment={getEmailAttachment}
        getEmailContents={getEmailContents}
      />
    )

    expect(await screen.findByText(/Hello, world of email/i)).toBeVisible()
  })

  test('expect message when no emails', async () => {
    getAllEmails.mockResolvedValueOnce([])
    render(
      <Mailbox
        deleteEmail={deleteEmail}
        getAllEmails={getAllEmails}
        getEmailAttachment={getEmailAttachment}
        getEmailContents={getEmailContents}
      />
    )

    expect(await screen.findByText(/Your inbox is empty/i)).toBeVisible()
  })

  test('expect clicking on an email renders it', async () => {
    render(
      <Mailbox
        deleteEmail={deleteEmail}
        getAllEmails={getAllEmails}
        getEmailAttachment={getEmailAttachment}
        getEmailContents={getEmailContents}
      />
    )

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

  test('expect error message when getReceivedEmailContents rejects', async () => {
    getEmailContents.mockRejectedValueOnce(undefined)
    render(
      <Mailbox
        deleteEmail={deleteEmail}
        getAllEmails={getAllEmails}
        getEmailAttachment={getEmailAttachment}
        getEmailContents={getEmailContents}
      />
    )

    await screen.findByText(/Select an email to view/i)
    const emailElement = (await screen.findByText(/Hello, world of email/i)) as HTMLBaseElement
    act(() => {
      emailElement.click()
    })
    expect(await screen.findByText(/Error fetching email. Please try again./i)).toBeVisible()
  })

  test('expect deleteEmail invokes deleteReceivedEmail and getAllReceivedEmails', async () => {
    mocked(EmailViewer).mockImplementationOnce(({ deleteEmail }) => {
      deleteEmail && deleteEmail(user.username as string, emailId)
      return <>Delete invoked</>
    })
    render(
      <Mailbox
        deleteEmail={deleteEmail}
        getAllEmails={getAllEmails}
        getEmailAttachment={getEmailAttachment}
        getEmailContents={getEmailContents}
      />
    )

    await screen.findByText(/Delete invoked/i)
    expect(deleteEmail).toHaveBeenCalledWith(user.username, emailId)
    expect(getAllEmails).toHaveBeenCalledWith(user.username)
  })

  test('expect forward shows email', async () => {
    render(
      <Mailbox
        deleteEmail={deleteEmail}
        getAllEmails={getAllEmails}
        getEmailAttachment={getEmailAttachment}
        getEmailContents={getEmailContents}
      />
    )

    const forwardButton = (await screen.findByLabelText(/Show selected email/i, {
      selector: 'button',
    })) as HTMLButtonElement
    act(() => {
      forwardButton.click()
    })

    expect(await screen.findByText(/Email contents/i)).toBeVisible()
  })

  test('expect back button from email goes back', async () => {
    render(
      <Mailbox
        deleteEmail={deleteEmail}
        getAllEmails={getAllEmails}
        getEmailAttachment={getEmailAttachment}
        getEmailContents={getEmailContents}
      />
    )

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
