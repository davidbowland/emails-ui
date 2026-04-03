import { Auth } from 'aws-amplify'
import React, { useEffect, useState } from 'react'

import { BouncedChip, EmailListDivider, MailboxCard, NavBackButton, NavForwardButton, ViewerCard } from './elements'
import EmailViewer from '@components/email-viewer'
import ErrorSnackbar from '@components/error-snackbar'
import LoadingSpinner from '@components/loading-spinner'
import { AmplifyUser, Email, EmailBatch, EmailContents, PatchOperation, SignedUrl } from '@types'

export interface MailboxProps {
  bounceEmail?: (accountId: string, emailId: string) => Promise<Email>
  deleteEmail: (accountId: string, emailId: string) => Promise<Email>
  getAllEmails: (accountId: string) => Promise<EmailBatch[]>
  getEmailAttachment: (accountId: string, emailId: string, attachmentId: string) => Promise<SignedUrl>
  getEmailContents: (accountId: string, emailId: string) => Promise<EmailContents>
  patchEmail: (accountId: string, emailId: string, patchOperations: PatchOperation[]) => Promise<Email>
}

const Mailbox = ({
  bounceEmail,
  deleteEmail,
  getAllEmails,
  getEmailAttachment,
  getEmailContents,
  patchEmail,
}: MailboxProps): React.ReactNode => {
  const [email, setEmail] = useState<EmailContents | undefined>()
  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  const [isEmailLoading, setIsEmailLoading] = useState(false)
  const [isViewingEmail, setIsViewingEmail] = useState(false)
  const [loggedInUser, setLoggedInUser] = useState<AmplifyUser | undefined>()
  const [receivedEmails, setReceivedEmails] = useState<EmailBatch[] | undefined>()
  const [selectedEmailId, setSelectedEmailId] = useState<string | undefined>()

  const bounceEmailCallback = async (accountId: string, emailId: string): Promise<void> => {
    if (bounceEmail) {
      await bounceEmail(accountId, emailId)
      await refreshEmails()
    }
  }

  const deleteEmailCallback = async (accountId: string, emailId: string): Promise<void> => {
    await deleteEmail(accountId, emailId)
    await refreshEmails()
  }

  const emailSelectClick = async (accountId: string, emailId: string): Promise<void> => {
    setSelectedEmailId(emailId)
    setIsEmailLoading(true)
    setIsViewingEmail(true)
    try {
      const emailContents = await getEmailContents(accountId, emailId)
      setEmail(emailContents)
    } catch (error: unknown) {
      console.error('emailSelectClick', { accountId, emailId, error })
      setErrorMessage('Error fetching email. Please try again.')
    }
    setIsEmailLoading(false)
  }

  const refreshEmails = async (): Promise<void> => {
    if (loggedInUser?.username) {
      try {
        const emails = await getAllEmails(loggedInUser.username)
        setReceivedEmails(emails.sort((a, b) => Math.sign(b.data.timestamp - a.data.timestamp)))
      } catch (error: unknown) {
        console.error('refreshEmails', { error, username: loggedInUser.username })
        setErrorMessage('Error fetching emails. Please reload the page to try again.')
      }
    }
  }

  const renderReceivedEmails = (receivedEmails: EmailBatch[]): React.ReactNode => {
    if (receivedEmails.length === 0) {
      return (
        <div className="flex h-full items-center justify-center">
          <h6 className="p-4 text-center text-xl font-medium">This mailbox is empty</h6>
        </div>
      )
    }
    return (
      <nav>
        {receivedEmails.map((email, index) => (
          <React.Fragment key={index}>
            <button
              className={`w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 ${selectedEmailId === email.id ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
              onClick={() => loggedInUser?.username && emailSelectClick(loggedInUser.username, email.id)}
            >
              <div className="flex items-center gap-2">
                <span className={email.data.viewed ? 'font-normal' : 'font-bold'}>{email.data.subject}</span>
                {email.data.bounced && <BouncedChip />}
              </div>
              <div className="mt-1 text-sm text-gray-500 break-words">{email.data.from}</div>
              <div className="text-sm text-gray-500">{new Date(email.data.timestamp).toLocaleString()}</div>
            </button>
            <EmailListDivider />
          </React.Fragment>
        ))}
      </nav>
    )
  }

  const renderViewer = (
    accountId: string,
    emailId?: string,
    email?: EmailContents,
    canBeBounced?: boolean,
  ): React.ReactNode => {
    if (email === undefined || emailId === undefined) {
      return (
        <div className="flex h-full items-center justify-center">
          <h6 className="p-4 text-center text-xl font-medium">Select an email to view</h6>
        </div>
      )
    }

    const selectedEmail = receivedEmails?.find((e) => e.id === emailId)
    return (
      <EmailViewer
        accountId={accountId}
        bounceEmail={canBeBounced ? bounceEmailCallback : undefined}
        bounced={selectedEmail?.data.bounced}
        deleteEmail={deleteEmailCallback}
        email={email}
        emailId={emailId}
        getAttachment={getEmailAttachment}
      />
    )
  }

  const snackbarErrorClose = (): void => {
    setErrorMessage(undefined)
  }

  useEffect(() => {
    const selectedEmail = receivedEmails?.find((email) => email.id === selectedEmailId)
    if (selectedEmail?.data.viewed === false && selectedEmailId && loggedInUser?.username) {
      patchEmail(loggedInUser?.username, selectedEmailId, [{ op: 'replace', path: '/viewed', value: true }]).then(
        refreshEmails,
      )
    }
  }, [selectedEmailId])

  useEffect(() => {
    refreshEmails()
  }, [loggedInUser])

  useEffect(() => {
    if (
      loggedInUser?.username &&
      receivedEmails !== undefined &&
      receivedEmails.length > 0 &&
      receivedEmails.find((email) => email.id === selectedEmailId) === undefined
    ) {
      emailSelectClick(loggedInUser?.username, receivedEmails[0].id)
    }
  }, [receivedEmails])

  useEffect(() => {
    Auth.currentAuthenticatedUser()
      .then(setLoggedInUser)
      .catch((error: unknown) => {
        console.error('currentAuthenticatedUser', { error })
        setErrorMessage('Error authenticating user. Please reload the page to try again.')
        window.location.reload()
      })
  }, [])

  return (
    <>
      <div className="grid w-full grid-cols-12 gap-2">
        <div className={`col-span-12 md:col-span-4 lg:col-span-3 ${isViewingEmail ? 'hidden md:block' : ''}`}>
          <div className="flex justify-end">
            <NavForwardButton onClick={() => setIsViewingEmail(true)} />
          </div>
          <MailboxCard>
            {receivedEmails === undefined ? <LoadingSpinner /> : renderReceivedEmails(receivedEmails)}
          </MailboxCard>
        </div>
        <div className={`col-span-12 md:col-span-8 lg:col-span-9 ${isViewingEmail ? '' : 'hidden md:block'}`}>
          <div>
            <NavBackButton onClick={() => setIsViewingEmail(false)} />
          </div>
          <ViewerCard>
            {isEmailLoading || loggedInUser?.username === undefined ? (
              <LoadingSpinner />
            ) : (
              renderViewer(
                loggedInUser?.username,
                selectedEmailId,
                email,
                receivedEmails?.find((e) => e.id === selectedEmailId)?.data.canBeBounced,
              )
            )}
          </ViewerCard>
        </div>
      </div>
      <ErrorSnackbar message={errorMessage} onClose={snackbarErrorClose} />
    </>
  )
}

export default Mailbox
