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
          This policy describes how{' '}
          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>email.dbowland.com</span> handles your data.
          The short version: we collect very little, we keep it briefly, and we never sell it.
        </p>

        {/* Top divider */}
        <div style={{ height: '1px', background: 'var(--shell-border)' }} />

        <Section heading="What we collect">
          Our servers automatically log your IP address, browser type, and the pages you visit. When you sign in, we set
          a session cookie to keep you authenticated — that&apos;s essential for the service to work. If you register a
          phone number for multi-factor authentication, we store it solely to protect your account.
        </Section>

        <Section heading="Why we collect it">
          We use server logs to detect abuse and keep the service running. We process this data under legitimate
          interests — operating a secure, functional service. We don&apos;t rely on your consent, and we don&apos;t use
          your data for advertising or profiling.
        </Section>

        <Section heading="What we don't do">
          We don&apos;t sell your data. We don&apos;t share it with advertisers. We don&apos;t build profiles. We
          intentionally collect nothing beyond what&apos;s necessary to operate the service and prevent fraud.
        </Section>

        <Section heading="When we share your data">
          We share data only when legally required — for example, in response to a valid court order or law enforcement
          request.
        </Section>

        <Section heading="Data retention">
          Log files may be retained for up to 90 days. Email data and account information is deleted within 30 days of
          account deletion.
        </Section>

        <Section heading="Your rights">
          You may request access to, correction of, or deletion of your personal data at any time. If you are a resident
          of the European Economic Area, you also have the right to data portability and to lodge a complaint with your
          local data protection authority.
        </Section>

        <Section heading="Contact us">
          <Link
            href="mailto:privacy@dbowland.com"
            style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}
          >
            privacy@dbowland.com
          </Link>
        </Section>
      </div>
    </div>
  )
}

export default PrivacyPolicy
