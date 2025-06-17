import EmailViewer from '@components/email-viewer'
import { email, emailBatch, emailContents, emailId, user } from '@test/__mocks__'
import '@testing-library/jest-dom'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Auth } from 'aws-amplify'
import React from 'react'

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
    jest.mocked(Auth).currentAuthenticatedUser.mockResolvedValue(user)
    jest.mocked(EmailViewer).mockReturnValue(<>Email contents</>)

    console.error = jest.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { reload: jest.fn() },
    })
  })

  it('should show error message when user is not logged in', async () => {
    jest.mocked(Auth).currentAuthenticatedUser.mockRejectedValueOnce(undefined)
    render(
      <Mailbox
        deleteEmail={deleteEmail}
        getAllEmails={getAllEmails}
        getEmailAttachment={getEmailAttachment}
        getEmailContents={getEmailContents}
        patchEmail={patchEmail}
      />,
    )

    expect(await screen.findByText(/Error authenticating user. Please reload the page to try again./i)).toBeVisible()
  })

  it('should remove error when closing snackbar', async () => {
    jest.mocked(Auth).currentAuthenticatedUser.mockRejectedValueOnce(undefined)
    render(
      <Mailbox
        deleteEmail={deleteEmail}
        getAllEmails={getAllEmails}
        getEmailAttachment={getEmailAttachment}
        getEmailContents={getEmailContents}
        patchEmail={patchEmail}
      />,
    )

    await screen.findByText(/Error authenticating user. Please reload the page to try again./i)
    const closeSnackbarButton = (await screen.findByLabelText(/Close/i, { selector: 'button' })) as HTMLButtonElement

    await act(async () => {
      await userEvent.click(closeSnackbarButton)
    })

    expect(
      screen.queryByText(/Error authenticating user. Please reload the page to try again./i),
    ).not.toBeInTheDocument()
  })

  it('should show error message when getAllEmails fails', async () => {
    getAllEmails.mockRejectedValueOnce(undefined)
    render(
      <Mailbox
        deleteEmail={deleteEmail}
        getAllEmails={getAllEmails}
        getEmailAttachment={getEmailAttachment}
        getEmailContents={getEmailContents}
        patchEmail={patchEmail}
      />,
    )

    expect(await screen.findByText(/Error fetching emails. Please reload the page to try again./i)).toBeVisible()
  })

  it('should render the email list', async () => {
    render(
      <Mailbox
        deleteEmail={deleteEmail}
        getAllEmails={getAllEmails}
        getEmailAttachment={getEmailAttachment}
        getEmailContents={getEmailContents}
        patchEmail={patchEmail}
      />,
    )

    expect(await screen.findByText(/Hello, world of email/i)).toBeVisible()
  })

  it('should show message when mailbox is empty', async () => {
    getAllEmails.mockResolvedValueOnce([])
    render(
      <Mailbox
        deleteEmail={deleteEmail}
        getAllEmails={getAllEmails}
        getEmailAttachment={getEmailAttachment}
        getEmailContents={getEmailContents}
        patchEmail={patchEmail}
      />,
    )

    expect(await screen.findByText(/This mailbox is empty/i)).toBeVisible()
  })

  it('should render email content when clicking on an email', async () => {
    render(
      <Mailbox
        deleteEmail={deleteEmail}
        getAllEmails={getAllEmails}
        getEmailAttachment={getEmailAttachment}
        getEmailContents={getEmailContents}
        patchEmail={patchEmail}
      />,
    )

    await screen.findByText(/Select an email to view/i)
    const emailElement = (await screen.findByText(/Hello, world of email/i)) as HTMLBaseElement

    await act(async () => {
      await userEvent.click(emailElement)
    })

    expect(await screen.findByText(/Email contents/i)).toBeVisible()
    expect(EmailViewer).toHaveBeenCalledWith(
      expect.objectContaining({ accountId: user.username, email: emailContents, emailId }),
      {},
    )
    expect(patchEmail).toHaveBeenCalledWith(user.username, emailId, [{ op: 'replace', path: '/viewed', value: true }])
  })

  it('should show error message when getEmailContents fails', async () => {
    getEmailContents.mockRejectedValueOnce(undefined).mockRejectedValueOnce(undefined)
    render(
      <Mailbox
        deleteEmail={deleteEmail}
        getAllEmails={getAllEmails}
        getEmailAttachment={getEmailAttachment}
        getEmailContents={getEmailContents}
        patchEmail={patchEmail}
      />,
    )

    await screen.findByText(/Select an email to view/i)
    const emailElement = (await screen.findByText(/Hello, world of email/i)) as HTMLBaseElement

    await act(async () => {
      await userEvent.click(emailElement)
    })

    expect(await screen.findByText(/Error fetching email. Please try again./i)).toBeVisible()
  })

  it('should invoke deleteEmail and refresh email list when deleting an email', async () => {
    jest.mocked(EmailViewer).mockImplementationOnce(({ deleteEmail }) => {
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
      />,
    )

    await screen.findByText(/Delete invoked/i)
    await waitFor(() => {
      expect(deleteEmail).toHaveBeenCalledWith(user.username, emailId)
    })
    expect(getAllEmails).toHaveBeenCalledWith(user.username)
  })

  it('should show email content when clicking forward button', async () => {
    render(
      <Mailbox
        deleteEmail={deleteEmail}
        getAllEmails={getAllEmails}
        getEmailAttachment={getEmailAttachment}
        getEmailContents={getEmailContents}
        patchEmail={patchEmail}
      />,
    )

    const forwardButton = (await screen.findByLabelText(/Show selected email/i, {
      selector: 'button',
    })) as HTMLButtonElement

    await act(async () => {
      await userEvent.click(forwardButton)
    })

    await waitFor(() => {
      expect(screen.queryByText(/Email contents/i)).toBeVisible()
    })
  })

  it('should return to email list when clicking back button', async () => {
    render(
      <Mailbox
        deleteEmail={deleteEmail}
        getAllEmails={getAllEmails}
        getEmailAttachment={getEmailAttachment}
        getEmailContents={getEmailContents}
        patchEmail={patchEmail}
      />,
    )

    const forwardButton = (await screen.findByLabelText(/Show selected email/i, {
      selector: 'button',
    })) as HTMLButtonElement

    await act(async () => {
      await userEvent.click(forwardButton)
    })

    const backButton = (await screen.findByLabelText(/Back to email list/i, {
      selector: 'button',
    })) as HTMLButtonElement

    await act(async () => {
      await userEvent.click(backButton)
    })

    expect(await screen.findByText(/4\/13\/1975, \d+:21:13 PM/i)).toBeVisible()
  })
})
