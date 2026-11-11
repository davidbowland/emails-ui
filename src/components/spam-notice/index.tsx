import React, { useEffect, useId, useRef, useState } from 'react'

import { Info, Lead, Line, Mono, NoticeButton, NoticeCard } from './elements'
import { isFreeMailDomain, isValidTrustedSender, SPAM_FILTER_LIST_LIMIT } from '@services/spam-impact'

export type SpamNoticeKind = 'not-spam' | 'moved-to-spam'
export type SpamNoticeTrustState = 'offer' | 'saving' | 'accepted' | 'declined' | 'full'

export interface SpamNoticeProps {
  kind: SpamNoticeKind
  // Changes with every move, so a second move of the same kind and sender still takes focus.
  moveId: string
  onDecline: () => void
  // The parent returns focus to the first viewer action, or to the list when there is none.
  onDismiss: () => void
  onSuggest: () => void
  // The address, or "@domain" for the whole domain.
  onTrust: (value: string) => void
  // How many more emails from this sender are still in Spam (not-spam only).
  otherFromSender?: number
  sender?: string
  trustedValue?: string
  trustState: SpamNoticeTrustState
  // Set once suggestions were applied (moved-to-spam only); 0 when every pick was already a rule.
  updatedCount?: number
}

// Which button started the trust save: it alone shows busy, and the others say why they can't act.
type TrustAction = 'address' | 'domain' | 'decline'

const WAIT_FOR_SAVE = 'Wait until your changes finish saving.'

const plural = (count: number, one: string, many: string): string => (count === 1 ? one : many)

// The "@domain" rule for an address, or undefined when there is no usable domain.
const domainRule = (sender: string): string | undefined => {
  const at = sender.lastIndexOf('@')
  const rule = at > 0 && at < sender.length - 1 ? sender.slice(at).toLowerCase() : undefined
  return rule && isValidTrustedSender(rule) ? rule : undefined
}

const SpamNotice = ({
  kind,
  moveId,
  onDecline,
  onDismiss,
  onSuggest,
  onTrust,
  otherFromSender = 0,
  sender,
  trustedValue,
  trustState,
  updatedCount,
}: SpamNoticeProps): React.ReactNode => {
  const sectionRef = useRef<HTMLElement>(null)
  const questionId = useId()
  const [pressed, setPressed] = useState<TrustAction | undefined>()

  const saved = updatedCount !== undefined

  // Focus arrives when the notice is shown, shows a new move, or confirms saved rule changes (the
  // dialog that saved them has just closed). A later trust state change (offer to accepted) only
  // takes focus back when the button that held it has gone.
  // A new move starts with no press recorded, so a save it didn't start can't mark one button busy.
  useEffect(() => {
    sectionRef.current?.focus()
    setPressed(undefined)
  }, [kind, sender, moveId])
  useEffect(() => {
    if (saved) {
      sectionRef.current?.focus()
    }
  }, [saved])
  useEffect(() => {
    if (document.activeElement === document.body) {
      sectionRef.current?.focus()
    }
  }, [trustState])

  // Non-modal: Escape closes it, but Tab is never held.
  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>): void => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onDismiss()
    }
  }

  const renderNotSpam = (): { actions?: React.ReactNode; body: React.ReactNode } => {
    // Only a sender the API would accept is offered, so trusting it never fails validation.
    const offering =
      sender !== undefined && isValidTrustedSender(sender) && (trustState === 'offer' || trustState === 'saving')
    if (!offering) {
      return {
        body: (
          <>
            <Lead>Moved to Inbox.</Lead>
            {trustState === 'accepted' && trustedValue && (
              <Line>
                <Mono>{trustedValue}</Mono> added to trusted senders.
              </Line>
            )}
            {trustState === 'full' && (
              <Line>
                Your trusted senders list is full — {SPAM_FILTER_LIST_LIMIT} is the limit. Remove one under Spam filter
                in Settings, then add this sender there.
              </Line>
            )}
          </>
        ),
      }
    }

    const saving = trustState === 'saving'
    const domain = isFreeMailDomain(sender) ? undefined : domainRule(sender)
    // While saving, the pressed button is busy and the rest are unavailable. A save this notice didn't
    // start (no press recorded) marks every button busy, since none of them can act.
    const stateFor = (action: TrustAction): { busy?: boolean; unavailableReason?: string } =>
      saving
        ? pressed === undefined || pressed === action
          ? { busy: true }
          : { unavailableReason: WAIT_FOR_SAVE }
        : {}
    const press = (action: TrustAction, run: () => void) => (): void => {
      setPressed(action)
      run()
    }
    return {
      actions: (
        <>
          <NoticeButton
            {...stateFor('address')}
            describedBy={questionId}
            onClick={press('address', () => onTrust(sender))}
            variant="accent"
          >
            Trust this address
          </NoticeButton>
          {domain && (
            <NoticeButton {...stateFor('domain')} onClick={press('domain', () => onTrust(domain))} variant="ghost">
              {`Trust all ${domain}`}
            </NoticeButton>
          )}
          <NoticeButton {...stateFor('decline')} onClick={press('decline', onDecline)} variant="ghost">
            No thanks
          </NoticeButton>
        </>
      ),
      body: (
        <>
          <Lead>Moved to Inbox.</Lead>
          <Line id={questionId}>
            Always trust <Mono>{sender}</Mono>?
          </Line>
          {otherFromSender > 0 && (
            <Info>
              Spam has {otherFromSender} more {plural(otherFromSender, 'email', 'emails')} from this sender. Trusting a
              sender only affects new mail, so move {plural(otherFromSender, 'it', 'them')} with Not spam.
            </Info>
          )}
          {saving && <Info>Saving…</Info>}
        </>
      ),
    }
  }

  const renderMovedToSpam = (): { actions?: React.ReactNode; body: React.ReactNode } =>
    updatedCount === undefined
      ? {
          actions: (
            <NoticeButton onClick={onSuggest} variant="ghost">
              Suggest rule changes
            </NoticeButton>
          ),
          body: (
            <>
              <Lead>Moved to Spam.</Lead>
              <Info>Want fewer emails like this? We can read this one and suggest changes to your spam rules.</Info>
            </>
          ),
        }
      : {
          body: (
            <>
              <Lead>Moved to Spam.</Lead>
              {updatedCount === 0 ? (
                <Line>Those changes were already in your rules.</Line>
              ) : (
                <Line>
                  {updatedCount} rule {plural(updatedCount, 'change', 'changes')} saved.
                </Line>
              )}
              <Info>You can change your spam filter anytime in Settings.</Info>
            </>
          ),
        }

  const { actions, body } = kind === 'not-spam' ? renderNotSpam() : renderMovedToSpam()

  return (
    <NoticeCard actions={actions} onDismiss={onDismiss} onKeyDown={handleKeyDown} sectionRef={sectionRef}>
      <div role="status">{body}</div>
    </NoticeCard>
  )
}

export default SpamNotice
