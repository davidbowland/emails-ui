import { getCurrentUser } from 'aws-amplify/auth'
import React, { useEffect, useState } from 'react'

import { SaveButton, SettingsCard, SettingsDivider, SettingsTitle } from './elements'
import AddressLine from '@components/address-line'
import BounceSenderInput from '@components/bounce-sender-input'
import ErrorSnackbar from '@components/error-snackbar'
import InstallOffer from '@components/install-offer'
import LoadingSpinner from '@components/loading-spinner'
import { getAccount, putAccount } from '@services/emails'
import { Account, AuthUser, EmailAddress } from '@types'

const sameAddresses = (a: string[], b: string[]): boolean =>
  a.length === b.length && a.every((value, index) => value === b[index])

const hasChanges = (account: Account, updated: Account): boolean =>
  account.name !== updated.name ||
  !sameAddresses(account.forwardTargets, updated.forwardTargets) ||
  !sameAddresses(account.bounceSenders, updated.bounceSenders)

const AccountSettings = (): React.ReactNode => {
  const [account, setAccount] = useState<Account | undefined>()
  const [bounceSenders, setBounceSenders] = useState<string[]>([])
  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  const [forwardAddresses, setForwardAddresses] = useState<EmailAddress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loggedInUser, setLoggedInUser] = useState<AuthUser | undefined>()
  const [name, setName] = useState('')

  const handleSaveClick = async (accountId: string, account: Account): Promise<void> => {
    setIsSaving(true)
    try {
      const forwardTargets = forwardAddresses.map((address) => address.address)
      const updatedAccount: Account = { bounceSenders, forwardTargets, id: accountId, name }
      // PUT sends every field this screen owns, so there is nothing to diff.
      if (hasChanges(account, updatedAccount)) {
        await putAccount(accountId, updatedAccount)
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
              We&apos;ll forward incoming emails to these addresses.
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
              <BounceSenderInput label="Reject emails from:" rules={bounceSenders} setRules={setBounceSenders} />
            </div>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-paper-muted)', fontFamily: 'Outfit, sans-serif' }}>
              Block senders by address (user@domain.com), domain (@domain.com), or enter * to block everyone. Blocked
              emails won&apos;t be forwarded.
            </p>
          </section>
        )}

        {/* The install offer's permanent home (not dismissible here, unlike the sign-in
            card). It renders its own heading and returns null when the browser can't install
            or the app is already installed — so it never leaves an empty labelled section. */}
        <InstallOffer surface="paper" />

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
          setErrorMessage("Couldn't load your settings. Reload the page to try again.")
        })
    }
  }, [loggedInUser])

  useEffect(() => {
    getCurrentUser()
      .then(setLoggedInUser)
      .catch((error: any) => {
        console.error('currentAuthenticatedUser', { error })
        setErrorMessage("We couldn't sign you in. Reload the page to try again.")
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
