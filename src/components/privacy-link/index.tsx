import Link from 'next/link'
import React from 'react'

const PrivacyLink = (): React.ReactNode => {
  return (
    <div className="p-2 text-center text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif' }}>
      <Link href="/privacy-policy" style={{ color: 'var(--text-muted)' }}>
        Privacy policy
      </Link>
    </div>
  )
}

export default PrivacyLink
