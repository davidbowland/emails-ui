import axios from 'axios'
import React, { useRef, useState } from 'react'

import CloseIcon from '@mui/icons-material/Close'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import Snackbar from '@mui/material/Snackbar'
import { styled } from '@mui/material/styles'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import { postSentAttachment } from '@services/emails'
import { EmailAttachment } from '@types'

const RoundedBox = styled(Box)(() => ({
  borderRadius: '15px',
}))

type setAttachmentsFn = (attachments: EmailAttachment[]) => void

export interface AttachmentUploaderProps {
  accountId: string
  attachments: EmailAttachment[]
  setAttachments: setAttachmentsFn
}

const AttachmentUploader = ({ accountId, attachments, setAttachments }: AttachmentUploaderProps): JSX.Element => {
  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  const [uploadingFilename, setUploadingFilename] = useState<string | undefined>()

  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (file: File): Promise<void> => {
    setUploadingFilename(file.name)
    try {
      const postSignedUrl = await postSentAttachment(accountId)
      const formData = new FormData()
      Object.entries(postSignedUrl.fields).map(([k, v]) => formData.append(k, v))
      formData.append('file', file)
      await axios.post(postSignedUrl.url, formData, {})

      const key = postSignedUrl.fields.key
      const id = key.replace(/^.*\//, '')
      setAttachments([
        ...attachments,
        {
          filename: file.name,
          id,
          key,
          size: file.size,
          type: file.type,
        },
      ])
    } catch (error) {
      console.error('handleFileUpload', { accountId, error, file: file.name })
      setErrorMessage('Error uploading file. Please ensure file is below file size limit and then try again.')
    }
    setUploadingFilename(undefined)
  }

  const removeAttachmentById = (id: string): void => {
    setAttachments(attachments.filter((attachment) => attachment.id !== id))
  }

  const renderDisplay = (attachment: EmailAttachment): JSX.Element => (
    <Grid container>
      <Grid item p={1} xs>
        {attachment.filename}
      </Grid>
      <Grid alignContent="center" item xs="auto">
        <Tooltip title="Remove attachment">
          <IconButton
            aria-label="Remove attachment"
            onClick={() => removeAttachmentById(attachment.id)}
            sx={{ marginTop: '0.15em' }}
          >
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </Grid>
    </Grid>
  )

  const snackbarErrorClose = (): void => {
    setErrorMessage(undefined)
  }

  return (
    <>
      <Grid alignItems="center" container padding={2} paddingBottom={1} paddingTop={1} spacing={1}>
        <Grid item padding={1} xs="auto">
          <Typography variant="body1">Attachments:</Typography>
        </Grid>
        {attachments.map((attachment, index) => (
          <Grid item key={index} xs="auto">
            <RoundedBox sx={{ border: 1 }}>{renderDisplay(attachment)}</RoundedBox>
          </Grid>
        ))}
        <Grid item xs="auto">
          <RoundedBox sx={{ border: 1, overflow: 'hidden', p: 1, width: { sm: 'initial', xs: '250px' } }}>
            {uploadingFilename === undefined ? (
              <input
                aria-label="Attachment upload"
                onChange={(event) => event.target.files?.[0] && handleFileUpload(event.target.files[0])}
                ref={inputRef}
                type="file"
              />
            ) : (
              <Typography>
                <CircularProgress size={14} /> Uploading {uploadingFilename}
              </Typography>
            )}
          </RoundedBox>
        </Grid>
      </Grid>
      <Snackbar autoHideDuration={15_000} onClose={snackbarErrorClose} open={errorMessage !== undefined}>
        <Alert onClose={snackbarErrorClose} severity="error" variant="filled">
          {errorMessage}
        </Alert>
      </Snackbar>
    </>
  )
}

export default AttachmentUploader
