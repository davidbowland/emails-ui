import { getCurrentUser } from 'aws-amplify/auth'
import React, { useEffect, useRef, useState } from 'react'

import { SaveButton, SettingsCard, SettingsDivider, SettingsTitle } from './elements'
import AddressLine from '@components/address-line'
import BounceSenderInput from '@components/bounce-sender-input'
import ConfirmDialog from '@components/confirm-dialog'
import ErrorSnackbar from '@components/error-snackbar'
import InstallOffer from '@components/install-offer'
import LoadingSpinner from '@components/loading-spinner'
import NotificationSettings from '@components/notification-settings'
import { ImpactFootnote, isSpamImpactResponse, PhraseImpact, PhraseImpactFailed } from '@components/phrase-impact'
import SpamFilterSettings, { SpamFilterSettingsHandle } from '@components/spam-filter-settings'
import { getAccount, postSpamImpact, putAccount } from '@services/emails'
import {
  Account,
  AuthUser,
  DEFAULT_NOTIFICATION_PREVIEW,
  DEFAULT_SPAM_FILTER,
  EmailAddress,
  NotificationPreview,
  SpamFilter,
  SpamImpactResponse,
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

// New block phrases waiting on the owner's answer, with the filter to save. 'failed' is a check
// that errored or came back malformed; the owner may still save.
interface ImpactCheck {
  phrases: string[]
  result: SpamImpactResponse | 'failed'
  spamFilter: SpamFilter
}

const hasMatch = (check: ImpactCheck, folder: 'inbox' | 'spam'): boolean =>
  check.result !== 'failed' && check.result.phrases.some((impact) => impact[folder].count > 0)

// How many of the new phrases match at least one email in the folder.
const countMatching = (check: ImpactCheck, folder: 'inbox' | 'spam'): number =>
  check.result === 'failed' ? 0 : check.result.phrases.filter((impact) => impact[folder].count > 0).length

// Whether the owner needs to see the result before the phrases save.
const needsReview = (check: ImpactCheck): boolean =>
  check.result === 'failed' || check.result.inboxIncomplete || hasMatch(check, 'inbox') || hasMatch(check, 'spam')

// The dialog's description, so a screen reader reads the lead when focus lands on Go back.
const IMPACT_LEAD_ID = 'settings-impact-lead'

// Tried in order; the first row that applies sets the lead.
const impactLead = (check: ImpactCheck): string => {
  const several = check.phrases.length > 1
  if (hasMatch(check, 'inbox')) {
    // Plural only when more than one of the phrases is the one matching the Inbox.
    return countMatching(check, 'inbox') > 1
      ? 'These new phrases match emails already in your Inbox. Those emails stay put, but new mail containing them will go to Spam, unless it comes from a trusted sender.'
      : 'This new phrase matches emails already in your Inbox. Those emails stay put, but new mail containing it will go to Spam, unless it comes from a trusted sender.'
  }
  if (check.result === 'failed') {
    return several
      ? "We couldn't check your new phrases against your mail. You can save them anyway."
      : "We couldn't check your new phrase against your mail. You can save it anyway."
  }
  if (check.result.inboxIncomplete) {
    return several
      ? "We couldn't check all of your Inbox. Your new phrases may match emails we didn't check."
      : "We couldn't check all of your Inbox. Your new phrase may match emails we didn't check."
  }
  // Plural only when more than one of the phrases is the one matching Spam.
  return countMatching(check, 'spam') > 1
    ? "Here's the mail in Spam that your new phrases match."
    : "Here's the mail in Spam that your new phrase matches."
}

// Matches in Spam alone are information, not a warning, so the button does not say "anyway".
const impactConfirmLabel = (check: ImpactCheck): string =>
  check.result !== 'failed' && !check.result.inboxIncomplete && !hasMatch(check, 'inbox') ? 'Save' : 'Save anyway'

const ImpactDialogBody = ({ check, leadId }: { check: ImpactCheck; leadId: string }): React.ReactNode => {
  const { result } = check
  return (
    <>
      <p id={leadId}>{impactLead(check)}</p>
      <ul className="mt-3 flex flex-col gap-2.5" style={{ listStyle: 'none', padding: 0 }}>
        {check.phrases.map((phrase, index) => (
          <li
            key={`${index}-${phrase}`}
            style={{
              background: 'var(--paper-surface)',
              border: '1px solid var(--paper-border)',
              borderRadius: '10px',
              padding: '10px 12px',
            }}
          >
            <span className="block" style={{ color: 'var(--text-paper)', overflowWrap: 'anywhere' }}>
              {`“${phrase}”`}
            </span>
            {result === 'failed' ? (
              <PhraseImpactFailed id={`settings-impact-${index}`} />
            ) : (
              <PhraseImpact
                checked={result.checked}
                id={`settings-impact-${index}`}
                impact={result.phrases[index]}
                inboxIncomplete={result.inboxIncomplete}
              />
            )}
          </li>
        ))}
      </ul>
      {result !== 'failed' && (
        <div className="mt-3">
          <ImpactFootnote checked={result.checked} mode="save" phraseCount={check.phrases.length} />
        </div>
      )}
    </>
  )
}

const AccountSettings = (): React.ReactNode => {
  const [account, setAccount] = useState<Account | undefined>()
  const [bounceSenders, setBounceSenders] = useState<string[]>([])
  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  const [forwardAddresses, setForwardAddresses] = useState<EmailAddress[]>([])
  // The check's answer for new block phrases, held while the owner decides whether to save them.
  const [impactCheck, setImpactCheck] = useState<ImpactCheck | undefined>()
  // True while the new phrases are checked against mail on Save.
  const [isChecking, setIsChecking] = useState(false)
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

  const handleSaveClick = async (accountId: string, account: Account): Promise<void> => {
    // A phrase still sitting in its box is one the owner can see, so Save adds it first. One that
    // cannot be added stops the save, with its reason shown and its box focused.
    const nextSpamFilter = spamFilterRef.current ? spamFilterRef.current.commitDrafts() : spamFilter
    if (nextSpamFilter === undefined) {
      return
    }
    const saved = savedSpamFilter(account).blockPhrases
    const newPhrases = nextSpamFilter.blockPhrases.filter((phrase) => !saved.includes(phrase))
    if (newPhrases.length === 0) {
      void saveSettings(accountId, account, nextSpamFilter)
      return
    }
    // Warn, then allow: what the new phrases catch is shown before they save. A check that cannot
    // be made is reported in the same dialog, because the owner may still save.
    setIsChecking(true)
    const check: ImpactCheck = await postSpamImpact(accountId, newPhrases)
      .then((response: unknown) => ({
        phrases: newPhrases,
        result: isSpamImpactResponse(response, newPhrases.length) ? response : ('failed' as const),
        spamFilter: nextSpamFilter,
      }))
      .catch((error: any) => {
        console.error('postSpamImpact', { accountId, error })
        return { phrases: newPhrases, result: 'failed' as const, spamFilter: nextSpamFilter }
      })
    setIsChecking(false)
    if (needsReview(check)) {
      setImpactCheck(check)
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
            disabled={account === undefined || isSaving || isChecking}
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
              <AddressLine
                addresses={forwardAddresses}
                disabled={isSaving || isChecking}
                label="To:"
                setAddresses={setForwardAddresses}
              />
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
                disabled={isSaving || isChecking}
                label="Reject emails from:"
                rules={bounceSenders}
                setRules={setBounceSenders}
              />
            </div>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-paper-muted)', fontFamily: 'Outfit, sans-serif' }}>
              Block senders by address (user@domain.com), domain (@domain.com), or enter * to block everyone. Blocked
              emails won&apos;t be forwarded.
            </p>
          </section>
        )}

        {account !== undefined && <SettingsDivider />}

        {account !== undefined && (
          <SpamFilterSettings
            disabled={isSaving || isChecking}
            onChange={setSpamFilter}
            ref={spamFilterRef}
            value={spamFilter}
          />
        )}

        {account !== undefined && <SettingsDivider />}

        {account !== undefined && loggedInUser?.username && (
          <NotificationSettings
            accountId={loggedInUser.username}
            disabled={isSaving || isChecking}
            onPreviewChange={(preview: NotificationPreview) =>
              handlePreviewChange(loggedInUser.username, account, preview)
            }
            preview={notificationPreview}
          />
        )}

        {account !== undefined && <SettingsDivider />}

        {/* The install offer's permanent home (not dismissible here, unlike the sign-in
            card). It renders its own heading and returns null when the browser can't install
            or the app is already installed — so it never leaves an empty labeled section. */}
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
                isChecking={isChecking}
                isSaving={isSaving || isSavingPreview}
                onClick={() =>
                  loggedInUser?.username && account && void handleSaveClick(loggedInUser.username, account)
                }
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
              {isChecking ? 'Checking your mail…' : hasUnsavedChanges ? '' : saveStatus}
            </p>
            {/* Go back returns focus to Save (ConfirmDialog's trigger) and saves nothing. */}
            <ConfirmDialog
              cancelLabel="Go back"
              confirmLabel={impactCheck ? impactConfirmLabel(impactCheck) : 'Save anyway'}
              describedBy={IMPACT_LEAD_ID}
              onCancel={() => setImpactCheck(undefined)}
              onConfirm={() => handleSaveAnyway(loggedInUser.username, account)}
              open={impactCheck !== undefined}
              scrollable
              title="Check your new block phrases"
            >
              {impactCheck && <ImpactDialogBody check={impactCheck} leadId={IMPACT_LEAD_ID} />}
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
