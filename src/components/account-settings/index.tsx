import { getCurrentUser } from 'aws-amplify/auth'
import React, { useEffect, useId, useRef, useState } from 'react'

import { SettingsCard, SettingsTitle, WAIT_FOR_SAVE_REASON } from './elements'
import { ImpactCheck, ImpactDialog, needsReview } from './impact-dialog'
import {
  changedSections,
  commitDrafts,
  DraftKey,
  Drafts,
  draftLine,
  DRAFT_ORDER,
  EMPTY_DRAFTS,
  ENTRY_NOUN,
  Fields,
  joinSections,
  SECTION_LABEL,
  SectionKey,
} from './save-state'
import AddressLine, { forwardAddressError } from '@components/address-line'
import BounceSenderInput, { alreadyListed, bounceRuleError } from '@components/bounce-sender-input'
import InstallOffer from '@components/install-offer'
import { useLeaveGuardRegistration } from '@components/leave-guard'
import NotificationSettings from '@components/notification-settings'
import { isSpamImpactResponse } from '@components/phrase-impact'
import SpamFilterSettings, { SpamDraftKey } from '@components/spam-filter-settings'
import Button from '@components/ui/button'
import Divider from '@components/ui/divider'
import FieldError from '@components/ui/field-error'
import FormSection from '@components/ui/form-section'
import PendingHint from '@components/ui/pending-hint'
import Snackbar from '@components/ui/snackbar'
import Spinner from '@components/ui/spinner'
import TextInput from '@components/ui/text-input'
import UnsavedBar, { UnsavedBarProps } from '@components/ui/unsaved-bar'
import { getAccount, postSpamImpact, putAccount } from '@services/emails'
import { Account, AuthUser, DEFAULT_NOTIFICATION_PREVIEW, DEFAULT_SPAM_FILTER, NotificationPreview } from '@types'

// 'waiting' is a Save held until an in-flight notification save lands; 'checking' runs the new
// block phrases against the owner's mail; 'saving' is the PUT. Those three are the busy phases.
type BarPhase = 'idle' | 'waiting' | 'checking' | 'saving' | 'saved' | 'failed' | 'discarded'

interface BarState {
  // Why Save stopped: a typed entry it could not add.
  note?: string
  phase: BarPhase
  savedSections?: SectionKey[]
}

interface UndoSnapshot {
  drafts: Drafts
  fields: Fields
  sections: SectionKey[]
}

// The impact dialog's state: 'checking' until the result arrives, with the fields Save will write.
interface ImpactState {
  check: ImpactCheck | 'checking'
  fields: Fields
  phrases: string[]
}

const BUSY_PHASES: BarPhase[] = ['waiting', 'checking', 'saving']
const SAVED_BAR_MS = 5000
const UNDO_MS = 8000
const PHONE_QUERY = '(max-width: 640px)'
const PENDING_HINT = 'Not added yet. Press Enter or choose Add.'
const NO_CHANGES = 'You have no changes to save.'
// Room kept under a focused field or heading: the one-row bar and the phone strip fit in 96px, and
// the full bar on a phone, stacked, in 180px.
const BAR_ROOM = 96
const STACKED_BAR_ROOM = 180

// An account saved before the spam filter existed has none; it is filtered at the defaults.
const fieldsOf = (account: Account): Fields => ({
  bounceSenders: account.bounceSenders,
  forwardTargets: account.forwardTargets,
  name: account.name,
  spamFilter: account.spamFilter ?? DEFAULT_SPAM_FILTER,
})

const sameList = (a: string[] | undefined, b: string[]): boolean =>
  a !== undefined && a.length === b.length && a.every((item, index) => item === b[index])

// What changed in a chip list, in words, or nothing when the list is the same.
const listAnnouncement = (before: string[], after: string[]): string | undefined => {
  if (after.length > before.length) {
    return `Added “${after[after.length - 1]}”. Not saved yet.`
  }
  const removed = before.find((item, index) => after[index] !== item)
  return removed === undefined ? undefined : `Removed “${removed}”. Not saved yet.`
}

const NON_TEXT_INPUTS = ['button', 'checkbox', 'color', 'file', 'radio', 'range', 'reset', 'submit']

const isTextField = (target: EventTarget | null): target is HTMLElement =>
  target instanceof HTMLInputElement ? !NON_TEXT_INPUTS.includes(target.type) : target instanceof HTMLTextAreaElement

// The words between section names: "A and B", "A, B, and C".
const separatorBefore = (index: number, count: number): string => {
  if (index === 0) return ''
  if (count === 2) return ' and '
  return index === count - 1 ? ', and ' : ', '
}

const SECTION_BUTTON_STYLE: React.CSSProperties = {
  color: '#fdfaf5',
  font: 'inherit',
  padding: '0 2px',
  textDecoration: 'underline',
  textUnderlineOffset: '3px',
  verticalAlign: 'baseline',
}

const EMPTY_FIELDS: Fields = { bounceSenders: [], forwardTargets: [], name: '', spamFilter: DEFAULT_SPAM_FILTER }

const MUTED_TEXT: React.CSSProperties = { color: 'var(--text-paper-muted)', fontFamily: 'Outfit, sans-serif' }

const AccountSettings = ({ now = Date.now }: { now?: () => number } = {}): React.ReactNode => {
  const idPrefix = useId()
  const ids = {
    bounceError: `${idPrefix}-bounce-error`,
    bounceHelper: `${idPrefix}-bounce-helper`,
    bounceHint: `${idPrefix}-bounce-hint`,
    bounceInput: `${idPrefix}-bounce-input`,
    forwardingError: `${idPrefix}-forwarding-error`,
    forwardingHelper: `${idPrefix}-forwarding-helper`,
    forwardingHint: `${idPrefix}-forwarding-hint`,
    forwardingInput: `${idPrefix}-forwarding-input`,
  }

  const [account, setAccount] = useState<Account | undefined>()
  const [announcement, setAnnouncement] = useState('')
  const [bar, setBar] = useState<BarState>({ phase: 'idle' })
  const [drafts, setDrafts] = useState<Drafts>(EMPTY_DRAFTS)
  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  const [errors, setErrors] = useState<Partial<Record<DraftKey, string>>>({})
  const [fieldFocused, setFieldFocused] = useState(false)
  const [fields, setFields] = useState<Fields>(EMPTY_FIELDS)
  // A new object per request, so the same target can be asked for twice in a row.
  const [focusRequest, setFocusRequest] = useState<{ target: 'bar' | 'h1' | 'primary' } | undefined>()
  const [impact, setImpact] = useState<ImpactState | undefined>()
  const [isPhone, setIsPhone] = useState(false)
  const [loggedInUser, setLoggedInUser] = useState<AuthUser | undefined>()
  const [notificationPreview, setNotificationPreview] = useState<NotificationPreview>(DEFAULT_NOTIFICATION_PREVIEW)
  const [savedAt, setSavedAt] = useState<number | undefined>()
  const [undo, setUndo] = useState<UndoSnapshot | undefined>()

  const barRef = useRef<HTMLDivElement>(null)
  const primaryRef = useRef<HTMLButtonElement>(null)
  // Bumped by Keep editing, so a check result that arrives after it is ignored.
  const checkRequest = useRef(0)
  // The new block phrases the owner already chose to save anyway; a retry does not ask again.
  const confirmedPhrases = useRef<string[] | undefined>(undefined)
  const formRef = useRef<HTMLDivElement>(null)
  const h1Ref = useRef<HTMLHeadingElement>(null)
  const inputs = useRef<Partial<Record<DraftKey, HTMLInputElement | null>>>({})
  // The notification save in flight, if any. Both saves send the whole item, so Save waits for it.
  const previewSave = useRef<Promise<void> | undefined>(undefined)
  // The tier the server last acknowledged; undefined until a notification save succeeds this visit.
  const savedPreview = useRef<NotificationPreview | undefined>(undefined)
  const sectionEls = useRef<Partial<Record<SectionKey, HTMLDivElement | null>>>({})
  const sectionCount = useRef(0)

  const sections = account ? changedSections(account, fields, drafts) : []
  const isBusy = BUSY_PHASES.includes(bar.phase)
  const barShown = sections.length > 0 || ['saved', 'failed', 'discarded'].includes(bar.phase)
  const guardActive = sections.length > 0 && (bar.phase === 'idle' || bar.phase === 'failed' || isBusy)
  const draftCount = DRAFT_ORDER.filter((key) => drafts[key].trim() !== '').length
  // Only while editing or saving: the saved, failed and discarded bars need their detail and buttons.
  const compact = isPhone && fieldFocused && (bar.phase === 'idle' || isBusy)

  const barRegion = (): HTMLElement | null => barRef.current?.closest<HTMLElement>('[role="region"]') ?? null
  // The bar's primary button: Save, Try again or Undo.
  const primaryButton = (): HTMLElement | null => primaryRef.current

  useLeaveGuardRegistration(guardActive ? [joinSections(sections)] : undefined, primaryButton)

  // Any edit ends the saved and discarded states and clears Save's refusal note; an edit after Discard
  // drops the Undo snapshot.
  const noteEdit = (): void => {
    setBar(({ note: _cleared, ...current }) =>
      current.phase === 'saved' || current.phase === 'discarded' ? { phase: 'idle' } : current,
    )
    setUndo(undefined)
  }

  // An edit with nothing to say clears the announcement, so the same words said again are announced
  // again. Typing in a box leaves it alone: a chip add clears its box right after saying "Added".
  const editFields = (update: (current: Fields) => Fields, message?: string): void => {
    setFields(update)
    noteEdit()
    setAnnouncement(message ?? '')
  }

  const changeDraft = (key: DraftKey, text: string): void => {
    setDrafts((current) => ({ ...current, [key]: text }))
    setErrors(({ [key]: _cleared, ...rest }) => rest)
    noteEdit()
  }

  // No message clears the key, so errors holds only boxes that are refused.
  const refuseEntry = (key: DraftKey, message: string | undefined): void =>
    setErrors(({ [key]: _cleared, ...rest }) => (message === undefined ? rest : { ...rest, [key]: message }))

  const setInput = (key: DraftKey, element: HTMLInputElement | null): void => {
    inputs.current = { ...inputs.current, [key]: element }
  }

  const setSectionEl =
    (section: SectionKey) =>
    (element: HTMLDivElement | null): void => {
      sectionEls.current = { ...sectionEls.current, [section]: element }
    }

  const focusHeading = (section: SectionKey): void => {
    const heading = sectionEls.current[section]?.querySelector<HTMLElement>('[tabindex="-1"]')
    heading?.scrollIntoView?.({ block: 'nearest' })
    heading?.focus()
  }

  // Saved on change, not on Save: the on/off button in the same section applies instantly, and a
  // reader who picks the quietest tier and leaves must not be left on the most revealing one.
  const savePreview = async (accountId: string, account: Account, preview: NotificationPreview): Promise<void> => {
    setNotificationPreview(preview)
    try {
      await putAccount(accountId, { ...account, id: accountId, notificationPreview: preview })
      savedPreview.current = preview
    } catch (error: any) {
      console.error('handlePreviewChange', { accountId, error, preview })
      setNotificationPreview(savedPreview.current ?? account.notificationPreview)
      setErrorMessage("We couldn't save that. Your last saved choice is still in effect.")
    }
  }

  const handlePreviewChange = (accountId: string, account: Account, preview: NotificationPreview): Promise<void> => {
    const saving = savePreview(accountId, account, preview)
    previewSave.current = saving
    return saving.finally(() => {
      if (previewSave.current === saving) previewSave.current = undefined
    })
  }

  const put = async (accountId: string, account: Account, next: Fields): Promise<void> => {
    setBar({ phase: 'saving' })
    // The preview the server last acknowledged, so this PUT never undoes a notification save.
    const updated: Account = {
      ...next,
      id: accountId,
      notificationPreview: savedPreview.current ?? account.notificationPreview,
    }
    try {
      await putAccount(accountId, updated)
      const saved = changedSections(account, next, EMPTY_DRAFTS)
      setAccount(updated)
      setSavedAt(now())
      confirmedPhrases.current = undefined
      setBar({ phase: 'saved', savedSections: saved })
      setAnnouncement(`Saved your changes to ${joinSections(saved)}.`)
    } catch (error: any) {
      console.error('putAccount', { accountId, error })
      // Every edit stays on screen: the bar names them and offers Try again.
      setBar({ phase: 'failed' })
      setAnnouncement("We couldn't save your changes. They're still here, so you can try again.")
    }
    setFocusRequest({ target: 'bar' })
  }

  const save = async (accountId: string, account: Account): Promise<void> => {
    const committed = commitDrafts(fields, drafts)
    if (!committed.ok) {
      const refused = Object.keys(committed.errors)
      setErrors(committed.errors)
      setBar({
        note:
          refused.length > 1
            ? 'Fix or clear the entries you typed, then save.'
            : `Fix or clear the ${ENTRY_NOUN[committed.first]} you typed, then save.`,
        phase: 'idle',
      })
      const box = inputs.current[committed.first]
      box?.scrollIntoView?.({ block: 'nearest' })
      box?.focus()
      return
    }
    const next = committed.fields
    setFields(next)
    setDrafts(EMPTY_DRAFTS)
    setErrors({})
    // Cleared first, so a result worded the same as the last one (a second failure) is announced again.
    setAnnouncement('')
    // Every draft was a repeat of a listed entry: nothing is left to write.
    if (changedSections(account, next, EMPTY_DRAFTS).length === 0) {
      setBar({ phase: 'idle' })
      return
    }
    // Tags this save. Keep editing and leaving the page move it on, and a save that has moved on
    // never reaches the PUT.
    checkRequest.current += 1
    const request = checkRequest.current
    if (previewSave.current) {
      setBar({ phase: 'waiting' })
      await previewSave.current
      if (checkRequest.current !== request) return
    }

    const savedPhrases = account.spamFilter?.blockPhrases ?? DEFAULT_SPAM_FILTER.blockPhrases
    const newPhrases = next.spamFilter.blockPhrases.filter((phrase) => !savedPhrases.includes(phrase))
    if (newPhrases.length === 0 || sameList(confirmedPhrases.current, newPhrases)) {
      await put(accountId, account, next)
      return
    }

    // Warn, then allow: what the new phrases catch is shown before they save. A check that cannot
    // be made is reported in the same dialog, because the owner may still save.
    setBar({ phase: 'checking' })
    setImpact({ check: 'checking', fields: next, phrases: newPhrases })
    const result: ImpactCheck['result'] = await postSpamImpact(accountId, newPhrases)
      .then((response: unknown) =>
        isSpamImpactResponse(response, newPhrases.length) ? response : ('checkFailed' as const),
      )
      .catch((error: any) => {
        console.error('postSpamImpact', { accountId, error })
        return 'checkFailed' as const
      })
    // Keep editing was pressed while the check ran.
    if (checkRequest.current !== request) return
    const check: ImpactCheck = { phrases: newPhrases, result, spamFilter: next.spamFilter }
    if (needsReview(check)) {
      setImpact({ check, fields: next, phrases: newPhrases })
      return
    }
    setImpact(undefined)
    setAnnouncement('No matches in the emails we checked. Saving…')
    await put(accountId, account, next)
  }

  const requestSave = (): void => {
    if (loggedInUser?.username && account) void save(loggedInUser.username, account)
  }

  const keepEditing = (): void => {
    checkRequest.current += 1
    setImpact(undefined)
    setBar({ phase: 'idle' })
    setAnnouncement('Nothing saved. Your changes are still here.')
  }

  const saveAnyway = (): void => {
    if (!impact || !loggedInUser?.username || !account) return
    confirmedPhrases.current = impact.phrases
    setImpact(undefined)
    void put(loggedInUser.username, account, impact.fields)
  }

  const discard = (): void => {
    if (!account) return
    confirmedPhrases.current = undefined
    setUndo({ drafts, fields, sections })
    setFields(fieldsOf(account))
    setDrafts(EMPTY_DRAFTS)
    setErrors({})
    setBar({ phase: 'discarded' })
    setAnnouncement('Discarded your changes. You can undo this for 8 seconds.')
    setFocusRequest({ target: 'primary' })
  }

  const restore = (): void => {
    if (!undo) return
    setFields(undo.fields)
    setDrafts(undo.drafts)
    setUndo(undefined)
    setBar({ phase: 'idle' })
    setAnnouncement('Your changes are back.')
    setFocusRequest({ target: 'primary' })
  }

  // Read by the window keydown listener, which is added once.
  const shortcut = useRef<(event: KeyboardEvent) => void>(() => undefined)
  shortcut.current = (event: KeyboardEvent): void => {
    if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 's' || !barShown) return
    event.preventDefault()
    // A dialog (the impact check or the leave guard) holds focus while open.
    const inDialog = event.target instanceof Element && event.target.closest('[role="dialog"]') !== null
    if (impact || inDialog) return
    if ((bar.phase === 'idle' && sections.length > 0) || bar.phase === 'failed') requestSave()
  }

  const dirtyTitle = (
    <>
      Not saved yet:{' '}
      {sections.map((section, index) => (
        <React.Fragment key={section}>
          {separatorBefore(index, sections.length)}
          <Button onClick={() => focusHeading(section)} style={SECTION_BUTTON_STYLE} variant="shell">
            {SECTION_LABEL[section]}
          </Button>
        </React.Fragment>
      ))}
    </>
  )

  // Shown only while a box is still refused.
  const refusalNote = Object.values(errors).some(Boolean) ? bar.note : undefined

  const barProps = (): Omit<UnsavedBarProps, 'regionLabel'> => {
    const discardAction = { label: 'Discard', onPress: discard }
    switch (bar.phase) {
      case 'saved':
        return { phase: 'saved', title: `Saved: ${joinSections(bar.savedSections ?? [])}` }
      case 'discarded':
        return {
          phase: 'discarded',
          primary: { label: 'Undo', onPress: restore },
          title: `Discarded: ${joinSections(undo?.sections ?? [])}`,
        }
      case 'failed':
        return {
          detail: `Your changes to ${joinSections(sections)} are still here. Check your connection, then try again.`,
          note: refusalNote,
          phase: 'failed',
          primary: { label: 'Try again', onPress: requestSave },
          secondary: discardAction,
          title: "We couldn't save your changes.",
        }
      case 'idle':
        return {
          detail: draftLine(draftCount),
          note: refusalNote,
          phase: 'dirty',
          primary: { busyLabel: 'Saving…', label: 'Save', onPress: requestSave },
          secondary: discardAction,
          title: compact ? `Not saved yet: ${joinSections(sections)}` : dirtyTitle,
        }
      default:
        return {
          phase: 'busy',
          primary: {
            busyLabel: bar.phase === 'checking' ? 'Checking your mail…' : 'Saving…',
            label: 'Save',
            onPress: requestSave,
          },
          secondary: { ...discardAction, unavailableReason: WAIT_FOR_SAVE_REASON },
          title: compact ? `Not saved yet: ${joinSections(sections)}` : dirtyTitle,
        }
    }
  }

  const handleFormFocus = (event: React.FocusEvent<HTMLDivElement>): void => {
    const focused = isTextField(event.target)
    setFieldFocused(focused)
    // After the strip appears, the field must not sit under it.
    if (focused) event.target.scrollIntoView?.({ block: 'nearest' })
  }

  // Moving from a field to the bar keeps the strip as it is, so a tap on its Save is not lost to the
  // bar changing shape under the finger.
  const handleFormBlur = (event: React.FocusEvent<HTMLDivElement>): void => {
    const next = event.relatedTarget
    if (next instanceof Node && barRegion()?.contains(next)) return
    setFieldFocused(isTextField(next) && formRef.current?.contains(next) === true)
  }

  // Focus leaving the bar for somewhere outside the form and the bar ends the strip. Into the form,
  // handleFormFocus decides.
  const handleBarBlur = (event: React.FocusEvent<HTMLDivElement>): void => {
    const next = event.relatedTarget
    if (next instanceof Node && (formRef.current?.contains(next) || barRegion()?.contains(next))) return
    setFieldFocused(false)
  }

  const readOnlyProps = { readOnly: isBusy, readOnlyReason: WAIT_FOR_SAVE_REASON }

  const renderSettings = (accountValue: Account): React.ReactNode => (
    <div className="mx-auto max-w-2xl px-6 py-10" onBlur={handleFormBlur} onFocus={handleFormFocus} ref={formRef}>
      <SettingsTitle ref={h1Ref} />
      <p className="mt-1 text-sm" style={MUTED_TEXT}>
        Manage your email account preferences
      </p>
      {savedAt !== undefined && (
        <p className="mt-1 text-sm" style={{ color: 'var(--text-paper)', fontFamily: 'Outfit, sans-serif' }}>
          Saved at {new Date(savedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </p>
      )}

      <div className="mt-8 flex flex-col gap-8">
        <div ref={setSectionEl('name')}>
          <FormSection
            heading="Display name"
            headingId={`${idPrefix}-name-heading`}
            status={sections.includes('name') ? 'unsaved' : undefined}
          >
            <TextInput
              aria-label="From name"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                const name = event.target.value
                editFields((current) => ({ ...current, name }))
              }}
              placeholder="Your display name"
              readOnly={isBusy}
              value={fields.name}
            />
          </FormSection>
        </div>

        <Divider opacity={0.7} />

        <div ref={setSectionEl('forwarding')}>
          <FormSection
            heading="Forwarding"
            headingId={`${idPrefix}-forwarding-heading`}
            status={sections.includes('forwarding') ? 'unsaved' : undefined}
          >
            <p className="mb-2 text-xs" id={ids.forwardingHelper} style={MUTED_TEXT}>
              We&apos;ll forward incoming emails to these addresses.
            </p>
            <div
              className="rounded-md"
              style={{ border: `1px solid ${errors.forwarding ? 'var(--accent)' : 'var(--paper-border)'}` }}
            >
              <AddressLine
                addLabel="Add forwarding address"
                addOnBlur={false}
                addresses={fields.forwardTargets.map((address) => ({ address, name: '' }))}
                describedBy={
                  errors.forwarding ? `${ids.forwardingError} ${ids.forwardingHelper}` : ids.forwardingHelper
                }
                draft={drafts.forwarding}
                inputId={ids.forwardingInput}
                inputRef={(element: HTMLInputElement | null) => setInput('forwarding', element)}
                invalid={errors.forwarding !== undefined}
                label="To:"
                onDraftChange={(text: string) => changeDraft('forwarding', text)}
                onInvalid={(entry: string) =>
                  refuseEntry('forwarding', forwardAddressError(fields.forwardTargets, entry) ?? alreadyListed(entry))
                }
                pendingHintId={ids.forwardingHint}
                savedEntries={accountValue.forwardTargets}
                setAddresses={(addresses) => {
                  const next = addresses.map((address) => address.address)
                  editFields(
                    (current) => ({ ...current, forwardTargets: next }),
                    listAnnouncement(fields.forwardTargets, next),
                  )
                }}
                validate={(entry: string) => forwardAddressError(fields.forwardTargets, entry) === undefined}
                {...readOnlyProps}
              />
            </div>
            {drafts.forwarding.trim() && <PendingHint id={ids.forwardingHint}>{PENDING_HINT}</PendingHint>}
            <FieldError id={ids.forwardingError} message={errors.forwarding} />
          </FormSection>
        </div>

        <Divider opacity={0.7} />

        <div ref={setSectionEl('bounce')}>
          <FormSection
            heading="Bounce rules"
            headingId={`${idPrefix}-bounce-heading`}
            status={sections.includes('bounce') ? 'unsaved' : undefined}
          >
            <div
              className="rounded-md"
              style={{ border: `1px solid ${errors.bounce ? 'var(--accent)' : 'var(--paper-border)'}` }}
            >
              <BounceSenderInput
                addLabel="Add bounce rule"
                addOnBlur={false}
                describedBy={errors.bounce ? `${ids.bounceError} ${ids.bounceHelper}` : ids.bounceHelper}
                draft={drafts.bounce}
                inputId={ids.bounceInput}
                inputRef={(element: HTMLInputElement | null) => setInput('bounce', element)}
                invalid={errors.bounce !== undefined}
                label="Reject emails from:"
                onDraftChange={(text: string) => changeDraft('bounce', text)}
                onInvalid={(entry: string) =>
                  refuseEntry('bounce', bounceRuleError(fields.bounceSenders, entry) ?? alreadyListed(entry))
                }
                pendingHintId={ids.bounceHint}
                rules={fields.bounceSenders}
                savedEntries={accountValue.bounceSenders}
                setRules={(next: string[]) =>
                  editFields(
                    (current) => ({ ...current, bounceSenders: next }),
                    listAnnouncement(fields.bounceSenders, next),
                  )
                }
                {...readOnlyProps}
              />
            </div>
            {drafts.bounce.trim() && <PendingHint id={ids.bounceHint}>{PENDING_HINT}</PendingHint>}
            <FieldError id={ids.bounceError} message={errors.bounce} />
            <p className="mt-2 text-sm" id={ids.bounceHelper} style={MUTED_TEXT}>
              Block senders by address (user@domain.com), domain (@domain.com), or enter * to block everyone. Blocked
              emails won&apos;t be forwarded.
            </p>
          </FormSection>
        </div>

        <Divider opacity={0.7} />

        <div ref={setSectionEl('spam')}>
          <SpamFilterSettings
            changed={sections.includes('spam')}
            drafts={{ blockPhrases: drafts.blockPhrases, trustedSenders: drafts.trustedSenders }}
            errors={{ blockPhrases: errors.blockPhrases, trustedSenders: errors.trustedSenders }}
            inputRef={setInput}
            onChange={(next) =>
              editFields(
                (current) => ({ ...current, spamFilter: next }),
                listAnnouncement(fields.spamFilter.blockPhrases, next.blockPhrases) ??
                  listAnnouncement(fields.spamFilter.trustedSenders, next.trustedSenders),
              )
            }
            onDraftChange={(key: SpamDraftKey, text: string) => changeDraft(key, text)}
            onErrorChange={refuseEntry}
            savedValue={accountValue.spamFilter ?? DEFAULT_SPAM_FILTER}
            value={fields.spamFilter}
            {...readOnlyProps}
          />
        </div>

        <Divider opacity={0.7} />

        {loggedInUser?.username && (
          <NotificationSettings
            accountId={loggedInUser.username}
            onPreviewChange={(preview: NotificationPreview) =>
              handlePreviewChange(loggedInUser.username, accountValue, preview)
            }
            preview={notificationPreview}
            {...readOnlyProps}
          />
        )}

        <Divider opacity={0.7} />

        {/* The install offer's permanent home (not dismissible here, unlike the sign-in
            card). It renders its own heading and returns null when the browser can't install
            or the app is already installed — so it never leaves an empty labeled section. */}
        <InstallOffer surface="paper" />
      </div>
    </div>
  )

  // Focus moves after the render that shows its target.
  useEffect(() => {
    if (!focusRequest) return
    // A dialog opened meanwhile (the leave dialog during a slow save) keeps focus.
    if (document.activeElement?.closest('[role="dialog"]')) return
    const target = { bar: () => barRef.current, h1: () => h1Ref.current, primary: primaryButton }[focusRequest.target]()
    target?.focus()
  }, [focusRequest])

  // The saved bar leaves after 5 s and the Undo offer after 8 s. Focus that was in the bar goes to
  // the page title, so it is not lost with the bar.
  useEffect(() => {
    if (bar.phase !== 'saved' && bar.phase !== 'discarded') return undefined
    const timer = setTimeout(
      () => {
        const focusInBar = barRegion()?.contains(document.activeElement) ?? false
        setBar({ phase: 'idle' })
        setUndo(undefined)
        if (focusInBar) setFocusRequest({ target: 'h1' })
      },
      bar.phase === 'saved' ? SAVED_BAR_MS : UNDO_MS,
    )
    return () => clearTimeout(timer)
  }, [bar.phase])

  // Undoing every edit by hand returns the page to clean, and says so. A failed save with nothing
  // left to retry goes back to idle. A new edit clears that line, so a second undo is said again.
  const sectionsKey = sections.join(' ')
  useEffect(() => {
    const before = sectionCount.current
    sectionCount.current = sectionsKey === '' ? 0 : sectionsKey.split(' ').length
    if (before > 0 && sectionsKey === '' && (bar.phase === 'idle' || bar.phase === 'failed')) {
      setAnnouncement(NO_CHANGES)
      setBar({ phase: 'idle' })
    }
    if (before === 0 && sectionsKey !== '') {
      setAnnouncement((current) => (current === NO_CHANGES ? '' : current))
    }
  }, [sectionsKey, bar.phase])

  // Leaving the page moves any save in progress on, so it never PUTs after the owner left.
  useEffect(
    () => () => {
      checkRequest.current += 1
    },
    [],
  )

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => shortcut.current(event)
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined
    const query = window.matchMedia(PHONE_QUERY)
    const handleChange = (event: MediaQueryListEvent): void => setIsPhone(event.matches)
    setIsPhone(query.matches)
    query.addEventListener?.('change', handleChange)
    return () => query.removeEventListener?.('change', handleChange)
  }, [])

  useEffect(() => {
    if (loggedInUser?.username) {
      const username = loggedInUser.username
      getAccount(username)
        .then((loaded: Account) => {
          setAccount(loaded)
          setFields(fieldsOf(loaded))
          setNotificationPreview(loaded.notificationPreview)
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
      <SettingsCard scrollPaddingBottom={isPhone && !compact ? STACKED_BAR_ROOM : BAR_ROOM}>
        {account === undefined ? (
          <div className="flex h-full min-h-[120px] items-center justify-center">
            <Spinner label="Loading…" size={40} />
          </div>
        ) : (
          renderSettings(account)
        )}
        {account !== undefined && barShown && (
          // display: contents keeps the bar sticky to the scroll container. On the compact strip a
          // press must not move focus out of the field (Safari never focuses a pressed button), or
          // the strip would expand between mousedown and click.
          <div
            onBlur={handleBarBlur}
            onMouseDown={(event) => {
              if (compact) event.preventDefault()
            }}
            role="presentation"
            style={{ display: 'contents' }}
          >
            <UnsavedBar
              {...barProps()}
              compact={compact}
              primaryRef={primaryRef}
              ref={barRef}
              regionLabel="Your changes"
            />
          </div>
        )}
      </SettingsCard>
      {/* Mounted once, whether or not there is anything to say: a live region created in the same
          commit as its content is reliably not announced. */}
      <p className="sr-only" role="status">
        {announcement}
      </p>
      <ImpactDialog
        check={impact?.check ?? 'checking'}
        onConfirm={saveAnyway}
        onKeepEditing={keepEditing}
        open={impact !== undefined}
        phrases={impact?.phrases ?? []}
        returnFocusTo={primaryButton}
      />
      <Snackbar message={errorMessage} onClose={() => setErrorMessage(undefined)} />
    </>
  )
}

export default AccountSettings
