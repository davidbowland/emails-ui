import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Auth } from 'aws-amplify'
import { mocked } from 'jest-mock'
import React from 'react'

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
  const patchEmail = jest.fn().mockResolvedValue(undefined)

  beforeAll(() => {
    mocked(Auth).currentAuthenticatedUser.mockResolvedValue(user)
    mocked(EmailViewer).mockReturnValue(<>Email contents</>)

    console.error = jest.fn()
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
        patchEmail={patchEmail}
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
        patchEmail={patchEmail}
      />
    )

    await screen.findByText(/Error authenticating user. Please reload the page to try again./i)
    const closeSnackbarButton = (await screen.findByLabelText(/Close/i, { selector: 'button' })) as HTMLButtonElement
    fireEvent.click(closeSnackbarButton)

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
        patchEmail={patchEmail}
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
        patchEmail={patchEmail}
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
        patchEmail={patchEmail}
      />
    )

    expect(await screen.findByText(/This mailbox is empty/i)).toBeVisible()
  })

  test('expect clicking on an email renders it', async () => {
    render(
      <Mailbox
        deleteEmail={deleteEmail}
        getAllEmails={getAllEmails}
        getEmailAttachment={getEmailAttachment}
        getEmailContents={getEmailContents}
        patchEmail={patchEmail}
      />
    )

    await screen.findByText(/Select an email to view/i)
    const emailElement = (await screen.findByText(/Hello, world of email/i)) as HTMLBaseElement
    fireEvent.click(emailElement)

    expect(await screen.findByText(/Email contents/i)).toBeVisible()
    expect(EmailViewer).toHaveBeenCalledWith(
      expect.objectContaining({ accountId: user.username, email: emailContents, emailId }),
      {}
    )
    expect(patchEmail).toHaveBeenCalledWith(user.username, emailId, [{ op: 'replace', path: '/viewed', value: true }])
  })

  test('expect error message when getReceivedEmailContents rejects', async () => {
    getEmailContents.mockRejectedValueOnce(undefined)
    render(
      <Mailbox
        deleteEmail={deleteEmail}
        getAllEmails={getAllEmails}
        getEmailAttachment={getEmailAttachment}
        getEmailContents={getEmailContents}
        patchEmail={patchEmail}
      />
    )

    await screen.findByText(/Select an email to view/i)
    const emailElement = (await screen.findByText(/Hello, world of email/i)) as HTMLBaseElement
    fireEvent.click(emailElement)

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
        patchEmail={patchEmail}
      />
    )

    await screen.findByText(/Delete invoked/i)
    await waitFor(() => {
      expect(deleteEmail).toHaveBeenCalledWith(user.username, emailId)
    })
    expect(getAllEmails).toHaveBeenCalledWith(user.username)
  })

  test('expect forward shows email', async () => {
    render(
      <Mailbox
        deleteEmail={deleteEmail}
        getAllEmails={getAllEmails}
        getEmailAttachment={getEmailAttachment}
        getEmailContents={getEmailContents}
        patchEmail={patchEmail}
      />
    )

    const forwardButton = (await screen.findByLabelText(/Show selected email/i, {
      selector: 'button',
    })) as HTMLButtonElement
    fireEvent.click(forwardButton)

    await waitFor(() => {
      expect(screen.queryByText(/Email contents/i)).toBeVisible()
    })
  })

  test('expect back button from email goes back', async () => {
    render(
      <Mailbox
        deleteEmail={deleteEmail}
        getAllEmails={getAllEmails}
        getEmailAttachment={getEmailAttachment}
        getEmailContents={getEmailContents}
        patchEmail={patchEmail}
      />
    )

    const forwardButton = (await screen.findByLabelText(/Show selected email/i, {
      selector: 'button',
    })) as HTMLButtonElement
    fireEvent.click(forwardButton)
    const backButton = (await screen.findByLabelText(/Back to email list/i, {
      selector: 'button',
    })) as HTMLButtonElement
    fireEvent.click(backButton)

    expect(await screen.findByText(/4\/13\/1975, \d+:21:13 PM/i)).toBeVisible()
  })
})
