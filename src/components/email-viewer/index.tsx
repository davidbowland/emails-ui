import DOMPurify from 'dompurify'
import React, { useState } from 'react'
import ReactDOMServer from 'react-dom/server'

import BlockIcon from '@mui/icons-material/Block'
import DeleteIcon from '@mui/icons-material/Delete'
import ForwardToInboxIcon from '@mui/icons-material/ForwardToInbox'
import HideImageIcon from '@mui/icons-material/HideImage'
import ImageIcon from '@mui/icons-material/Image'
import ReplyIcon from '@mui/icons-material/Reply'
import ReplyAllIcon from '@mui/icons-material/ReplyAll'
import Alert from '@mui/material/Alert'
import Backdrop from '@mui/material/Backdrop'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import Snackbar from '@mui/material/Snackbar'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import AddressLine from '@components/address-line'
import AttachmentViewer from '@components/attachment-viewer'
import Compose from '@components/compose'
import { EmailAddress, EmailContents, SignedUrl } from '@types'

const DOMAIN = process.env.GATSBY_DOMAIN
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
  bounceEmail?: bounceEmailFn
  deleteEmail?: deleteEmailFn
  email: EmailContents
  emailId: string
  getAttachment: getAttachmentFn
}

const EmailViewer = ({
  accountId,
  bounceEmail,
  deleteEmail,
  email,
  emailId,
  getAttachment,
}: EmailViewerProps): JSX.Element => {
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

  const renderEmail = (): JSX.Element => {
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
        <Typography padding={2} paddingBottom={1} variant="h4">
          {subject}
        </Typography>
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
        <Grid alignItems="center" columnSpacing={1} container paddingLeft={2} paddingRight={1}>
          <Grid item padding={1} xs="auto">
            {showImages ? (
              <Button onClick={() => setShowImages(false)} startIcon={<HideImageIcon />}>
                Hide images
              </Button>
            ) : (
              <Button onClick={() => setShowImages(true)} startIcon={<ImageIcon />}>
                Show images
              </Button>
            )}
          </Grid>
          <Grid item xs></Grid>
          <Grid item xs="auto">
            <Tooltip title="Reply">
              <IconButton onClick={() => setComposeMode(ComposeMode.REPLY)}>
                <ReplyIcon />
              </IconButton>
            </Tooltip>
          </Grid>
          <Grid item xs="auto">
            <Tooltip title="Reply all">
              <IconButton onClick={() => setComposeMode(ComposeMode.REPLY_ALL)}>
                <ReplyAllIcon />
              </IconButton>
            </Tooltip>
          </Grid>
          <Grid item xs="auto">
            <Tooltip title="Forward">
              <IconButton onClick={() => setComposeMode(ComposeMode.FORWARD)}>
                <ForwardToInboxIcon />
              </IconButton>
            </Tooltip>
          </Grid>
          {bounceEmail && (
            <Grid item xs="auto">
              <Tooltip title="Bounce email">
                <IconButton onClick={() => setShowBounceDialog(true)}>
                  <BlockIcon />
                </IconButton>
              </Tooltip>
            </Grid>
          )}
          {deleteEmail && (
            <Grid item xs="auto">
              <Tooltip title="Delete email">
                <IconButton onClick={() => setShowDeleteDialog(true)}>
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Grid>
          )}
        </Grid>
        <Divider />
        <Box dangerouslySetInnerHTML={{ __html: html }} padding={1}></Box>
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
    DOMPurify.addHook(
      'uponSanitizeElement',
      (node: Element | any, data: DOMPurify.UponSanitizeElementHookEvent): void => {
        // Remove external CSS from style tags
        if (data.tagName.toLowerCase() === 'style') {
          for (const rule of node.sheet.cssRules) {
            if (rule.style) {
              removeExternalCss(rule.style)
            }
          }
          node.innerText = [...node.sheet.cssRules].reduce((acc: string, curr: any) => `${acc} ${curr.cssText}`, '')
        }
      },
    )

    DOMPurify.addHook('afterSanitizeAttributes', (node: Element | any): void => {
      // Remove any attributes that leak HTTP calls
      for (const attr of HTTP_LEAK_ATTRIBUTES) {
        if (/^data:image\//.test(node.getAttribute(attr)) === false) {
          node.removeAttribute(attr)
        }
      }
      // Remove external CSS from style attributes
      removeExternalCss(node.style)
    })
  }
  DOMPurify.addHook('afterSanitizeAttributes', (node: Element | any): void => {
    // Open links in new tabs
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
      <Backdrop open={backdropShown} sx={{ zIndex: (theme: any) => theme.zIndex.drawer + 1 }}>
        <Grid alignItems="center" container justifyContent="center" sx={{ height: '100%' }}>
          <Grid item>
            <CircularProgress />
          </Grid>
        </Grid>
      </Backdrop>
      <Dialog
        aria-describedby="Are you sure you want to bounce the email?"
        aria-labelledby="Bounce email dialog"
        onClose={bounceDialogClose}
        open={showBounceDialog}
      >
        <DialogTitle id="bounce-dialog-title">Bounce email</DialogTitle>
        <DialogContent>
          <DialogContentText id="bounce-dialog-description">
            Are you sure you want to bounce this email? Bouncing an email signals to the sender that the account is
            invalid. You can automatically bounce messages from certain senders in account settings.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={bounceDialogClose}>
            Cancel
          </Button>
          {bounceEmail && <Button onClick={() => bounceEmailClick(bounceEmail)}>Bounce</Button>}
        </DialogActions>
      </Dialog>
      <Dialog
        aria-describedby="Are you sure you want to delete the email?"
        aria-labelledby="Delete email dialog"
        onClose={deleteDialogClose}
        open={showDeleteDialog}
      >
        <DialogTitle id="alert-dialog-title">Delete email</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this email?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={deleteDialogClose}>
            Cancel
          </Button>
          {deleteEmail && <Button onClick={() => deleteEmailClick(deleteEmail)}>Delete</Button>}
        </DialogActions>
      </Dialog>
      <Snackbar autoHideDuration={15_000} onClose={snackbarErrorClose} open={errorMessage !== undefined}>
        <Alert onClose={snackbarErrorClose} severity="error" variant="filled">
          {errorMessage}
        </Alert>
      </Snackbar>
    </>
  )
}

export default EmailViewer
