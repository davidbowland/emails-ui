import React, { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import { Auth } from 'aws-amplify'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import SaveIcon from '@mui/icons-material/Save'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import jsonpatch from 'fast-json-patch'

import { Account, AmplifyUser, EmailAddress } from '@types'
import { getAccount, patchAccount } from '@services/emails'
import AddressLine from '@components/address-line'

const AccountSettings = (): JSX.Element => {
  const [account, setAccount] = useState<Account | undefined>(undefined)
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
  const [forwardAddresses, setForwardAddresses] = useState<EmailAddress[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [loggedInUser, setLoggedInUser] = useState<AmplifyUser | undefined>(undefined)
  const [name, setName] = useState('')

  const handleSaveClick = async (accountId: string, account: Account): Promise<void> => {
    setIsSaving(true)
    try {
      const forwardTargets = forwardAddresses.map((address) => address.address)
      const updatedAccount: Account = { forwardTargets, id: accountId, name }
      const jsonPatchOperations = jsonpatch.compare(account, updatedAccount, true)
      if (jsonPatchOperations.length > 0) {
        await patchAccount(accountId, jsonPatchOperations)
        setAccount(updatedAccount)
      }
    } catch (error: any) {
      console.error('handleSaveClick', error)
      setErrorMessage('Error saving account settings. Please refresh the page and try again.')
    }
    setIsSaving(false)
  }

  const snackbarErrorClose = (): void => {
    setErrorMessage(undefined)
  }

  useEffect(() => {
    if (account) {
      const forwardTargets = account.forwardTargets.map((address) => ({ address, name: '' }))
      setForwardAddresses(forwardTargets)
      setName(account.name)
    }
  }, [account])

  useEffect(() => {
    if (loggedInUser?.username) {
      getAccount(loggedInUser?.username)
        .then(setAccount)
        .catch((error: any) => {
          console.error('getAccount', error)
          setErrorMessage('Error fetching account settings. Please reload the page to try again.')
        })
    }
  }, [loggedInUser])

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
      <Card sx={{ height: '100%', maxHeight: '80vh', overflowY: 'scroll', width: '100%' }} variant="outlined">
        <Stack padding={2} spacing={2}>
          <Typography component="div" variant="h4">
            Account Settings
          </Typography>
          <Divider />
          <label>
            <TextField
              disabled={account === undefined || isSaving}
              fullWidth
              label="From name"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setName(event.target.value)}
              value={name}
            />
          </label>
          {account !== undefined && (
            <AddressLine addresses={forwardAddresses} label="Forward targets:" setAddresses={setForwardAddresses} />
          )}
          <Grid container>
            <Grid item order={{ md: 1, xs: 2 }} xs></Grid>
            <Grid item md={3} order={{ md: 2, xs: 1 }} padding={2} xs={12}>
              {loggedInUser?.username && account && (
                <Button
                  disabled={isSaving}
                  fullWidth
                  onClick={() => loggedInUser?.username && account && handleSaveClick(loggedInUser.username, account)}
                  startIcon={isSaving ? <CircularProgress size={14} /> : <SaveIcon />}
                  variant="contained"
                >
                  Save
                </Button>
              )}
            </Grid>
            <Grid item order={{ xs: 3 }} xs></Grid>
          </Grid>
        </Stack>
      </Card>
      <Snackbar autoHideDuration={15_000} onClose={snackbarErrorClose} open={errorMessage !== undefined}>
        <Alert onClose={snackbarErrorClose} severity="error" variant="filled">
          {errorMessage}
        </Alert>
      </Snackbar>
    </>
  )
}

export default AccountSettings
