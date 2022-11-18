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
import SendIcon from '@mui/icons-material/Send'
import Snackbar from '@mui/material/Snackbar'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { navigate } from 'gatsby'

import { AmplifyUser, EmailAddress, EmailAttachment, EmailOutbound } from '@types'
import AddressLine from '@components/address-line'
import AttachmentUploader from '@components/attachment-uploader'
import { postSentEmail } from '@services/emails'

const DOMAIN = process.env.GATSBY_DOMAIN

export interface ComposeProps {
  discardCallback?: () => void
  inReplyTo?: string
  initialBody?: string
  initialCcAddresses?: EmailAddress[]
  initialSubject?: string
  initialToAddresses?: EmailAddress[]
  references?: string[]
}

const Compose = ({
  discardCallback,
  inReplyTo,
  initialBody,
  initialCcAddresses,
  initialSubject,
  initialToAddresses,
  references,
}: ComposeProps): JSX.Element => {
  const [attachments, setAttachments] = useState<EmailAttachment[]>([])
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

  const handleSendClick = async (accountId: string, editor: HTMLDivElement): Promise<void> => {
    if (bccAddresses.length + ccAddresses.length + toAddresses.length === 0) {
      setRecipientMessage('Please enter recipients.')
      window.scrollTo(0, 0)
      return
    } else {
      setRecipientMessage('')
    }

    setIsSubmitting(true)
    try {
      const fromAddress = { address: `${accountId}@${DOMAIN}`, name: '' }
      const outboundEmail: EmailOutbound = {
        bcc: bccAddresses,
        cc: ccAddresses,
        from: fromAddress,
        html: editor.innerHTML,
        inReplyTo,
        references,
        replyTo: fromAddress,
        sender: fromAddress,
        subject: subject || 'no subject',
        text: editor.textContent || '',
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

    if (initialBody && editor.current) {
      editor.current.innerHTML = initialBody
    }
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
          <div contentEditable={true} ref={editor} style={{ minHeight: '20vh' }}></div>
        </Box>
        <Divider />
        {loggedInUser?.username && (
          <AttachmentUploader
            accountId={loggedInUser?.username}
            attachments={attachments}
            setAttachments={setAttachments}
          />
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
        <DialogTitle id="alert-dialog-title">Discard message?</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to discard this message?
          </DialogContentText>
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
