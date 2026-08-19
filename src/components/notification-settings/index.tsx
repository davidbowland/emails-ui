import React, { useEffect, useState } from 'react'

import { isIosDevice } from '@components/install-offer/use-install-prompt'
import NotificationPreviewFigure, { PREVIEW_LABELS } from '@components/notification-preview'
import { isPushSupported, isSubscribedToPush, PushResult, subscribeToPush, unsubscribeFromPush } from '@services/push'
import { NotificationPreview } from '@types'

// 'idle' is the settled state with nothing to report: at mount while isSubscribedToPush resolves,
// and again after notifications are turned off. 'pending' is a request in flight.
export type PushState = PushResult | 'idle' | 'pending'

export interface NotificationSettingsProps {
  accountId: string
  disabled: boolean
  // Awaited, because the choice is saved the moment it is made: everything else in this section
  // applies instantly, and a radio that only looked chosen would leave the account on the tier
  // the reader just rejected.
  onPreviewChange: (preview: NotificationPreview) => Promise<void>
  preview: NotificationPreview
}

const CHOICES: NotificationPreview[] = ['sender-and-subject', 'sender-only', 'none']

// A bare union widening does not produce a compile error on its own, so this is what makes a new
// PushState member fail the build until the status line handles it.
const assertNever = (state: never): never => {
  throw new Error(`Unhandled push state: ${String(state)}`)
}

const statusMessage = (state: PushState, iosDevice: boolean, turningOff: boolean): string | undefined => {
  switch (state) {
    case 'idle':
    case 'pending':
      return undefined
    case 'subscribed':
      return 'Notifications are on.'
    case 'denied':
      return 'Your browser is blocking notifications. Turn them on in your browser settings, then try again.'
    case 'dismissed':
      return 'Notifications are still off. Choose Allow when your browser asks.'
    case 'unready':
      return "Emails isn't running in the background yet, so notifications can't start. Reload the page and try again."
    case 'unsupported':
      return iosDevice
        ? "This browser can't turn on notifications. Add Emails to your Home Screen from the Share menu, then turn them on from there."
        : "This browser can't turn on notifications. You'll still see new mail when you open Emails."
    case 'failed':
      return turningOff
        ? "We couldn't turn notifications off. Please try again."
        : "We couldn't turn on notifications. Please try again."
    default:
      return assertNever(state)
  }
}

const NotificationSettings = ({
  accountId,
  disabled,
  onPreviewChange,
  preview,
}: NotificationSettingsProps): React.ReactNode => {
  // undefined until isSubscribedToPush resolves. The subscription is the fact, not the
  // permission, and reading it never prompts.
  const [isOn, setIsOn] = useState<boolean | undefined>()
  const [iosDevice, setIosDevice] = useState(false)
  const [savingPreview, setSavingPreview] = useState(false)
  // Whether this browser could do notifications at all. Assumed until the mount effect says
  // otherwise, so the button is not offered and then withdrawn on a browser that can.
  const [supported, setSupported] = useState(true)
  const [state, setState] = useState<PushState>('idle')
  const [turningOff, setTurningOff] = useState(false)

  useEffect(() => {
    setIosDevice(isIosDevice(navigator.userAgent, navigator.platform, navigator.maxTouchPoints))
    // Knowable without asking, so it is said at mount: a button whose only possible outcome is
    // "this browser can't" is an offer the reader has to spend a tap to have refused.
    if (!isPushSupported()) {
      setSupported(false)
      setIsOn(false)
      setState('unsupported')
      return
    }
    isSubscribedToPush().then(setIsOn)
  }, [])

  const handleTurnOn = async (): Promise<void> => {
    setTurningOff(false)
    setState('pending')
    const result = await subscribeToPush(accountId)
    setIsOn(result === 'subscribed')
    setState(result)
  }

  const handleTurnOff = async (): Promise<void> => {
    setTurningOff(true)
    setState('pending')
    const result = await unsubscribeFromPush(accountId)
    setIsOn(result !== 'unsubscribed')
    setState(result === 'unsubscribed' ? 'idle' : 'failed')
  }

  const handlePreviewChange = async (choice: NotificationPreview): Promise<void> => {
    setSavingPreview(true)
    // The owner reports the outcome: a rejection here would leave the section stuck on "Saving".
    await onPreviewChange(choice).catch(() => undefined)
    setSavingPreview(false)
  }

  // A disabled control must say why, so the label carries the reason rather than a separate hint
  // that a screen reader may skip on a disabled button.
  const buttonLabel = (): string => {
    // Why the whole section is unavailable: the Save button at the foot of the page is writing.
    if (disabled) {
      return 'Saving your settings…'
    }
    if (isOn === undefined) {
      return 'Checking notifications…'
    }
    if (state === 'pending') {
      return turningOff ? 'Turning off…' : 'Turning on…'
    }
    if (isOn) {
      return 'Turn off notifications'
    }
    // Another go at a worker that never became ready would burn another five seconds on the same
    // answer, so the button offers the reload the status line asks for, and does it.
    if (state === 'unready') {
      return 'Reload the page'
    }
    return state === 'failed' || state === 'denied' || state === 'dismissed' ? 'Try again' : 'Turn on notifications'
  }

  const handleButtonClick = (): void => {
    if (state === 'unready') {
      window.location.reload()
      return
    }
    void (isOn ? handleTurnOff() : handleTurnOn())
  }

  const status = statusMessage(state, iosDevice, turningOff)
  const busy = isOn === undefined || state === 'pending' || disabled
  const previewDisabled = disabled || savingPreview

  return (
    <section>
      <div
        className="mb-1 text-xs font-semibold uppercase"
        style={{ color: 'var(--text-paper-muted)', fontFamily: 'Outfit, sans-serif', letterSpacing: '0.1em' }}
      >
        Notifications
      </div>
      <p className="mb-3 text-sm" style={{ color: 'var(--text-paper-muted)', fontFamily: 'Outfit, sans-serif' }}>
        Emails tells you when a message arrives. Turning notifications on applies to this browser. What they show
        follows your account to every device.
      </p>

      {/* No button on a browser that cannot do notifications: the status line below already says
          so, and the only thing pressing it could do is say the same thing a tap later. */}
      {supported && (
        <button
          aria-describedby="notification-status"
          className="btn-accent"
          disabled={busy}
          onClick={handleButtonClick}
          style={{
            cursor: busy ? 'not-allowed' : 'pointer',
            fontFamily: 'Outfit, sans-serif',
            fontSize: '14px',
            fontWeight: 600,
            minHeight: '44px',
            padding: '9px 20px',
          }}
          type="button"
        >
          {buttonLabel()}
        </button>
      )}

      {/* Mounted whether or not there is anything to say. A live region has to be in the
          accessibility tree BEFORE its content changes: created and filled in the same commit,
          it reliably announces nothing -- and on denied -> Try again -> pending -> denied the
          text is identical either side, so an unmount and remount would be the only signal a
          blind reader got, which is no signal at all. The height is reserved so the fieldset
          below does not jump when a line appears. */}
      <p
        className="mt-2 text-sm"
        id="notification-status"
        role="status"
        style={{ color: 'var(--text-paper)', fontFamily: 'Outfit, sans-serif', minHeight: '1.25rem' }}
      >
        {status ?? ''}
      </p>

      <fieldset
        aria-busy={savingPreview}
        aria-describedby="notification-preview-status"
        style={{ border: 'none', margin: '20px 0 0', padding: 0 }}
      >
        <legend
          className="text-xs font-semibold uppercase"
          style={{ color: 'var(--text-paper-muted)', fontFamily: 'Outfit, sans-serif', letterSpacing: '0.1em' }}
        >
          What notifications show
        </legend>
        <p className="mt-1 mb-2 text-xs" style={{ color: 'var(--text-paper-muted)', fontFamily: 'Outfit, sans-serif' }}>
          Anyone holding your phone can read this before you unlock it.
        </p>
        {CHOICES.map((choice) => (
          // The label wraps the input so the whole 44px row is the target.
          <label
            key={choice}
            style={{
              alignItems: 'center',
              color: 'var(--text-paper)',
              cursor: previewDisabled ? 'not-allowed' : 'pointer',
              display: 'flex',
              fontFamily: 'Outfit, sans-serif',
              fontSize: '14px',
              gap: '10px',
              minHeight: '44px',
            }}
          >
            <input
              checked={preview === choice}
              disabled={previewDisabled}
              name="notification-preview"
              onChange={() => void handlePreviewChange(choice)}
              type="radio"
              value={choice}
            />
            {PREVIEW_LABELS[choice]}
          </label>
        ))}
        {/* Mounted whether or not there is anything to say, so a screen reader has the region
            before its text changes -- a region created in the same commit as its content is
            reliably not announced. The height is reserved so nothing below it jumps. */}
        <p
          className="mt-1 text-sm"
          id="notification-preview-status"
          role="status"
          style={{ color: 'var(--text-paper)', fontFamily: 'Outfit, sans-serif', minHeight: '1.25rem' }}
        >
          {savingPreview ? 'Saving your choice…' : ''}
        </p>
        <NotificationPreviewFigure preview={preview} />
      </fieldset>
    </section>
  )
}

export default NotificationSettings
