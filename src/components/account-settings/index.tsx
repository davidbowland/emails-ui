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
    <div className="mx-auto max-w-2xl px-6 py-10">
      <SettingsTitle />
      <p className="mt-1 mb-8 text-sm" style={{ color: 'var(--text-paper-muted)', fontFamily: 'Outfit, sans-serif' }}>
        Manage your email account preferences
      </p>

      <div className="flex flex-col gap-8">
        {/* Display name */}
        <section>
          <div
            className="mb-2 text-xs font-semibold uppercase"
            style={{ color: 'var(--text-paper-muted)', fontFamily: 'Outfit, sans-serif', letterSpacing: '0.1em' }}
          >
            Display name
          </div>
          <input
            aria-label="From name"
            className="w-full rounded-md px-3 py-2.5 outline-none"
            disabled={account === undefined || isSaving}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setName(event.target.value)}
            placeholder="Your display name"
            style={{
              background: 'var(--paper-surface)',
              border: '1px solid var(--paper-border)',
              color: 'var(--text-paper)',
              fontFamily: 'Outfit, sans-serif',
              fontSize: '14px',
            }}
            value={name}
          />
        </section>

        <SettingsDivider />

        {/* Forward targets */}
        {account !== undefined && (
          <section>
            <div
              className="mb-1 text-xs font-semibold uppercase"
              style={{ color: 'var(--text-paper-muted)', fontFamily: 'Outfit, sans-serif', letterSpacing: '0.1em' }}
            >
              Forward emails to
            </div>
            <p className="mb-2 text-xs" style={{ color: 'var(--text-paper-muted)', fontFamily: 'Outfit, sans-serif' }}>
              Received emails will be forwarded to these addresses.
            </p>
            <div className="rounded-md" style={{ border: '1px solid var(--paper-border)' }}>
              <AddressLine addresses={forwardAddresses} label="To:" setAddresses={setForwardAddresses} />
            </div>
          </section>
        )}

        {account !== undefined && <SettingsDivider />}

        {/* Bounce rules */}
        {account !== undefined && (
          <section>
            <div
              className="mb-1 text-xs font-semibold uppercase"
              style={{ color: 'var(--text-paper-muted)', fontFamily: 'Outfit, sans-serif', letterSpacing: '0.1em' }}
            >
              Bounce rules
            </div>
            <div className="rounded-md" style={{ border: '1px solid var(--paper-border)' }}>
              <BounceSenderInput
                label="Bounce emails from senders:"
                rules={bounceSenders}
                setRules={setBounceSenders}
              />
            </div>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-paper-muted)', fontFamily: 'Outfit, sans-serif' }}>
              Bounce senders can be email addresses (user@domain.com), domains (@domain.com), or * to bounce all
              senders. Automatically bounced emails will <b>NOT</b> be forwarded.
            </p>
          </section>
        )}

        <div className="flex justify-end pt-2">
          {loggedInUser?.username && account && (
            <SaveButton
              disabled={isSaving}
              isSaving={isSaving}
              onClick={() => loggedInUser?.username && account && handleSaveClick(loggedInUser.username, account)}
            />
          )}
        </div>
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
