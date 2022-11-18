import React, { useRef, useState } from 'react'
import Alert from '@mui/material/Alert'
import AttachmentIcon from '@mui/icons-material/Attachment'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import Snackbar from '@mui/material/Snackbar'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import axios from 'axios'

import { EmailAttachment, SignedUrl } from '@types'

type getAttachmentFn = (accountId: string, emailId: string, attachmentId: string) => Promise<SignedUrl>

export interface AttachmentViewerProps {
  accountId: string
  attachments: EmailAttachment[]
  emailId: string
  getAttachment: getAttachmentFn
}

const AttachmentViewer = ({ accountId, attachments, emailId, getAttachment }: AttachmentViewerProps): JSX.Element => {
  const [attachmentDownloading, setAttachmentDownloading] = useState<string | undefined>(undefined)
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)

  const anchorRef = useRef<HTMLAnchorElement>(null)

  const handleAttachmentClick = async (
    target: HTMLAnchorElement,
    accountId: string,
    emailId: string,
    attachmentId: string
  ): Promise<void> => {
    setAttachmentDownloading(attachmentId)
    try {
      const metadata = attachments.find((value) => value.id === attachmentId) as EmailAttachment
      const { url } = await getAttachment(accountId, emailId, attachmentId)
      const attachmentBlob = await axios.get(url, { responseType: 'blob' }).then((response) => response.data)
      const typedBlob = new Blob([attachmentBlob], {
        type: metadata.type,
      })
      const objectUrl = window.URL.createObjectURL(typedBlob)
      target.download = metadata?.filename
      target.href = objectUrl
      target.click()
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      console.error('handleAttachmentClick', error)
      setErrorMessage('Error downloading the attachment. Please try again.')
    }
    setAttachmentDownloading(undefined)
  }

  const snackbarErrorClose = (): void => {
    setErrorMessage(undefined)
  }

  return (
    <>
      <Grid alignItems="center" columnSpacing={1} container paddingLeft={2} paddingRight={1}>
        <Grid item padding={1} xs="auto">
          <Typography variant="body1">Attachments:</Typography>
        </Grid>
        {attachments.map((attachment, index) => (
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
      <a ref={anchorRef} style={{ display: 'none' }}></a>
      <Snackbar autoHideDuration={15_000} onClose={snackbarErrorClose} open={errorMessage !== undefined}>
        <Alert onClose={snackbarErrorClose} severity="error" variant="filled">
          {errorMessage}
        </Alert>
      </Snackbar>
    </>
  )
}

export default AttachmentViewer
