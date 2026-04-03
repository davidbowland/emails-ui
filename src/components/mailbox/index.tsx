import { Auth } from 'aws-amplify'
import React, { useEffect, useState } from 'react'

import { BouncedChip, EmailListDivider, NavBackButton, NavForwardButton } from './elements'
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

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    return date.toLocaleString()
  }

  const renderReceivedEmails = (receivedEmails: EmailBatch[]): React.ReactNode => {
    if (receivedEmails.length === 0) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-8">
          <div style={{ color: 'var(--text-muted)', fontSize: '2rem' }}>✉</div>
          <p className="text-center text-sm" style={{ color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif' }}>
            This mailbox is empty
          </p>
        </div>
      )
    }
    return (
      <nav className="flex-1 overflow-y-auto">
        {receivedEmails.map((email, index) => {
          const isSelected = selectedEmailId === email.id
          const isUnread = !email.data.viewed
          return (
            <React.Fragment key={index}>
              <button
                className="email-row animate-fade-in w-full px-4 py-3 text-left transition-colors"
                onClick={() => loggedInUser?.username && emailSelectClick(loggedInUser.username, email.id)}
                style={{
                  background: isSelected ? 'var(--accent-subtle)' : 'transparent',
                  borderLeft: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
                  paddingLeft: isSelected ? '14px' : '16px',
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    {isUnread && (
                      <div
                        className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                        style={{ background: 'var(--accent)' }}
                      />
                    )}
                    <span
                      className="truncate text-sm"
                      style={{
                        color: isSelected ? 'var(--accent)' : isUnread ? 'var(--text-primary)' : 'var(--text-muted)',
                        fontWeight: isUnread ? 600 : 400,
                        fontFamily: 'Outfit, sans-serif',
                      }}
                    >
                      {email.data.subject}
                    </span>
                  </div>
                  <span
                    className="flex-shrink-0 text-xs"
                    style={{
                      color: 'var(--text-muted)',
                      fontFamily: 'IBM Plex Mono, monospace',
                      fontSize: '11px',
                    }}
                  >
                    {formatDate(email.data.timestamp)}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-2" style={{ paddingLeft: isUnread ? '0' : '0' }}>
                  <span
                    className="truncate text-xs"
                    style={{ color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif' }}
                  >
                    {email.data.from}
                  </span>
                  {email.data.bounced && <BouncedChip />}
                </div>
              </button>
              <EmailListDivider />
            </React.Fragment>
          )
        })}
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
        <div className="flex h-full flex-col items-center justify-center gap-3 p-8">
          <div style={{ color: 'var(--paper-border)', fontSize: '3rem' }}>✉</div>
          <p
            className="text-center text-sm"
            style={{ color: 'var(--text-paper-muted)', fontFamily: 'Outfit, sans-serif' }}
          >
            Select an email to view
          </p>
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
      <div className="flex h-full w-full overflow-hidden">
        {/* Email list panel */}
        <div
          className={`h-full ${isViewingEmail ? 'hidden md:flex md:flex-col' : 'flex flex-col'}`}
          style={{
            width: 'var(--list-width)',
            flexShrink: 0,
            borderRight: '1px solid var(--shell-border)',
            background: 'var(--shell-surface)',
          }}
        >
          {/* List header */}
          <div
            className="flex flex-shrink-0 items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid var(--shell-border)' }}
          >
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif', letterSpacing: '0.1em' }}
            >
              {receivedEmails === undefined ? 'Loading…' : `${receivedEmails.length} messages`}
            </span>
            <NavForwardButton onClick={() => setIsViewingEmail(true)} />
          </div>
          {/* List body */}
          {receivedEmails === undefined ? <LoadingSpinner /> : renderReceivedEmails(receivedEmails)}
        </div>

        {/* Viewer/compose panel */}
        <div
          className={`h-full flex-1 overflow-hidden ${isViewingEmail ? 'flex flex-col' : 'hidden md:flex md:flex-col'}`}
          style={{ background: 'var(--paper-bg)', color: 'var(--text-paper)' }}
        >
          {/* Mobile back button */}
          <div
            className="flex flex-shrink-0 items-center px-4 py-2 md:hidden"
            style={{ borderBottom: '1px solid var(--paper-border)' }}
          >
            <NavBackButton onClick={() => setIsViewingEmail(false)} />
          </div>

          {/* Viewer content */}
          <div className="flex-1 overflow-y-auto">
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
          </div>
        </div>
      </div>
      <ErrorSnackbar message={errorMessage} onClose={snackbarErrorClose} />
    </>
  )
}

export default Mailbox
