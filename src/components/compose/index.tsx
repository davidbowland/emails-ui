import { Auth } from 'aws-amplify'
import { useRouter } from 'next/router'
import React, { useEffect, useRef, useState } from 'react'

import { ComposeDivider, DiscardButton, SendButton } from './elements'
import AddressLine from '@components/address-line'
import AttachmentUploader from '@components/attachment-uploader'
import ConfirmDialog from '@components/confirm-dialog'
import ErrorSnackbar from '@components/error-snackbar'
import HtmlEditor from '@components/html-editor'
import { postSentEmail } from '@services/emails'
import { AmplifyUser, EmailAddress, EmailAttachment, EmailOutbound } from '@types'

const DOMAIN = process.env.NEXT_PUBLIC_DOMAIN
const MAX_UPLOAD_SIZE = parseInt(process.env.NEXT_PUBLIC_MAX_UPLOAD_SIZE, 10)

export interface ComposeProps {
  discardCallback?: () => void
  inReplyTo?: string
  initialAttachments?: EmailAttachment[]
  initialBody?: string
  initialCcAddresses?: EmailAddress[]
  initialSubject?: string
  initialToAddresses?: EmailAddress[]
  references?: string[]
}

const Compose = ({
  discardCallback,
  inReplyTo,
  initialAttachments,
  initialBody,
  initialCcAddresses,
  initialSubject,
  initialToAddresses,
  references,
}: ComposeProps): React.ReactNode => {
  const [attachmentMessage, setAttachmentMessage] = useState<string | undefined>()
  const [attachments, setAttachments] = useState<EmailAttachment[]>(initialAttachments ?? [])
  const [bccAddresses, setBccAddresses] = useState<EmailAddress[]>([])
  const [ccAddresses, setCcAddresses] = useState<EmailAddress[]>(initialCcAddresses ?? [])
  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loggedInUser, setLoggedInUser] = useState<AmplifyUser | undefined>()
  const [recipientMessage, setRecipientMessage] = useState<string | undefined>()
  const [subject, setSubject] = useState(initialSubject ?? '')
  const [toAddresses, setToAddresses] = useState<EmailAddress[]>(initialToAddresses ?? [])

  const editor = useRef<HTMLDivElement>(null)

  const router = useRouter()

  const discardDialogClose = (): void => {
    setIsDiscardDialogOpen(false)
  }

  const getTextContent = (editor: HTMLDivElement): string => {
    const selection = window.getSelection()
    if (!selection) {
      return editor.textContent || ''
    }
    selection.selectAllChildren(editor)
    const textContent = selection.toString()
    selection.removeAllRanges()
    return textContent
  }

  const handleSendClick = async (accountId: string, editor: HTMLDivElement): Promise<void> => {
    setAttachmentMessage('')
    setRecipientMessage('')
    if (bccAddresses.length + ccAddresses.length + toAddresses.length === 0) {
      setRecipientMessage('Please enter recipients.')
      window.scrollTo(0, 0)
      return
    }

    const totalAttachmentSize = attachments.reduce((value, attachment) => attachment.size + value, 0)
    if (totalAttachmentSize >= MAX_UPLOAD_SIZE) {
      setAttachmentMessage(`Attachments cannot exceed ${MAX_UPLOAD_SIZE.toLocaleString()} bytes.`)
      return
    }

    setIsSubmitting(true)
    try {
      const fromAddress = { address: `${accountId}@${DOMAIN}`, name: '' }
      const outboundEmail: EmailOutbound = {
        attachments:
          attachments.length === 0
            ? undefined
            : attachments.map((attachment) => ({
              cid: attachment.id,
              content: attachment.key,
              contentDisposition: 'attachment',
              contentType: attachment.type,
              filename: attachment.filename,
              headerLines: {},
              headers: {},
              size: attachment.size,
              type: 'attachment',
            })),
        bcc: bccAddresses,
        cc: ccAddresses,
        from: fromAddress,
        html: editor.innerHTML,
        inReplyTo,
        references,
        replyTo: fromAddress,
        sender: fromAddress,
        subject: subject || 'no subject',
        text: getTextContent(editor),
        to: toAddresses,
      }
      await postSentEmail(accountId, outboundEmail)
      resetForm(editor)
      router.push('/outbox')
    } catch (error) {
      console.error('handleSendClick', {
        accountId,
        attachments,
        bccAddresses,
        ccAddresses,
        DOMAIN,
        error,
        toAddresses,
        totalAttachmentSize,
      })
      setErrorMessage('Error sending email. Please try again in a few moments.')
    }
    setIsSubmitting(false)
  }

  const resetForm = (editor: HTMLDivElement): void => {
    setBccAddresses([])
    setCcAddresses([])
    setSubject('')
    setToAddresses([])
    editor.innerHTML = ''
  }

  const snackbarErrorClose = (): void => {
    setErrorMessage(undefined)
  }

  useEffect(() => {
    Auth.currentAuthenticatedUser()
      .then(setLoggedInUser)
      .catch((error: any) => {
        console.error('currentAuthenticatedUser', { error })
        setErrorMessage('Error authenticating user. Please reload the page to try again.')
        window.location.reload()
      })
  }, [])

  return (
    <>
      <div
        className="flex h-full w-full flex-col items-center"
        style={{ background: 'var(--paper-bg)', color: 'var(--text-paper)' }}
      >
        <div
          className="flex h-full w-full max-w-3xl flex-col"
          style={{ borderLeft: '1px solid var(--paper-border)', borderRight: '1px solid var(--paper-border)' }}
        >
          {/* Header */}
          <div
            className="flex flex-shrink-0 items-center justify-between px-8 py-4"
            style={{ borderBottom: '1px solid var(--paper-border)' }}
          >
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: 'var(--text-paper-muted)', fontFamily: 'Outfit, sans-serif', letterSpacing: '0.1em' }}
            >
              New Message
            </span>
          </div>

          {/* Address fields */}
          <div className="flex-shrink-0" style={{ borderBottom: '1px solid var(--paper-border)' }}>
            <AddressLine addresses={toAddresses} label="To:" setAddresses={setToAddresses} />
            <div style={{ height: '1px', background: 'var(--paper-border)' }} />
            <AddressLine addresses={ccAddresses} label="CC:" setAddresses={setCcAddresses} />
            <div style={{ height: '1px', background: 'var(--paper-border)' }} />
            <AddressLine addresses={bccAddresses} label="BCC:" setAddresses={setBccAddresses} />
          </div>
          {recipientMessage && (
            <p className="px-8 pt-2 text-xs" style={{ color: 'var(--accent)', fontFamily: 'Outfit, sans-serif' }}>
              {recipientMessage}
            </p>
          )}

          {/* Subject */}
          <div className="flex-shrink-0" style={{ borderBottom: '1px solid var(--paper-border)' }}>
            <input
              aria-label="Subject"
              className="w-full bg-transparent px-8 py-3 font-display outline-none"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSubject(event.target.value)}
              placeholder="Subject"
              style={{
                fontSize: '18px',
                fontWeight: 400,
                color: 'var(--text-paper)',
                fontFamily: 'Libre Baskerville, Georgia, serif',
              }}
              value={subject}
            />
          </div>

          <ComposeDivider />

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-8 py-4">
            <HtmlEditor initialBody={initialBody} inputRef={editor} />
          </div>

          <ComposeDivider />

          {/* Footer: attachments + actions */}
          <div className="flex-shrink-0" style={{ borderTop: '1px solid var(--paper-border)' }}>
            {loggedInUser?.username && (
              <AttachmentUploader
                accountId={loggedInUser?.username}
                attachments={attachments}
                setAttachments={setAttachments}
              />
            )}
            {attachmentMessage && (
              <p className="px-8 pb-2 text-xs" style={{ color: 'var(--accent)', fontFamily: 'Outfit, sans-serif' }}>
                {attachmentMessage}
              </p>
            )}
            <div className="flex items-center justify-end gap-3 px-8 py-4">
              <DiscardButton disabled={isSubmitting} onClick={() => setIsDiscardDialogOpen(true)} />
              {loggedInUser?.username && editor.current && (
                <SendButton
                  disabled={isSubmitting}
                  isSubmitting={isSubmitting}
                  onClick={() =>
                    loggedInUser?.username && editor.current && handleSendClick(loggedInUser.username, editor.current)
                  }
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        cancelLabel="Keep editing"
        confirmLabel="Discard"
        onCancel={discardDialogClose}
        onConfirm={() => {
          editor.current && resetForm(editor.current)
          discardDialogClose()
          discardCallback && discardCallback()
        }}
        open={isDiscardDialogOpen}
        title="Discard message?"
      >
        Are you sure you want to discard this message?
      </ConfirmDialog>
      <ErrorSnackbar message={errorMessage} onClose={snackbarErrorClose} />
    </>
  )
}

export default Compose
