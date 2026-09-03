import React from 'react'

import PrivacyPolicy from './index'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

jest.mock('@config/amplify')

describe('privacy-policy component', () => {
  it('expect privacy policy rendered', async () => {
    render(<PrivacyPolicy />)

    expect(screen.queryAllByText(/privacy policy/i).length).toBeGreaterThan(0)
  })

  it.each([
    // Log retention must match RetentionInDays on the API log groups
    'logs each request for 30 days',
    // Would become false the moment this client added cookies or analytics
    'No cookies, no analytics, no ads',
  ])('expect policy to state %s', (claim: string) => {
    const { container } = render(<PrivacyPolicy />)

    expect(container.textContent).toContain(claim)
  })

  it('says who carries a notification and how long the address is kept', async () => {
    const { container } = render(<PrivacyPolicy />)

    expect(await screen.findByText(/Apple, Google, or Mozilla carries them to your device/i)).toBeInTheDocument()
    // The retention half is the only claim in the sentence a reader can hold us to, so assert it separately
    expect(container.textContent).toContain(
      'we store the address their service gives us until you turn notifications off',
    )
  })

  it('is dated the day notifications shipped', async () => {
    render(<PrivacyPolicy />)

    expect(await screen.findByText('Last updated August 18, 2026')).toBeVisible()
  })
})
