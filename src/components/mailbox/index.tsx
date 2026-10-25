import { getCurrentUser } from 'aws-amplify/auth'
import { Mail } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

import {
  BouncedChip,
  EmailListDivider,
  listSenderStyle,
  listSubjectStyle,
  listTimeStyle,
  NavBackButton,
  NavForwardButton,
} from './elements'
import EmailViewer from '@components/email-viewer'
import ErrorSnackbar from '@components/error-snackbar'
import LoadingSpinner from '@components/loading-spinner'
import SpamNotice, { SpamNoticeKind, SpamNoticeTrustState } from '@components/spam-notice'
import SpamSuggestions from '@components/spam-suggestions'
import { getAccount, putAccount } from '@services/emails'
import { SPAM_FILTER_LIST_LIMIT, wouldExceedLimits } from '@services/spam-impact'
import {
  AuthUser,
  DEFAULT_SPAM_FILTER,
  Email,
  EmailBatch,
  EmailContents,
  EmailFolder,
  HttpError,
  PatchOperation,
  SignedUrl,
} from '@types'

export interface MailboxProps {
  bounceEmail?: (accountId: string, emailId: string) => Promise<Email>
  deleteEmail: (accountId: string, emailId: string) => Promise<Email>
  // Inbox and Spam only; Sent has no folder and no move actions.
  folder?: EmailFolder
  getAllEmails: (accountId: string) => Promise<EmailBatch[]>
  getEmailAttachment: (accountId: string, emailId: string, attachmentId: string) => Promise<SignedUrl>
  getEmailContents: (accountId: string, emailId: string) => Promise<EmailContents>
  moveEmail?: (accountId: string, emailId: string, folder: EmailFolder) => Promise<Email>
  patchEmail: (accountId: string, emailId: string, patchOperations: PatchOperation[]) => Promise<Email>
}

interface NoticeState {
  // The moved email, for suggestions.
  emailId: string
  // At the top of the viewer (md and up), or of the list (below md, where the view returns to it).
  inViewer: boolean
  kind: SpamNoticeKind
  moveId: string
  otherFromSender: number
  sender?: string
  trustedValue?: string
  trustState: SpamNoticeTrustState
  updatedCount?: number
}

const TRUST_FAILURE = "We couldn't add that trusted sender. Nothing changed — try again."

// Tailwind's md breakpoint, where the list and viewer sit side by side. Without matchMedia (jsdom,
// very old browsers) the wide layout is assumed.
const isWideViewport = (): boolean => window.matchMedia?.('(min-width: 768px)')?.matches ?? true

// The bare address from a stored From line ("Name" <user@domain.com> or user@domain.com),
// lowercased, or undefined when there is none (the inbound service stores "unknown" then).
const addressOf = (from: string): string | undefined => {
  const open = from.lastIndexOf('<')
  const close = from.lastIndexOf('>')
  const address = (open >= 0 && close > open ? from.slice(open + 1, close) : from).trim().toLowerCase()
  const at = address.lastIndexOf('@')
  return at > 0 && at < address.length - 1 && !/\s/.test(address) ? address : undefined
}

const sortByNewest = (emails: EmailBatch[]): EmailBatch[] =>
  [...emails].sort((a, b) => Math.sign(b.data.timestamp - a.data.timestamp))

const Mailbox = ({
  bounceEmail,
  deleteEmail,
  folder,
  getAllEmails,
  getEmailAttachment,
  getEmailContents,
  moveEmail,
  patchEmail,
}: MailboxProps): React.ReactNode => {
  const [email, setEmail] = useState<EmailContents | undefined>()
  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  const [isEmailLoading, setIsEmailLoading] = useState(false)
  const [isViewingEmail, setIsViewingEmail] = useState(false)
  const [loggedInUser, setLoggedInUser] = useState<AuthUser | undefined>()
  const [notice, setNotice] = useState<NoticeState | undefined>()
  const [receivedEmails, setReceivedEmails] = useState<EmailBatch[] | undefined>()
  const [selectedEmailId, setSelectedEmailId] = useState<string | undefined>()
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<HTMLDivElement>(null)
  // Every list load takes the next number; a refresh older than the list already shown is dropped,
  // so one that started before a move can't bring the moved email back.
  const loadCountRef = useRef(0)
  const shownLoadRef = useRef(0)

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

  // `show` is false when a move below md selects the next email but stays on the list (AC-034).
  const emailSelectClick = async (accountId: string, emailId: string, show = true): Promise<void> => {
    setSelectedEmailId(emailId)
    setIsEmailLoading(true)
    if (show) {
      setIsViewingEmail(true)
    }
    try {
      const emailContents = await getEmailContents(accountId, emailId)
      setEmail(emailContents)
    } catch (error: unknown) {
      console.error('emailSelectClick', { accountId, emailId, error })
      setErrorMessage("Couldn't load this email. Please try again.")
    }
    setIsEmailLoading(false)
  }

  // Undefined (with the error shown) when the list can't be loaded.
  const fetchEmails = async (accountId: string): Promise<EmailBatch[] | undefined> => {
    try {
      return sortByNewest(await getAllEmails(accountId))
    } catch (error: unknown) {
      console.error('refreshEmails', { error, username: accountId })
      setErrorMessage("Couldn't load your emails. Reload the page to try again.")
      return undefined
    }
  }

  const startLoad = (): number => {
    loadCountRef.current += 1
    return loadCountRef.current
  }

  const refreshEmails = async (): Promise<void> => {
    if (loggedInUser?.username) {
      const load = startLoad()
      const emails = await fetchEmails(loggedInUser.username)
      if (emails && load > shownLoadRef.current) {
        shownLoadRef.current = load
        setReceivedEmails(emails)
      }
    }
  }

  // Throws when the move fails, so the viewer can report it; nothing here changes in that case.
  const moveEmailCallback =
    (moveEmail: NonNullable<MailboxProps['moveEmail']>, target: EmailFolder) =>
    async (accountId: string, emailId: string): Promise<void> => {
      const before = receivedEmails ?? []
      const index = before.findIndex((e) => e.id === emailId)
      const moved = before[index]
      await moveEmail(accountId, emailId, target)

      // Filtered either way: a failed reload must still drop the moved email, and a reload that
      // races the move must not show it again. Shown even when a newer refresh landed first, since
      // this load started after the move; any refresh still in flight from before it is dropped.
      const load = startLoad()
      const remaining = ((await fetchEmails(accountId)) ?? before).filter((e) => e.id !== emailId)
      shownLoadRef.current = Math.max(shownLoadRef.current, load)
      const wide = isWideViewport()
      const next = remaining[Math.min(Math.max(index, 0), remaining.length - 1)]
      const sender = target === 'inbox' && moved ? addressOf(moved.data.from) : undefined

      setReceivedEmails(remaining)
      setSuggestionsOpen(false)
      setNotice((current) => ({
        emailId,
        inViewer: wide,
        kind: target === 'inbox' ? 'not-spam' : 'moved-to-spam',
        // A fresh id per move, so a repeat move of the same kind still takes focus.
        moveId: String(Number(current?.moveId ?? 0) + 1),
        otherFromSender: sender ? remaining.filter((e) => addressOf(e.data.from) === sender).length : 0,
        sender,
        trustState: 'offer',
      }))
      if (!wide) {
        setIsViewingEmail(false)
      }
      if (next) {
        emailSelectClick(accountId, next.id, wide)
      } else {
        setSelectedEmailId(undefined)
        setEmail(undefined)
      }
    }

  const updateNotice = (changes: Partial<NoticeState>): void =>
    setNotice((current) => current && { ...current, ...changes })

  const trustFailed = (accountId: string, error: unknown): void => {
    console.error('trustSender', { accountId, error })
    updateNotice({ trustState: 'offer' })
    setErrorMessage(TRUST_FAILURE)
  }

  // Re-reads the account right before the PUT, and checks the list limit first (AC-032).
  const trustSender = async (value: string): Promise<void> => {
    const accountId = loggedInUser?.username
    if (!accountId) {
      return
    }
    updateNotice({ trustState: 'saving' })
    try {
      const account = await getAccount(accountId)
      const spamFilter = account.spamFilter ?? DEFAULT_SPAM_FILTER
      if (spamFilter.trustedSenders.some((sender) => sender.toLowerCase() === value.toLowerCase())) {
        updateNotice({ trustedValue: value, trustState: 'accepted' })
        return
      }
      const next = { ...spamFilter, trustedSenders: [...spamFilter.trustedSenders, value] }
      if (wouldExceedLimits(spamFilter, next) === 'trustedSenders') {
        updateNotice({ trustState: 'full' })
        return
      }
      try {
        await putAccount(accountId, { ...account, spamFilter: next })
        updateNotice({ trustedValue: value, trustState: 'accepted' })
      } catch (error: unknown) {
        // A 400 means the list is full only when this save filled it; any other 400 is a plain failure.
        if ((error as HttpError | undefined)?.status === 400 && next.trustedSenders.length >= SPAM_FILTER_LIST_LIMIT) {
          console.error('trustSender', { accountId, error })
          updateNotice({ trustState: 'full' })
          return
        }
        trustFailed(accountId, error)
      }
    } catch (error: unknown) {
      trustFailed(accountId, error)
    }
  }

  // Focus goes back to the first viewer action, or to the list when there is none (or the
  // viewer is hidden below md).
  const dismissNotice = (): void => {
    const action = notice?.inViewer
      ? viewerRef.current?.querySelector<HTMLElement>('[data-email-actions] button')
      : undefined
    setNotice(undefined)
    ;(action ?? listRef.current?.querySelector<HTMLElement>('nav') ?? listRef.current)?.focus()
  }

  const suggestionsApplied = (count: number): void => {
    setSuggestionsOpen(false)
    updateNotice({ updatedCount: count })
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
            }}
          >
            <Mail aria-hidden="true" size={20} strokeWidth={1.5} />
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
            {folder === 'spam' ? 'No spam right now' : 'This mailbox is empty'}
          </p>
        </div>
      )
    }

    return (
      <nav
        aria-label={folder === undefined ? undefined : folder === 'spam' ? 'Spam emails' : 'Inbox emails'}
        style={{ flex: 1, overflowY: 'auto', padding: '8px 8px', outline: 'none' }}
        tabIndex={-1}
      >
        {receivedEmails.map((email, index) => {
          const isSelected = selectedEmailId === email.id
          const isUnread = !email.data.viewed
          const rowState = { isSelected, isUnread }
          return (
            <React.Fragment key={email.id}>
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
                    <span style={listSubjectStyle(rowState)}>{email.data.subject}</span>
                  </div>
                  <span style={listTimeStyle(rowState)}>{formatDate(email.data.timestamp)}</span>
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
                  <span style={listSenderStyle(rowState)}>{email.data.from}</span>
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
              color: 'var(--paper-border)',
            }}
          >
            <Mail aria-hidden="true" size={28} strokeWidth={1.5} />
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
        onMoveToSpam={folder === 'inbox' && moveEmail ? moveEmailCallback(moveEmail, 'spam') : undefined}
        onNotSpam={folder === 'spam' && moveEmail ? moveEmailCallback(moveEmail, 'inbox') : undefined}
      />
    )
  }

  const renderNotice = (): React.ReactNode =>
    notice && (
      <SpamNotice
        kind={notice.kind}
        moveId={notice.moveId}
        onDecline={() => updateNotice({ trustState: 'declined' })}
        onDismiss={dismissNotice}
        onSuggest={() => setSuggestionsOpen(true)}
        onTrust={trustSender}
        otherFromSender={notice.otherFromSender}
        sender={notice.sender}
        trustState={notice.trustState}
        trustedValue={notice.trustedValue}
        updatedCount={notice.updatedCount}
      />
    )

  const snackbarErrorClose = (): void => {
    setErrorMessage(undefined)
  }

  // Marks the selected email read only once it is on screen: below md a move selects the next email
  // but stays on the list (AC-034), so it is marked when the user opens it.
  useEffect(() => {
    const selectedEmail = receivedEmails?.find((email) => email.id === selectedEmailId)
    const isShown = isViewingEmail || isWideViewport()
    if (isShown && selectedEmail?.data.viewed === false && selectedEmailId && loggedInUser?.username) {
      patchEmail(loggedInUser?.username, selectedEmailId, [{ op: 'replace', path: '/viewed', value: true }]).then(
        refreshEmails,
      )
    }
  }, [selectedEmailId, isViewingEmail])

  useEffect(() => {
    refreshEmails()
  }, [loggedInUser])

  // Keyed on [loggedInUser], not [], and that is load-bearing: refreshEmails is re-created every
  // render and closes over loggedInUser, which is undefined on the first render. A listener
  // registered with [] deps would capture that first closure and its username guard would fail
  // forever, silently.
  // In the Spam folder too, on purpose: newly arrived mail may land in Spam.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }
    const handleWorkerMessage = (event: MessageEvent): void => {
      if (event.data?.type === 'refresh-inbox') {
        refreshEmails()
      }
    }
    navigator.serviceWorker.addEventListener('message', handleWorkerMessage)
    return () => navigator.serviceWorker.removeEventListener('message', handleWorkerMessage)
  }, [loggedInUser])

  useEffect(() => {
    if (
      loggedInUser?.username &&
      receivedEmails !== undefined &&
      receivedEmails.length > 0 &&
      receivedEmails.find((email) => email.id === selectedEmailId) === undefined
    ) {
      // Below md the first email is loaded for later but the list stays on screen.
      emailSelectClick(loggedInUser?.username, receivedEmails[0].id, isWideViewport())
    }
  }, [receivedEmails])

  useEffect(() => {
    getCurrentUser()
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

          {/* Post-move notice below md: the view has returned to the list (AC-034) */}
          {notice && !notice.inViewer && <div style={{ flexShrink: 0, padding: '12px 12px 0' }}>{renderNotice()}</div>}

          {/* List body */}
          <div
            ref={listRef}
            style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' as const, outline: 'none' }}
            tabIndex={-1}
          >
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

          {/* Post-move notice, md and up */}
          {notice?.inViewer && <div style={{ flexShrink: 0, padding: '16px 32px 0' }}>{renderNotice()}</div>}

          {/* Viewer content */}
          <div ref={viewerRef} style={{ flex: 1, overflowY: 'auto' }}>
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
      {folder === 'inbox' && moveEmail && loggedInUser?.username && (
        // Stays mounted and is opened by toggling, so the dialog can return focus to its trigger.
        <SpamSuggestions
          accountId={loggedInUser.username}
          emailId={notice?.emailId ?? ''}
          inboxEmails={receivedEmails ?? []}
          onApplied={suggestionsApplied}
          onClose={() => setSuggestionsOpen(false)}
          open={suggestionsOpen}
        />
      )}
      <ErrorSnackbar message={errorMessage} onClose={snackbarErrorClose} />
    </>
  )
}

export default Mailbox
