import React, { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { Auth } from 'aws-amplify'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import { AmplifyUser, EmailBatch, EmailContents } from '@types'
import { deleteSentEmail, getAllSentEmails, getSentAttachment, getSentEmailContents } from '@services/emails'
import EmailViewer from '@components/email-viewer'

const Outbox = (): JSX.Element => {
  const [email, setEmail] = useState<EmailContents | undefined>(undefined)
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
  const [isEmailLoading, setIsEmailLoading] = useState(false)
  const [isViewingEmail, setIsViewingEmail] = useState(false)
  const [loggedInUser, setLoggedInUser] = useState<AmplifyUser | undefined>(undefined)
  const [receivedEmails, setReceivedEmails] = useState<EmailBatch[] | undefined>(undefined)
  const [selectedEmail, setSelectedEmail] = useState<string | undefined>(undefined)

  const deleteEmail = async (accountId: string, emailId: string): Promise<void> => {
    await deleteSentEmail(accountId, emailId)
    await refreshEmails()
  }

  const emailSelectClick = async (accountId: string, emailId: string): Promise<void> => {
    setSelectedEmail(emailId)
    setIsEmailLoading(true)
    setIsViewingEmail(true)
    try {
      const emailContents = await getSentEmailContents(accountId, emailId)
      setEmail(emailContents)
    } catch (error: any) {
      console.error('emailSelectClick', error)
      setErrorMessage('Error fetching email. Please try again.')
    }
    setIsEmailLoading(false)
  }

  const refreshEmails = async (): Promise<void> => {
    if (loggedInUser?.username) {
      try {
        const emails = await getAllSentEmails(loggedInUser.username)
        setReceivedEmails(emails.sort((a, b) => Math.sign(b.data.timestamp - a.data.timestamp)))
      } catch (error: any) {
        console.error('refreshEmails', error)
        setErrorMessage('Error fetching emails. Please reload the page to try again.')
      }
    }
  }

  const renderLoading = (): JSX.Element => (
    <Grid alignItems="center" container justifyContent="center" sx={{ minHeight: { md: '80vh', xs: '40vh' } }}>
      <Grid item>
        <CircularProgress />
      </Grid>
    </Grid>
  )

  const renderReceivedEmails = (receivedEmails: EmailBatch[]): JSX.Element => {
    if (receivedEmails.length === 0) {
      return (
        <Grid alignItems="center" container justifyContent="center" sx={{ height: '100%' }}>
          <Grid item>
            <Typography p={2} sx={{ textAlign: 'center' }} variant="h6">
              Your inbox is empty
            </Typography>
          </Grid>
        </Grid>
      )
    }
    return (
      <List component="nav">
        {receivedEmails.map((email, index) => (
          <React.Fragment key={index}>
            <ListItemButton
              onClick={() => loggedInUser?.username && emailSelectClick(loggedInUser.username, email.id)}
              selected={selectedEmail === email.id}
            >
              <ListItemText
                primary={
                  <Typography sx={{ fontWeight: email.data.viewed ? 'normal' : 'bold' }}>
                    {email.data.subject}
                  </Typography>
                }
                secondary={
                  <Stack spacing={1}>
                    <Box sx={{ wordWrap: 'break-word' }}>{email.data.to.join(', ')}</Box>
                    <Box>{new Date(email.data.timestamp).toLocaleString()}</Box>
                  </Stack>
                }
              />
            </ListItemButton>
            <Divider component="li" />
          </React.Fragment>
        ))}
      </List>
    )
  }

  const renderViewer = (accountId: string, emailId?: string, email?: EmailContents): JSX.Element => {
    if (email === undefined || emailId === undefined) {
      return (
        <Grid alignItems="center" container justifyContent="center" sx={{ height: '100%' }}>
          <Grid item>
            <Typography p={2} sx={{ textAlign: 'center' }} variant="h6">
              Select an email to view
            </Typography>
          </Grid>
        </Grid>
      )
    }
    return (
      <EmailViewer
        accountId={accountId}
        deleteEmail={deleteEmail}
        email={email}
        emailId={emailId}
        getAttachment={getSentAttachment}
      />
    )
  }

  const snackbarErrorClose = (): void => {
    setErrorMessage(undefined)
  }

  useEffect(() => {
    refreshEmails()
  }, [loggedInUser])

  useEffect(() => {
    if (
      loggedInUser?.username &&
      receivedEmails !== undefined &&
      receivedEmails.length > 0 &&
      receivedEmails.find((email) => email.id === selectedEmail) === undefined
    ) {
      emailSelectClick(loggedInUser?.username, receivedEmails[0].id)
    }
  }, [receivedEmails])

  useEffect(() => {
    Auth.currentAuthenticatedUser()
      .then(setLoggedInUser)
      .catch((error: any) => {
        console.error('currentAuthenticatedUser', error)
        setErrorMessage('Error authenticating user. Please reload the page to try again.')
      })
  }, [])

  return (
    <>
      <Grid container spacing={1} sx={{ width: '100%' }}>
        <Grid item lg={3} md={4} sx={{ display: { md: 'initial', xs: isViewingEmail ? 'none' : 'initial' } }} xs={12}>
          <Grid container>
            <Grid item xs></Grid>
            <Grid item xs="auto">
              <Tooltip sx={{ display: { md: 'none', xs: 'initial' } }} title="Email">
                <IconButton aria-label="Show selected email" onClick={() => setIsViewingEmail(true)}>
                  <ArrowForwardIcon />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
          <Card sx={{ height: '100%', maxHeight: '80vh', overflowY: 'scroll', width: '100%' }} variant="outlined">
            {receivedEmails === undefined ? renderLoading() : renderReceivedEmails(receivedEmails)}
          </Card>
        </Grid>
        <Grid item sx={{ display: { md: 'initial', xs: isViewingEmail ? 'initial' : 'none' } }} xs>
          <Grid container>
            <Grid item xs="auto">
              <Tooltip sx={{ display: { md: 'none', xs: 'initial' } }} title="Back">
                <IconButton aria-label="Back to email list" onClick={() => setIsViewingEmail(false)}>
                  <ArrowBackIcon />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
          <Card sx={{ minHeight: { md: '80vh', xs: '40vh' }, overflow: 'scroll', width: '100%' }} variant="outlined">
            {isEmailLoading || loggedInUser?.username === undefined
              ? renderLoading()
              : renderViewer(loggedInUser?.username, selectedEmail, email)}
          </Card>
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

export default Outbox
