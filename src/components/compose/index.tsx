import React, { useEffect, useRef, useState } from 'react'
import Alert from '@mui/material/Alert'
import { Auth } from 'aws-amplify'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CircularProgress from '@mui/material/CircularProgress'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import { navigate } from 'gatsby'
import SendIcon from '@mui/icons-material/Send'
import Snackbar from '@mui/material/Snackbar'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { AmplifyUser, EmailAddress, EmailAttachment, EmailOutbound } from '@types'
import AddressLine from '@components/address-line'
import AttachmentUploader from '@components/attachment-uploader'
import HtmlEditor from '@components/html-editor'
import { postSentEmail } from '@services/emails'

const DOMAIN = process.env.GATSBY_DOMAIN
const MAX_UPLOAD_SIZE = parseInt(process.env.GATSBY_MAX_UPLOAD_SIZE, 10)

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
}: ComposeProps): JSX.Element => {
  const [attachmentMessage, setAttachmentMessage] = useState<string | undefined>(undefined)
  const [attachments, setAttachments] = useState<EmailAttachment[]>(initialAttachments ?? [])
  const [bccAddresses, setBccAddresses] = useState<EmailAddress[]>([])
  const [ccAddresses, setCcAddresses] = useState<EmailAddress[]>(initialCcAddresses ?? [])
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loggedInUser, setLoggedInUser] = useState<AmplifyUser | undefined>(undefined)
  const [recipientMessage, setRecipientMessage] = useState<string | undefined>(undefined)
  const [subject, setSubject] = useState(initialSubject ?? '')
  const [toAddresses, setToAddresses] = useState<EmailAddress[]>(initialToAddresses ?? [])

  const editor = useRef<HTMLDivElement>(null)

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
      navigate('/outbox')
    } catch (error) {
      console.error('handleSendClick', error)
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
        console.error('currentAuthenticatedUser', error)
        setErrorMessage('Error authenticating user. Please reload the page to try again.')
        window.location.reload()
      })
  }, [])

  return (
    <>
      <Card
        sx={{ minHeight: { md: '80vh', xs: '40vh' }, overflow: 'scroll', paddingTop: '0.5em', width: '100%' }}
        variant="outlined"
      >
        <AddressLine addresses={toAddresses} label="To:" setAddresses={setToAddresses} />
        <AddressLine addresses={ccAddresses} label="CC:" setAddresses={setCcAddresses} />
        <AddressLine addresses={bccAddresses} label="BCC:" setAddresses={setBccAddresses} />
        {recipientMessage && (
          <Typography color="error" padding={2} variant="caption">
            {recipientMessage}
          </Typography>
        )}
        <Box padding={2} paddingTop={1}>
          <label>
            <TextField
              fullWidth
              label="Subject"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSubject(event.target.value)}
              value={subject}
            />
          </label>
        </Box>
        <Divider />
        <Box padding={2}>
          <HtmlEditor initialBody={initialBody} inputRef={editor} />
        </Box>
        <Divider />
        {loggedInUser?.username && (
          <AttachmentUploader
            accountId={loggedInUser?.username}
            attachments={attachments}
            setAttachments={setAttachments}
          />
        )}
        {attachmentMessage && (
          <Typography color="error" padding={2} variant="caption">
            {attachmentMessage}
          </Typography>
        )}
        <Grid container>
          <Grid item order={{ md: 1, xs: 3 }} xs></Grid>
          <Grid item md={3} order={{ xs: 2 }} padding={2} xs={12}>
            <Button
              disabled={isSubmitting}
              fullWidth
              onClick={() => setIsDiscardDialogOpen(true)}
              startIcon={<DeleteOutlineIcon />}
              variant="outlined"
            >
              Discard
            </Button>
          </Grid>
          <Grid item order={{ md: 3, xs: 4 }} xs></Grid>
          <Grid item md={3} order={{ md: 4, xs: 1 }} padding={2} xs={12}>
            {loggedInUser?.username && editor.current && (
              <Button
                disabled={isSubmitting}
                fullWidth
                onClick={() =>
                  loggedInUser?.username && editor.current && handleSendClick(loggedInUser.username, editor.current)
                }
                startIcon={isSubmitting ? <CircularProgress size={14} /> : <SendIcon />}
                variant="contained"
              >
                Send
              </Button>
            )}
          </Grid>
          <Grid item order={{ xs: 5 }} xs></Grid>
        </Grid>
      </Card>
      <Dialog
        aria-describedby="Are you sure you want to discard this message?"
        aria-labelledby="Discard message dialog"
        onClose={discardDialogClose}
        open={isDiscardDialogOpen}
      >
        <DialogTitle>Discard message?</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to discard this message?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={discardDialogClose}>
            Keep editing
          </Button>
          <Button
            onClick={() => {
              editor.current && resetForm(editor.current)
              discardDialogClose()
              discardCallback && discardCallback()
            }}
          >
            Discard
          </Button>
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

export default Compose
