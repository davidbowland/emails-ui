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
          client for one person&apos;s mailboxes. There is no sign-up and no account you can create. We store your
          emails for you, and they stay until they are deleted.
        </p>

        {/* Top divider */}
        <div style={{ height: '1px', background: 'var(--shell-border)' }} />

        <Section heading="Who else holds it">
          Amazon runs the machines that carry and store the mail. Some of these addresses forward to a second mailbox.
          Otherwise nobody sees your message but the owner of the mailbox you wrote to.
        </Section>

        <Section heading="Our logs">
          Our server logs each request for 30 days, including your IP address. We never use those logs to work out who
          you are. No cookies, no analytics, no ads, and nothing here trains an AI model.
        </Section>

        <Section heading="Your rights">
          Ask us for a copy of what we hold about you, or ask us to correct or delete it. Deleting a message clears the
          message and its attachments; a record that it arrived stays.
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
          Last updated August 10, 2026
        </p>
      </div>
    </div>
  )
}

export default PrivacyPolicy
