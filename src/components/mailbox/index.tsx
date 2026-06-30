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
      setErrorMessage("Couldn't load this email. Please try again.")
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
        setErrorMessage("Couldn't load your emails. Reload the page to try again.")
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
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: '12px',
            padding: '32px',
          }}
        >
          {/* Empty state icon */}
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'var(--shell-surface)',
              border: '1px solid var(--shell-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              fontSize: '20px',
            }}
          >
            ✉
          </div>
          <p
            style={{
              color: 'var(--text-muted)',
              fontFamily: 'Outfit, sans-serif',
              fontSize: '13px',
              textAlign: 'center',
              letterSpacing: '0.01em',
            }}
          >
            This mailbox is empty
          </p>
        </div>
      )
    }

    return (
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
        {receivedEmails.map((email, index) => {
          const isSelected = selectedEmailId === email.id
          const isUnread = !email.data.viewed
          return (
            <React.Fragment key={index}>
              <button
                aria-label={`${isUnread ? 'Unread: ' : ''}${email.data.subject || '(No subject)'}`}
                className="email-row"
                onClick={() => loggedInUser?.username && emailSelectClick(loggedInUser.username, email.id)}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    ;(e.currentTarget as HTMLElement).style.background = 'var(--shell-surface-hover)'
                    ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--shell-border)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                    ;(e.currentTarget as HTMLElement).style.borderColor = 'transparent'
                  }
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(124,93,244,0.14) 0%, rgba(124,93,244,0.06) 100%)'
                    : 'transparent',
                  border: isSelected ? '1px solid var(--accent-border)' : '1px solid transparent',
                  boxShadow: isSelected ? 'var(--glow-accent-sm)' : 'none',
                  transition: 'all 0.2s cubic-bezier(0.32,0.72,0,1)',
                  display: 'block',
                }}
              >
                {/* Top row: subject + time */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '8px',
                    marginBottom: '4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                    {/* Unread dot */}
                    {isUnread && (
                      <div
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: 'var(--accent)',
                          flexShrink: 0,
                          boxShadow: '0 0 6px var(--accent)',
                          marginTop: '1px',
                        }}
                      />
                    )}
                    <span
                      style={{
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '13px',
                        fontWeight: isUnread ? 600 : 400,
                        color: isSelected ? 'var(--accent)' : isUnread ? 'var(--text-primary)' : 'var(--text-muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        letterSpacing: '0.005em',
                      }}
                    >
                      {email.data.subject}
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: 'IBM Plex Mono, monospace',
                      fontSize: '10px',
                      color: isSelected ? 'var(--accent)' : 'var(--text-muted)',
                      flexShrink: 0,
                      opacity: 0.8,
                    }}
                  >
                    {formatDate(email.data.timestamp)}
                  </span>
                </div>

                {/* Bottom row: from + bounced chip */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    paddingLeft: isUnread ? '12px' : '0',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'Outfit, sans-serif',
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                      opacity: 0.75,
                    }}
                  >
                    {email.data.from}
                  </span>
                  {email.data.bounced && <BouncedChip />}
                </div>
              </button>

              {index < receivedEmails.length - 1 && <EmailListDivider />}
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
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: '14px',
            padding: '32px',
          }}
        >
          {/* Empty viewer illustration */}
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, rgba(229,221,208,0.8) 0%, rgba(229,221,208,0.3) 100%)',
              border: '1px solid var(--paper-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              color: 'var(--paper-border)',
            }}
          >
            ✉
          </div>
          <p
            style={{
              color: 'var(--text-paper-muted)',
              fontFamily: 'Outfit, sans-serif',
              fontSize: '13px',
              textAlign: 'center',
              letterSpacing: '0.01em',
            }}
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
        setErrorMessage("We couldn't sign you in. Reload the page to try again.")
        window.location.reload()
      })
  }, [])

  return (
    <>
      <div style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden' }}>
        {/* Email list panel */}
        <div
          className={isViewingEmail ? 'hidden md:flex md:flex-col' : 'flex flex-col w-full md:w-auto'}
          style={{
            width: 'var(--list-width)',
            flexShrink: 0,
            height: '100%',
            borderRight: '1px solid var(--shell-border)',
            background: 'var(--shell-bg)',
            display: isViewingEmail ? undefined : 'flex',
            flexDirection: 'column' as const,
          }}
        >
          {/* List header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              flexShrink: 0,
              borderBottom: '1px solid var(--shell-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Count badge */}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: 'var(--shell-surface)',
                  border: '1px solid var(--shell-border)',
                  fontFamily: 'IBM Plex Mono, monospace',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.04em',
                }}
              >
                {receivedEmails === undefined ? '…' : `${receivedEmails.length}`}
              </span>
              <span
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.1em',
                  color: 'var(--text-muted)',
                }}
              >
                {receivedEmails === undefined ? 'Loading' : 'messages'}
              </span>
            </div>
            <NavForwardButton onClick={() => setIsViewingEmail(true)} />
          </div>

          {/* List body */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' as const }}>
            {receivedEmails === undefined ? <LoadingSpinner /> : renderReceivedEmails(receivedEmails)}
          </div>
        </div>

        {/* Viewer panel */}
        <div
          className={isViewingEmail ? 'flex flex-col' : 'hidden md:flex md:flex-col'}
          style={{
            flex: 1,
            height: '100%',
            overflow: 'hidden',
            background: 'var(--paper-bg)',
            color: 'var(--text-paper)',
          }}
        >
          {/* Mobile back */}
          <div
            className="flex flex-shrink-0 items-center px-3 py-2 md:hidden"
            style={{ borderBottom: '1px solid var(--paper-border)' }}
          >
            <NavBackButton onClick={() => setIsViewingEmail(false)} />
          </div>

          {/* Viewer content */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
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
