import { Auth } from 'aws-amplify'
import { useRouter } from 'next/router'
import React, { useEffect, useRef, useState } from 'react'

import { ComposeCard, ComposeDivider, DiscardButton, SendButton } from './elements'
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
      <ComposeCard>
        <AddressLine addresses={toAddresses} label="To:" setAddresses={setToAddresses} />
        <AddressLine addresses={ccAddresses} label="CC:" setAddresses={setCcAddresses} />
        <AddressLine addresses={bccAddresses} label="BCC:" setAddresses={setBccAddresses} />
        {recipientMessage && <p className="px-4 text-xs text-red-500">{recipientMessage}</p>}
        <div className="px-4 pt-2">
          <label>
            <input
              aria-label="Subject"
              className="w-full rounded border px-3 py-2 dark:bg-[#121212]"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSubject(event.target.value)}
              placeholder="Subject"
              value={subject}
            />
          </label>
        </div>
        <ComposeDivider />
        <div className="p-4">
          <HtmlEditor initialBody={initialBody} inputRef={editor} />
        </div>
        <ComposeDivider />
        {loggedInUser?.username && (
          <AttachmentUploader
            accountId={loggedInUser?.username}
            attachments={attachments}
            setAttachments={setAttachments}
          />
        )}
        {attachmentMessage && <p className="px-4 text-xs text-red-500">{attachmentMessage}</p>}
        <div className="flex flex-col gap-2 p-4 sm:flex-row sm:justify-end">
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
      </ComposeCard>
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
