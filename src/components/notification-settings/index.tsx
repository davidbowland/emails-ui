import React, { useEffect, useState } from 'react'

import { isIosDevice } from '@components/install-offer/use-install-prompt'
import NotificationPreviewFigure, { PREVIEW_LABELS } from '@components/notification-preview'
import { isSubscribedToPush, PushResult, subscribeToPush, unsubscribeFromPush } from '@services/push'
import { NotificationPreview } from '@types'

// 'idle' is the settled state with nothing to report: at mount while isSubscribedToPush resolves,
// and again after notifications are turned off. 'pending' is a request in flight.
export type PushState = PushResult | 'idle' | 'pending'

export interface NotificationSettingsProps {
  accountId: string
  disabled: boolean
  preview: NotificationPreview
  setPreview: (preview: NotificationPreview) => void
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
  preview,
  setPreview,
}: NotificationSettingsProps): React.ReactNode => {
  // undefined until isSubscribedToPush resolves. The subscription is the fact, not the
  // permission, and reading it never prompts.
  const [isOn, setIsOn] = useState<boolean | undefined>()
  const [iosDevice, setIosDevice] = useState(false)
  const [state, setState] = useState<PushState>('idle')
  const [turningOff, setTurningOff] = useState(false)

  useEffect(() => {
    setIosDevice(isIosDevice(navigator.userAgent, navigator.platform, navigator.maxTouchPoints))
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

  // A disabled control must say why, so the label carries the reason rather than a separate hint
  // that a screen reader may skip on a disabled button.
  const buttonLabel = (): string => {
    if (isOn === undefined) {
      return 'Checking notifications…'
    }
    if (state === 'pending') {
      return turningOff ? 'Turning off…' : 'Turning on…'
    }
    if (isOn) {
      return 'Turn off notifications'
    }
    return state === 'failed' || state === 'denied' || state === 'dismissed' || state === 'unready'
      ? 'Try again'
      : 'Turn on notifications'
  }

  const status = statusMessage(state, iosDevice, turningOff)
  const busy = isOn === undefined || state === 'pending' || disabled

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

      <button
        className="btn-accent"
        disabled={busy}
        onClick={() => void (isOn ? handleTurnOff() : handleTurnOn())}
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

      {status && (
        <p
          className="mt-2 text-sm"
          role="status"
          style={{ color: 'var(--text-paper)', fontFamily: 'Outfit, sans-serif' }}
        >
          {status}
        </p>
      )}

      <fieldset style={{ border: 'none', margin: '20px 0 0', padding: 0 }}>
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
              cursor: disabled ? 'not-allowed' : 'pointer',
              display: 'flex',
              fontFamily: 'Outfit, sans-serif',
              fontSize: '14px',
              gap: '10px',
              minHeight: '44px',
            }}
          >
            <input
              checked={preview === choice}
              disabled={disabled}
              name="notification-preview"
              onChange={() => setPreview(choice)}
              type="radio"
              value={choice}
            />
            {PREVIEW_LABELS[choice]}
          </label>
        ))}
        <NotificationPreviewFigure preview={preview} />
      </fieldset>
    </section>
  )
}

export default NotificationSettings
