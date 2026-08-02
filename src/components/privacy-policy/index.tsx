import Link from 'next/link'
import React from 'react'

const Section = ({ heading, children }: { heading: string; children: React.ReactNode }): React.ReactNode => (
  <>
    <div style={{ padding: '40px 0 32px' }}>
      <div
        style={{
          fontFamily: 'Outfit, sans-serif',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase' as const,
          color: 'var(--accent)',
          marginBottom: '14px',
        }}
      >
        {heading}
      </div>
      <div
        style={{
          fontFamily: 'Outfit, sans-serif',
          fontSize: '15px',
          lineHeight: 1.75,
          color: 'var(--text-muted)',
        }}
      >
        {children}
      </div>
    </div>
    <div style={{ height: '1px', background: 'var(--shell-border)' }} />
  </>
)

const PrivacyPolicy = (): React.ReactNode => {
  return (
    <div
      style={{
        minHeight: '100%',
        background: 'var(--shell-bg)',
        backgroundImage: 'radial-gradient(ellipse 60% 40% at 50% -5%, rgba(124, 93, 244, 0.1) 0%, transparent 70%)',
        padding: '64px 24px 80px',
      }}
    >
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        {/* Eyebrow */}
        <div
          style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase' as const,
            color: 'var(--accent)',
            marginBottom: '20px',
          }}
        >
          Legal
        </div>

        {/* Heading */}
        <h1
          className="font-display"
          style={{
            fontSize: 'clamp(40px, 6vw, 64px)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
            lineHeight: 1.05,
            margin: '0 0 24px',
          }}
        >
          Privacy Policy
        </h1>

        {/* Lead */}
        <p
          style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: '15px',
            lineHeight: 1.75,
            color: 'var(--text-muted)',
            margin: '0 0 40px',
          }}
        >
          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>email.dbowland.com</span> is a private mail
          client for the personal mailboxes of one operator. There is no public sign-up and no account you can create.
          This policy is written mainly for the people who matter most here: anyone who sends mail to, or receives mail
          from, one of those addresses.
        </p>

        {/* Top divider */}
        <div style={{ height: '1px', background: 'var(--shell-border)' }} />

        <Section heading="If you email one of these addresses">
          Your message is stored so it can be read. That means the whole of it: the sender and recipient addresses, the
          subject, the full body, every header, and any attachments. This is what an inbox is, but it is worth stating
          plainly, because your message rests on our storage rather than passing through it.
        </Section>

        <Section heading="How long messages are kept">
          Attachments are deleted automatically 15 days after they arrive. The message body is deleted automatically
          five years after it arrives, and is moved to cheaper long-term storage along the way. Messages waiting to be
          sent or processed are deleted after 30 days.
        </Section>

        <Section heading="What outlives the message">
          A short index entry for each message — the account, a message identifier, and a timestamp — has no expiry set
          and remains after the body is gone. There is no self-service deletion, and no automated process that erases a
          mailbox on request. If you want your correspondence removed sooner than the schedule above, write to the
          address below and it will be deleted by hand.
        </Section>

        <Section heading="If you sign in">
          Only the operator can sign in. Amazon Cognito holds that account&apos;s email address, and a phone number if
          multi-factor authentication is switched on. While signed in, the browser keeps the session token in local
          storage; no cookie is set.
        </Section>

        <Section heading="What we log">
          When the browser calls our API, the request is recorded: the IP address, the time, the address requested, and
          the browser&apos;s user-agent string. We don&apos;t record which pages are viewed — the website itself keeps
          no access log. Message contents are not written to these logs.
        </Section>

        <Section heading="What we don't do">
          We don&apos;t sell your data. We don&apos;t share it with advertisers. We don&apos;t build profiles. We run no
          analytics. Nothing here is scanned for marketing, and no message is used to train AI models.
        </Section>

        <Section heading="Who else handles your data">
          Amazon Web Services hosts the service and stores everything described above; Amazon Simple Email Service
          receives and sends the mail; Amazon Cognito manages the operator&apos;s sign-in. Log lines recording an error
          are copied to a separate error-reporting function we run in the same AWS account. Server logs, including those
          copies, are deleted after 30 days.
        </Section>

        <Section heading="When we share your data">
          Beyond the providers above, we share data only when legally required — for example, in response to a valid
          court order or law enforcement request. Bear in mind that email is not private in transit: your message passes
          through your own provider and across the internet before it reaches us.
        </Section>

        <Section heading="Your rights">
          You may request access to, correction of, or deletion of your personal data at any time, and we will act on
          that by hand. If you are a resident of the European Economic Area, you also have the right to data portability
          and to lodge a complaint with your local data protection authority.
        </Section>

        <Section heading="Contact us">
          <Link
            href="mailto:privacy@dbowland.com"
            style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}
          >
            privacy@dbowland.com
          </Link>
        </Section>

        <div style={{ height: '1px', background: 'var(--shell-border)' }} />
        <p
          style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: '13px',
            color: 'var(--text-muted)',
            margin: '24px 0 0',
          }}
        >
          Effective August 1, 2026
        </p>
      </div>
    </div>
  )
}

export default PrivacyPolicy
