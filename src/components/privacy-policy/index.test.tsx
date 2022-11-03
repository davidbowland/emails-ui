import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import React from 'react'

import PrivacyPolicy from './index'

describe('provacy-policy component', () => {
  test('expect privacy policy rendered', async () => {
    render(<PrivacyPolicy />)

    expect(screen.queryAllByText(/privacy policy/i).length).toBeGreaterThan(0)
  })
})
