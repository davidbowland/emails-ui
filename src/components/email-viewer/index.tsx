import React, { useRef, useState } from 'react'
import Alert from '@mui/material/Alert'
import AttachmentIcon from '@mui/icons-material/Attachment'
import Backdrop from '@mui/material/Backdrop'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import DOMPurify from 'dompurify'
import DeleteIcon from '@mui/icons-material/Delete'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import HideImageIcon from '@mui/icons-material/HideImage'
import IconButton from '@mui/material/IconButton'
import ImageIcon from '@mui/icons-material/Image'
import Snackbar from '@mui/material/Snackbar'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { styled } from '@mui/material/styles'

import { EmailAttachment, EmailContents } from '@types'

const HTTP_LEAK_ATTRIBUTES = ['action', 'background', 'poster', 'src']

const RoundedBox = styled(Box)(() => ({
  borderRadius: '15px',
}))

type deleteEmailFn = (accountId: string, emailId: string) => Promise<any>
type getAttachmentFn = (accountId: string, emailId: string, attachmentId: string) => Promise<Blob>

export interface EmailViewerProps {
  accountId: string
  deleteEmail?: deleteEmailFn
  email: EmailContents
  emailId: string
  getAttachment: getAttachmentFn
}

const EmailViewer = ({ accountId, deleteEmail, email, emailId, getAttachment }: EmailViewerProps): JSX.Element => {
  const [attachmentDownloading, setAttachmentDownloading] = useState<string | undefined>(undefined)
  const [backdropShown, setBackdropShown] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showImages, setShowImages] = useState(false)

  const anchorRef = useRef<HTMLAnchorElement>(null)

  const deleteDialogClose = (): void => {
    setShowDeleteDialog(false)
  }

  const deleteEmailClick = async (deleteEmail: deleteEmailFn): Promise<void> => {
    setBackdropShown(true)
    deleteDialogClose()
    try {
      await deleteEmail(accountId, emailId)
    } catch (error: any) {
      console.error('deleteEmailClick', error)
      setErrorMessage('Error deleting email. Please refresh and try again.')
    }
    setBackdropShown(false)
  }

  const handleAttachmentClick = async (
    target: HTMLAnchorElement,
    accountId: string,
    emailId: string,
    attachmentId: string
  ): Promise<void> => {
    setAttachmentDownloading(attachmentId)
    try {
      const attachment = await getAttachment(accountId, emailId, attachmentId)
      const metadata = email.attachments?.find((value) => value.id === attachmentId) as EmailAttachment
      const url = window.URL.createObjectURL(attachment)
      target.download = metadata?.filename
      target.href = url
      target.click()
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      console.error('handleAttachmentClick', error)
      setErrorMessage('Error downloading the attachment. Please try again.')
    }
    setAttachmentDownloading(undefined)
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
    DOMPurify.addHook('uponSanitizeElement', (node: Element | any, data: DOMPurify.SanitizeElementHookEvent): void => {
      // Remove external CSS from style tags
      if (data.tagName.toLowerCase() === 'style') {
        for (const rule of node.sheet.cssRules) {
          removeExternalCss(rule.style)
        }
        node.innerText = [...node.sheet.cssRules].reduce((acc: string, curr: any) => `${acc} ${curr.cssText}`, '')
      }
    })

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
      <Typography padding={2} paddingBottom={1} variant="h4">
        {email.subject}
      </Typography>
      <Grid alignItems="center" columnSpacing={1} container paddingLeft={2} paddingRight={1}>
        <Grid item padding={1} xs="auto">
          <Typography variant="body1">To:</Typography>
        </Grid>
        {email.toAddress?.value.map((to, index) => (
          <Grid item key={index} xs="auto">
            <RoundedBox sx={{ border: 1 }}>
              <Typography paddingLeft={1} paddingRight={1} sx={{ wordWrap: 'break-word' }} variant="body1">
                {to.name ? `${to.name} <${to.address}>` : to.address}
              </Typography>
            </RoundedBox>
          </Grid>
        ))}
      </Grid>
      {email.ccAddress && (
        <Grid alignItems="center" columnSpacing={1} container paddingLeft={2} paddingRight={1}>
          <Grid item padding={1} xs="auto">
            <Typography variant="body1">CC:</Typography>
          </Grid>
          {email.ccAddress?.value.map((cc, index) => (
            <Grid item key={index} padding={1} xs="auto">
              <RoundedBox sx={{ border: 1 }}>
                <Typography paddingLeft={1} paddingRight={1} sx={{ wordWrap: 'break-word' }} variant="body1">
                  {cc.name ? `${cc.name} <${cc.address}>` : cc.address}
                </Typography>
              </RoundedBox>
            </Grid>
          ))}
        </Grid>
      )}
      <Grid alignItems="center" columnSpacing={1} container paddingLeft={2} paddingRight={1}>
        <Grid item padding={1} xs="auto">
          <Typography variant="body1">From:</Typography>
        </Grid>
        <Grid item padding={1} sx={{ maxWidth: '100%' }} xs="auto">
          <RoundedBox sx={{ border: 1 }}>
            <Typography
              component="div"
              paddingLeft={1}
              paddingRight={1}
              sx={{ wordWrap: 'break-word' }}
              variant="body1"
            >
              {email.fromAddress.text}
            </Typography>
          </RoundedBox>
        </Grid>
      </Grid>
      {email.attachments?.length ? (
        <Grid alignItems="center" columnSpacing={1} container paddingLeft={2} paddingRight={1}>
          <Grid item padding={1} xs="auto">
            <Typography variant="body1">Attachments:</Typography>
          </Grid>
          {email.attachments.map((attachment, index) => (
            <Grid item key={index} padding={1} xs="auto">
              <Tooltip title={`${attachment.size.toLocaleString()} bytes`}>
                <Button
                  disabled={attachmentDownloading !== undefined}
                  onClick={() =>
                    anchorRef?.current && handleAttachmentClick(anchorRef?.current, accountId, emailId, attachment.id)
                  }
                  startIcon={
                    attachmentDownloading === attachment.id ? <CircularProgress size={14} /> : <AttachmentIcon />
                  }
                  variant="outlined"
                >
                  {attachment.filename}
                </Button>
              </Tooltip>
            </Grid>
          ))}
        </Grid>
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
      <a ref={anchorRef} style={{ display: 'none' }}></a>
      <Box dangerouslySetInnerHTML={{ __html: html }} padding={1}></Box>
      <Backdrop open={backdropShown} sx={{ zIndex: (theme: any) => theme.zIndex.drawer + 1 }}>
        <Grid alignItems="center" container justifyContent="center" sx={{ height: '100%' }}>
          <Grid item>
            <CircularProgress />
          </Grid>
        </Grid>
      </Backdrop>
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
