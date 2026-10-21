import { getCurrentUser } from 'aws-amplify/auth'
import { TriangleAlert } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

import { SaveButton, SettingsCard, SettingsDivider, SettingsTitle } from './elements'
import AddressLine from '@components/address-line'
import BounceSenderInput from '@components/bounce-sender-input'
import ConfirmDialog from '@components/confirm-dialog'
import ErrorSnackbar from '@components/error-snackbar'
import InstallOffer from '@components/install-offer'
import LoadingSpinner from '@components/loading-spinner'
import NotificationSettings from '@components/notification-settings'
import SpamFilterSettings, { SpamFilterSettingsHandle } from '@components/spam-filter-settings'
import { getAccount, getAllReceivedEmails, putAccount } from '@services/emails'
import { newPhraseMatches } from '@services/spam-impact'
import {
  Account,
  AuthUser,
  DEFAULT_NOTIFICATION_PREVIEW,
  DEFAULT_SPAM_FILTER,
  EmailAddress,
  EmailBatch,
  NotificationPreview,
  PhraseMatch,
  SpamFilter,
} from '@types'

const sameAddresses = (a: string[], b: string[]): boolean =>
  a.length === b.length && a.every((value, index) => value === b[index])

// Every field the Save button owns, or a change to the one it forgets leaves Save reading "Saved"
// while an edit sits unwritten on screen. notificationPreview is not among them: it saves the
// moment it is chosen, so by the time Save is offered it already matches the server.
type SaveableFields = Pick<Account, 'bounceSenders' | 'forwardTargets' | 'name'> & { spamFilter: SpamFilter }

// An account saved before the spam filter existed has none; it is filtered at the defaults.
const savedSpamFilter = (account: Account): SpamFilter => account.spamFilter ?? DEFAULT_SPAM_FILTER

const sameSpamFilter = (a: SpamFilter, b: SpamFilter): boolean =>
  a.sensitivity === b.sensitivity &&
  sameAddresses(a.blockPhrases, b.blockPhrases) &&
  sameAddresses(a.trustedSenders, b.trustedSenders)

const hasChanges = (account: Account, updated: SaveableFields): boolean =>
  account.name !== updated.name ||
  !sameAddresses(account.forwardTargets, updated.forwardTargets) ||
  !sameAddresses(account.bounceSenders, updated.bounceSenders) ||
  !sameSpamFilter(savedSpamFilter(account), updated.spamFilter)

// The impact check's dialog lists this many subjects per phrase; the count says how many in all.
const SUBJECTS_SHOWN = 3

const plural = (count: number, one: string, many: string): string => (count === 1 ? one : many)

const ImpactCheck = ({ matches }: { matches: PhraseMatch[] }): React.ReactNode => (
  <>
    <p>
      {matches.length === 1
        ? 'This new phrase matches emails already in your Inbox. Those emails stay put, but new mail containing it will go to Spam.'
        : 'These new phrases match emails already in your Inbox. Those emails stay put, but new mail containing them will go to Spam.'}
    </p>
    <ul className="mt-3 flex flex-col gap-2.5" style={{ listStyle: 'none', padding: 0 }}>
      {matches.map((match) => (
        <li
          key={match.phrase}
          style={{
            background: 'var(--paper-surface)',
            border: '1px solid var(--paper-border)',
            borderRadius: '10px',
            padding: '10px 12px',
          }}
        >
          <div className="flex items-start gap-1.5" style={{ color: 'var(--text-paper)' }}>
            <TriangleAlert
              aria-hidden="true"
              size={14}
              strokeWidth={2}
              style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '3px' }}
            />
            <span style={{ overflowWrap: 'anywhere' }}>
              {`“${match.phrase}” matches ${match.subjects.length} Inbox ${plural(match.subjects.length, 'subject', 'subjects')}`}
            </span>
          </div>
          <ul className="mt-0.5" style={{ listStyle: 'disc', marginLeft: '20px', paddingLeft: '16px' }}>
            {match.subjects.slice(0, SUBJECTS_SHOWN).map((subject, index) => (
              <li key={index} style={{ overflowWrap: 'anywhere' }}>
                {subject}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
    <p className="mt-3 text-xs">
      We checked your Inbox subjects only. New mail with these phrases in the body will go to Spam too.
    </p>
  </>
)

const AccountSettings = (): React.ReactNode => {
  const [account, setAccount] = useState<Account | undefined>()
  const [bounceSenders, setBounceSenders] = useState<string[]>([])
  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  const [forwardAddresses, setForwardAddresses] = useState<EmailAddress[]>([])
  // New block phrases waiting on the owner's answer to the impact check, with the filter to save.
  const [impactCheck, setImpactCheck] = useState<{ matches: PhraseMatch[]; spamFilter: SpamFilter } | undefined>()
  // Checked against new block phrases on Save. Empty when it has not loaded or could not be: Save
  // then goes ahead without the check rather than be held hostage to a list it only advises from.
  const [inboxEmails, setInboxEmails] = useState<EmailBatch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  // Both saves send the whole item, and neither re-reads first. The preference save carries the
  // account as this page loaded it, so a Save started while one is in flight can land first and be
  // overwritten by the older name, forward targets and bounce rules -- with the new ones still on
  // screen. The form's Save is held until the preference save has landed.
  const [isSavingPreview, setIsSavingPreview] = useState(false)
  const [loggedInUser, setLoggedInUser] = useState<AuthUser | undefined>()
  const [name, setName] = useState('')
  const [notificationPreview, setNotificationPreview] = useState<NotificationPreview>(DEFAULT_NOTIFICATION_PREVIEW)
  // Said only after a save this page made. A successful save otherwise reported nothing at all,
  // which is indistinguishable from a save that never ran.
  const [saveStatus, setSaveStatus] = useState('')
  const [spamFilter, setSpamFilter] = useState<SpamFilter>(DEFAULT_SPAM_FILTER)
  const spamFilterRef = useRef<SpamFilterSettingsHandle>(null)
  // The tier the server last acknowledged. A failed save reverts to what is actually in effect,
  // which is not necessarily the tier this page loaded with -- an earlier choice may have saved.
  // At most one save is in flight at a time, because the radio group is disabled while one is.
  const savedPreview = useRef<NotificationPreview | undefined>(undefined)

  const forwardTargets = forwardAddresses.map((address) => address.address)
  const hasUnsavedChanges =
    account !== undefined && hasChanges(account, { bounceSenders, forwardTargets, name, spamFilter })

  // Saved on change, not on Save: the on/off button in the same section applies instantly, the
  // section says the choice follows the account, and the worked example redraws to match. A
  // reader who picks the quietest tier and leaves must not be left on the most revealing one.
  const handlePreviewChange = async (
    accountId: string,
    account: Account,
    preview: NotificationPreview,
  ): Promise<void> => {
    setNotificationPreview(preview)
    setIsSavingPreview(true)
    try {
      await putAccount(accountId, { ...account, id: accountId, notificationPreview: preview })
      savedPreview.current = preview
    } catch (error: any) {
      console.error('handlePreviewChange', { accountId, error, preview })
      setNotificationPreview(savedPreview.current ?? account.notificationPreview)
      setErrorMessage("We couldn't save that. Your last saved choice is still in effect.")
    }
    setIsSavingPreview(false)
  }

  const saveSettings = async (accountId: string, account: Account, nextSpamFilter: SpamFilter): Promise<void> => {
    setIsSaving(true)
    try {
      const updatedAccount: Account = {
        bounceSenders,
        forwardTargets,
        id: accountId,
        name,
        notificationPreview,
        spamFilter: nextSpamFilter,
      }
      // PUT sends every field this screen owns, so there is nothing to diff. The button is only
      // offered when there is something to write, so there is nothing to skip either -- it used to
      // skip silently here, which is how pressing Save could do and say nothing at all.
      await putAccount(accountId, updatedAccount)
      setAccount(updatedAccount)
      setSaveStatus('Settings saved.')
    } catch (error: any) {
      console.error('handleSaveClick', { account, accountId, bounceSenders, error, forwardAddresses })
      // Put the screen back where the server is, every field of it: nothing was written, so
      // leaving an edit on screen while saying the old value is in effect would be a lie the
      // reader cannot see. notificationPreview is not among them -- it saves on change, so the
      // value on screen is the one the server acknowledged.
      setBounceSenders(account.bounceSenders)
      setForwardAddresses(account.forwardTargets.map((address) => ({ address, name: '' })))
      setName(account.name)
      setSpamFilter(savedSpamFilter(account))
      setSaveStatus('')
      setErrorMessage("We couldn't save your settings. Nothing changed — your last saved settings are still in effect.")
    }
    setIsSaving(false)
  }

  const handleSaveClick = (accountId: string, account: Account): void => {
    // A phrase still sitting in its box is one the owner can see, so Save adds it first. One that
    // cannot be added stops the save, with its reason shown and its box focused.
    const nextSpamFilter = spamFilterRef.current ? spamFilterRef.current.commitDrafts() : spamFilter
    if (nextSpamFilter === undefined) {
      return
    }
    // Warn, then allow: new phrases that would have caught Inbox mail are shown before they save.
    const matches = newPhraseMatches(savedSpamFilter(account).blockPhrases, nextSpamFilter.blockPhrases, inboxEmails)
    if (matches.length > 0) {
      setImpactCheck({ matches, spamFilter: nextSpamFilter })
      return
    }
    void saveSettings(accountId, account, nextSpamFilter)
  }

  const handleSaveAnyway = (accountId: string, account: Account): void => {
    const nextSpamFilter = impactCheck?.spamFilter ?? spamFilter
    setImpactCheck(undefined)
    void saveSettings(accountId, account, nextSpamFilter)
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

        {account !== undefined && <SettingsDivider />}

        {account !== undefined && (
          <SpamFilterSettings disabled={isSaving} onChange={setSpamFilter} ref={spamFilterRef} value={spamFilter} />
        )}

        {account !== undefined && <SettingsDivider />}

        {account !== undefined && loggedInUser?.username && (
          <NotificationSettings
            accountId={loggedInUser.username}
            disabled={isSaving}
            onPreviewChange={(preview: NotificationPreview) =>
              handlePreviewChange(loggedInUser.username, account, preview)
            }
            preview={notificationPreview}
          />
        )}

        {account !== undefined && <SettingsDivider />}

        {/* The install offer's permanent home (not dismissible here, unlike the sign-in
            card). It renders its own heading and returns null when the browser can't install
            or the app is already installed — so it never leaves an empty labelled section. */}
        <InstallOffer surface="paper" />

        {loggedInUser?.username && account && (
          <div className="flex flex-col items-end gap-1 pt-2">
            <div className="flex w-full flex-wrap items-center justify-between gap-3">
              {/* The other half of the "Saved automatically" line on the Notifications section.
                  A reader who changed only a notification setting arrives at a button reading
                  "Saved" and needs to be told why, not left to press it and watch nothing happen. */}
              <p
                className="text-xs"
                style={{
                  color: 'var(--text-paper-muted)',
                  fontFamily: 'Outfit, sans-serif',
                  margin: 0,
                  maxWidth: '26rem',
                }}
              >
                Notifications save as soon as you change them. Everything else waits for Save.
              </p>
              <SaveButton
                hasUnsavedChanges={hasUnsavedChanges}
                // The notification tier's save sends the whole item, carrying the account as this
                // page loaded it, so a Save racing it can land first and be overwritten by the
                // older name. Save waits for it, and says so.
                isSaving={isSaving || isSavingPreview}
                onClick={() => loggedInUser?.username && account && handleSaveClick(loggedInUser.username, account)}
              />
            </div>
            {/* Mounted whether or not there is anything to say: a live region created in the same
                commit as its content is reliably not announced. The height is reserved so the
                confirmation does not shove the page as it appears. */}
            <p
              className="text-sm"
              role="status"
              style={{
                color: 'var(--text-paper)',
                fontFamily: 'Outfit, sans-serif',
                margin: 0,
                minHeight: '1.25rem',
              }}
            >
              {hasUnsavedChanges ? '' : saveStatus}
            </p>
            {/* Go back returns focus to Save (ConfirmDialog's trigger) and saves nothing. */}
            <ConfirmDialog
              cancelLabel="Go back"
              confirmLabel="Save anyway"
              onCancel={() => setImpactCheck(undefined)}
              onConfirm={() => handleSaveAnyway(loggedInUser.username, account)}
              open={impactCheck !== undefined}
              scrollable
              title="Check your new block phrases"
            >
              {impactCheck && <ImpactCheck matches={impactCheck.matches} />}
            </ConfirmDialog>
          </div>
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
      setNotificationPreview(account.notificationPreview)
      setSpamFilter(savedSpamFilter(account))

      setIsLoading(false)
    }
  }, [account])

  useEffect(() => {
    if (loggedInUser?.username) {
      const username = loggedInUser.username
      getAccount(username)
        .then((loaded: Account) => {
          setAccount(loaded)
          // Only the Save-time impact check needs it, so a failure here is logged and nothing more.
          getAllReceivedEmails(username, 'inbox')
            .then(setInboxEmails)
            .catch((error: any) => console.error('getAllReceivedEmails', { error, username }))
        })
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
