import React from 'react'

import Divider from './index'
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'

describe('Divider component', () => {
  it('should render nothing a screen reader can find', () => {
    const { container } = render(<Divider />)

    expect(container.querySelectorAll('hr, [role]')).toHaveLength(0)
  })

  it('should render on either surface, faded or not', () => {
    const { container } = render(<Divider opacity={0.6} surface="shell" />)

    expect(container.firstChild).not.toBeNull()
  })
})
