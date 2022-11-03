import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import React from 'react'

import PrivacyLink from './index'

describe('provacy-link component', () => {
  test('expect privacy link rendered', async () => {
    render(<PrivacyLink />)

    expect(await screen.findByText(/privacy policy/i)).toBeInTheDocument()
  })
})
