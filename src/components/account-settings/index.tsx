import { Auth } from 'aws-amplify'
import jsonpatch from 'fast-json-patch'
import React, { useEffect, useState } from 'react'

import { SaveButton, SettingsCard, SettingsDivider, SettingsTitle } from './elements'
import AddressLine from '@components/address-line'
import BounceSenderInput from '@components/bounce-sender-input'
import ErrorSnackbar from '@components/error-snackbar'
import LoadingSpinner from '@components/loading-spinner'
import { getAccount, patchAccount } from '@services/emails'
import { Account, AmplifyUser, EmailAddress } from '@types'

const AccountSettings = (): React.ReactNode => {
  const [account, setAccount] = useState<Account | undefined>()
  const [bounceSenders, setBounceSenders] = useState<string[]>([])
  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  const [forwardAddresses, setForwardAddresses] = useState<EmailAddress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loggedInUser, setLoggedInUser] = useState<AmplifyUser | undefined>()
  const [name, setName] = useState('')

  const handleSaveClick = async (accountId: string, account: Account): Promise<void> => {
    setIsSaving(true)
    try {
      const forwardTargets = forwardAddresses.map((address) => address.address)
      const updatedAccount: Account = { bounceSenders, forwardTargets, id: accountId, name }
      const jsonPatchOperations = jsonpatch.compare(account, updatedAccount, true)
      if (jsonPatchOperations.length > 0) {
        await patchAccount(accountId, jsonPatchOperations)
        setAccount(updatedAccount)
      }
    } catch (error: any) {
      console.error('handleSaveClick', { account, accountId, bounceSenders, error, forwardAddresses })
      setErrorMessage('Error saving account settings. Please refresh the page and try again.')
    }
    setIsSaving(false)
  }

  const renderSettings = (): React.ReactNode => (
    <div className="flex flex-col gap-4 p-4">
      <SettingsTitle />
      <SettingsDivider />
      <label>
        <input
          aria-label="From name"
          className="w-full rounded-md px-3 py-2 outline-none"
          disabled={account === undefined || isSaving}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => setName(event.target.value)}
          placeholder="From name"
          style={{
            background: 'var(--paper-surface)',
            border: '1px solid var(--paper-border)',
            color: 'var(--text-paper)',
            fontFamily: 'Outfit, sans-serif',
          }}
          value={name}
        />
      </label>
      {account !== undefined && (
        <AddressLine addresses={forwardAddresses} label="Forward targets:" setAddresses={setForwardAddresses} />
      )}
      {account !== undefined && (
        <>
          <BounceSenderInput label="Bounce emails from senders:" rules={bounceSenders} setRules={setBounceSenders} />
          <p className="text-sm text-gray-500">
            Bounce senders can be email addresses (user@domain.com), domains (@domain.com), or * to bounce all senders.
            Automatically bounced emails will <b>NOT</b> be forwarded.
          </p>
        </>
      )}
      <div className="flex justify-end p-2">
        {loggedInUser?.username && account && (
          <SaveButton
            disabled={isSaving}
            isSaving={isSaving}
            onClick={() => loggedInUser?.username && account && handleSaveClick(loggedInUser.username, account)}
          />
        )}
      </div>
    </div>
  )

  const snackbarErrorClose = (): void => {
    setErrorMessage(undefined)
  }

  useEffect(() => {
    if (account) {
      setBounceSenders(account.bounceSenders)
      const forwardTargets = account.forwardTargets.map((address) => ({ address, name: '' }))
      setForwardAddresses(forwardTargets)
      setName(account.name)

      setIsLoading(false)
    }
  }, [account])

  useEffect(() => {
    if (loggedInUser?.username) {
      getAccount(loggedInUser?.username)
        .then(setAccount)
        .catch((error: any) => {
          console.error('getAccount', { error, username: loggedInUser?.username })
          setErrorMessage('Error fetching account settings. Please reload the page to try again.')
        })
    }
  }, [loggedInUser])

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
      <SettingsCard>{isLoading ? <LoadingSpinner /> : renderSettings()}</SettingsCard>
      <ErrorSnackbar message={errorMessage} onClose={snackbarErrorClose} />
    </>
  )
}

export default AccountSettings
