import React from 'react'

import * as library from './index'
import type { IconProps, LucideIcon } from './index'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

const { createIcon, ...icons } = library
const iconEntries = Object.entries(icons) as [string, (props: IconProps) => React.ReactNode][]

describe('icons', () => {
  it('exports icons', () => {
    expect(iconEntries).toHaveLength(52)
  })

  it.each(iconEntries)('%s renders hidden from the accessibility tree without a label', (_name, Icon) => {
    const { container } = render(<Icon />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('svg')).toHaveAttribute('focusable', 'false')
  })

  it.each(iconEntries)('%s is found by role and name with a label', (_name, Icon) => {
    render(<Icon label="Meaning" />)

    expect(screen.getByRole('img', { name: 'Meaning' })).toBeInTheDocument()
  })

  it.each(iconEntries)('%s defaults to size 16 with a 1.5 stroke', (_name, Icon) => {
    const { container } = render(<Icon />)

    expect(container.querySelector('svg')).toHaveAttribute('size', '16')
    expect(container.querySelector('svg')).toHaveAttribute('stroke-width', '1.5')
  })

  it.each(iconEntries)('%s uses a 2 stroke at size 12', (_name, Icon) => {
    const { container } = render(<Icon size={12} />)

    expect(container.querySelector('svg')).toHaveAttribute('stroke-width', '2')
  })

  it.each([9, 10, 12, 13] as const)('uses a 2 stroke at size %i', (size) => {
    const { container } = render(<library.CheckIcon size={size} />)

    expect(container.querySelector('svg')).toHaveAttribute('size', String(size))
    expect(container.querySelector('svg')).toHaveAttribute('stroke-width', '2')
  })

  it.each([14, 15, 16, 17, 18, 20, 24, 28] as const)('uses a 1.5 stroke at size %i', (size) => {
    const { container } = render(<library.CheckIcon size={size} />)

    expect(container.querySelector('svg')).toHaveAttribute('size', String(size))
    expect(container.querySelector('svg')).toHaveAttribute('stroke-width', '1.5')
  })

  it('treats an empty label as decorative', () => {
    render(<library.CheckIcon label="" />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('wraps any component through createIcon', () => {
    const Stand = Object.assign((props: Record<string, unknown>) => <svg {...props} />, { displayName: 'Stand' })
    const Custom = createIcon(Stand as unknown as LucideIcon)
    render(<Custom label="Custom" size={12} />)

    expect(Custom.displayName).toBe('Stand')

    expect(screen.getByRole('img', { name: 'Custom' })).toHaveAttribute('stroke-width', '2')
  })
})
