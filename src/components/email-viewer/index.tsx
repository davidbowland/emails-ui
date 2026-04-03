import DOMPurify from 'dompurify'
import React, { useState } from 'react'
import ReactDOMServer from 'react-dom/server'

import {
  BounceButton,
  DeleteButton,
  EmailDivider,
  ForwardButton,
  LoadingOverlay,
  ReplyAllButton,
  ReplyButton,
  ShowImagesButton,
  SubjectLine,
} from './elements'
import AddressLine from '@components/address-line'
import AttachmentViewer from '@components/attachment-viewer'
import Compose from '@components/compose'
import ConfirmDialog from '@components/confirm-dialog'
import ErrorSnackbar from '@components/error-snackbar'
import { EmailAddress, EmailContents, SignedUrl } from '@types'

const DOMAIN = process.env.NEXT_PUBLIC_DOMAIN
const HTTP_LEAK_ATTRIBUTES = ['action', 'background', 'poster', 'src']

type bounceEmailFn = (accountId: string, emailId: string) => Promise<any>
type deleteEmailFn = (accountId: string, emailId: string) => Promise<any>
type getAttachmentFn = (accountId: string, emailId: string, attachmentId: string) => Promise<SignedUrl>

enum ComposeMode {
  NONE = 0,
  REPLY,
  REPLY_ALL,
  FORWARD,
}

export interface EmailViewerProps {
  accountId: string
  bounced?: boolean
  bounceEmail?: bounceEmailFn
  deleteEmail?: deleteEmailFn
  email: EmailContents
  emailId: string
  getAttachment: getAttachmentFn
}

const EmailViewer = ({
  accountId,
  bounced,
  bounceEmail,
  deleteEmail,
  email,
  emailId,
  getAttachment,
}: EmailViewerProps): React.ReactNode => {
  const [backdropShown, setBackdropShown] = useState(false)
  const [composeMode, setComposeMode] = useState<ComposeMode>(ComposeMode.NONE)
  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  const [showBounceDialog, setShowBounceDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showImages, setShowImages] = useState(false)

  const bounceDialogClose = (): void => {
    setShowBounceDialog(false)
  }

  const bounceEmailClick = async (bounceEmail: bounceEmailFn): Promise<void> => {
    setBackdropShown(true)
    bounceDialogClose()
    try {
      await bounceEmail(accountId, emailId)
    } catch (error: any) {
      console.error('bounceEmailClick', { accountId, emailId, error })
      setErrorMessage('Error bouncing email. Please refresh and try again.')
    }
    setBackdropShown(false)
  }

  const deleteDialogClose = (): void => {
    setShowDeleteDialog(false)
  }

  const deleteEmailClick = async (deleteEmail: deleteEmailFn): Promise<void> => {
    setBackdropShown(true)
    deleteDialogClose()
    try {
      await deleteEmail(accountId, emailId)
    } catch (error: any) {
      console.error('deleteEmailClick', { accountId, emailId, error })
      setErrorMessage('Error deleting email. Please refresh and try again.')
    }
    setBackdropShown(false)
  }

  const discardCallback = (): void => {
    setComposeMode(ComposeMode.NONE)
  }

  const filterUsersEmail = (address: EmailAddress) => address.address.toLowerCase() !== `${accountId}@${DOMAIN}`

  const renderEmail = (): React.ReactNode => {
    const replyTo = email.replyToAddress.display ? email.replyToAddress.value : email.fromAddress.value
    const subject = email.subject ?? 'no subject'
    if (composeMode === ComposeMode.REPLY) {
      return (
        <Compose
          discardCallback={discardCallback}
          inReplyTo={email.id}
          initialBody={renderReply(html)}
          initialSubject={subject.replace(/^(RE:)?\s*/i, 'RE: ')}
          initialToAddresses={replyTo}
          references={email.references}
        />
      )
    } else if (composeMode === ComposeMode.REPLY_ALL) {
      return (
        <Compose
          discardCallback={discardCallback}
          inReplyTo={email.id}
          initialBody={renderReply(html)}
          initialCcAddresses={email.ccAddress?.value.filter(filterUsersEmail)}
          initialSubject={subject.replace(/^(RE:)?\s*/i, 'RE: ')}
          initialToAddresses={
            email.toAddress ? [...replyTo, ...email.toAddress.value].filter(filterUsersEmail) : replyTo
          }
          references={email.references}
        />
      )
    } else if (composeMode === ComposeMode.FORWARD) {
      return (
        <Compose
          discardCallback={discardCallback}
          inReplyTo={email.id}
          initialBody={renderReply(html)}
          initialSubject={subject.replace(/^(FWD?:)?\s*/i, 'FW: ')}
          references={email.references}
        />
      )
    }
    return (
      <>
        <SubjectLine bounced={bounced} subject={subject} />
        <AddressLine addresses={email.toAddress?.value ?? []} label="To:" />
        {email.ccAddress?.value.length ? <AddressLine addresses={email.ccAddress.value} label="CC:" /> : null}
        {email.bccAddress?.value.length ? <AddressLine addresses={email.bccAddress.value} label="BCC:" /> : null}
        <AddressLine addresses={email.fromAddress.value} label="From:" />
        {email.attachments?.length ? (
          <AttachmentViewer
            accountId={accountId}
            attachments={email.attachments}
            emailId={emailId}
            getAttachment={getAttachment}
          />
        ) : null}
        <div className="flex flex-wrap items-center gap-1 px-4 py-1">
          <ShowImagesButton onClick={() => setShowImages(!showImages)} showImages={showImages} />
          <div className="flex-1" />
          <ReplyButton onClick={() => setComposeMode(ComposeMode.REPLY)} />
          <ReplyAllButton onClick={() => setComposeMode(ComposeMode.REPLY_ALL)} />
          <ForwardButton onClick={() => setComposeMode(ComposeMode.FORWARD)} />
          {bounceEmail && <BounceButton onClick={() => setShowBounceDialog(true)} />}
          {deleteEmail && <DeleteButton onClick={() => setShowDeleteDialog(true)} />}
        </div>
        <EmailDivider />
        <div className="p-2" dangerouslySetInnerHTML={{ __html: html }}></div>
      </>
    )
  }

  const renderReply = (html: string): string => {
    const date = email.date ? new Date(email.date) : undefined
    const fromAddress = email.fromAddress.value[0]
    const sender = fromAddress.name ? `${fromAddress.name} <${fromAddress.address}>` : fromAddress.address
    return ReactDOMServer.renderToStaticMarkup(
      <div>
        <br />
        <br />
        <div>
          On {date ? date.toLocaleDateString() : 'unknown'} at {date ? date.toLocaleTimeString() : 'unknown'} {sender}{' '}
          wrote:
        </div>
        <blockquote
          dangerouslySetInnerHTML={{ __html: html }}
          style={{ borderLeft: '1px solid rgb(204,204,204)', margin: '0px 0px 0px 0.8ex', paddingLeft: '1ex' }}
        ></blockquote>
      </div>,
    )
  }

  const removeExternalCss = (style: any): void => {
    for (const attr of [...style]) {
      if (/(url\("?)(?!data:)/gim.test(style[attr])) {
        style.removeProperty(attr)
      }
    }
  }

  const snackbarErrorClose = (): void => {
    setErrorMessage(undefined)
  }

  if (showImages === false) {
    DOMPurify.addHook('uponSanitizeElement', (node: Element | any, data: any): void => {
      if (data.tagName.toLowerCase() === 'style') {
        for (const rule of node.sheet.cssRules) {
          if (rule.style) {
            removeExternalCss(rule.style)
          }
        }
        node.innerText = [...node.sheet.cssRules].reduce((acc: string, curr: any) => `${acc} ${curr.cssText}`, '')
      }
    })

    DOMPurify.addHook('afterSanitizeAttributes', (node: Element | any): void => {
      for (const attr of HTTP_LEAK_ATTRIBUTES) {
        if (/^data:image\//.test(node.getAttribute(attr)) === false) {
          node.removeAttribute(attr)
        }
      }
      removeExternalCss(node.style)
    })
  }
  DOMPurify.addHook('afterSanitizeAttributes', (node: Element | any): void => {
    if ('target' in node) {
      node.setAttribute('target', '_blank')
    }
    if (!node.hasAttribute('target') && (node.hasAttribute('xlink:href') || node.hasAttribute('href'))) {
      node.setAttribute('xlink:show', 'new')
    }
  })

  const forbiddenTags = showImages ? [] : ['svg']
  const html = DOMPurify.sanitize(email.bodyHtml || email.bodyText, { FORBID_TAGS: forbiddenTags })
  DOMPurify.removeAllHooks()

  return (
    <>
      {renderEmail()}
      <LoadingOverlay open={backdropShown} />
      <ConfirmDialog
        cancelLabel="Cancel"
        confirmLabel="Bounce"
        onCancel={bounceDialogClose}
        onConfirm={() => bounceEmail && bounceEmailClick(bounceEmail)}
        open={showBounceDialog}
        title="Bounce email"
      >
        Are you sure you want to bounce this email? Bouncing an email signals to the sender that the account is invalid.
        You can automatically bounce messages from certain senders in account settings.
      </ConfirmDialog>
      <ConfirmDialog
        cancelLabel="Cancel"
        confirmLabel="Delete"
        onCancel={deleteDialogClose}
        onConfirm={() => deleteEmail && deleteEmailClick(deleteEmail)}
        open={showDeleteDialog}
        title="Delete email"
      >
        Are you sure you want to delete this email?
      </ConfirmDialog>
      <ErrorSnackbar message={errorMessage} onClose={snackbarErrorClose} />
    </>
  )
}

export default EmailViewer
