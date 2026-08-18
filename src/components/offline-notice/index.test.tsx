import React from 'react'

import OfflineNotice from './index'
import '@testing-library/jest-dom'
import { act, render, screen } from '@testing-library/react'

describe('Offline notice component', () => {
  const setOnLine = (value: boolean): void => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value })
  }

  const setMatchMedia = (matches: boolean): void => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: jest.fn().mockReturnValue({ matches }),
    })
  }

  beforeAll(() => {
    setMatchMedia(false)
  })

  it('should render nothing when online', () => {
    setOnLine(true)
    render(<OfflineNotice />)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('should show the offline notice when navigator is offline at mount', () => {
    setOnLine(false)
    render(<OfflineNotice />)

    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('Offline')
    expect(status).toHaveTextContent('Your mail loads when the connection returns.')
  })

  it('should show the offline notice after an offline event fires', () => {
    setOnLine(true)
    render(<OfflineNotice />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    setOnLine(false)
    act(() => {
      window.dispatchEvent(new Event('offline'))
    })

    expect(screen.getByRole('status')).toHaveTextContent('Offline')
  })

  it('should clear the notice when the connection returns', () => {
    setOnLine(false)
    render(<OfflineNotice />)
    expect(screen.getByRole('status')).toBeInTheDocument()

    setOnLine(true)
    act(() => {
      window.dispatchEvent(new Event('online'))
    })

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('should announce politely and have no close button', () => {
    setOnLine(false)
    render(<OfflineNotice />)

    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('should convey the offline state with the word "Offline", not color alone', () => {
    setOnLine(false)
    render(<OfflineNotice />)

    expect(screen.getByText('Offline')).toBeVisible()
  })

  it('should render without motion when reduced motion is preferred', () => {
    setMatchMedia(true)
    setOnLine(false)
    render(<OfflineNotice />)

    expect(screen.getByRole('status')).toHaveTextContent('Offline')

    setMatchMedia(false)
  })

  it('should not use any banned words in its copy', () => {
    setOnLine(false)
    render(<OfflineNotice />)

    const copy = screen.getByRole('status').textContent ?? ''
    const banned = ['PWA', 'manifest', 'service worker', 'progressive web app', 'please']
    const usedBanned = banned.filter((word) => copy.toLowerCase().includes(word.toLowerCase()))
    expect(usedBanned).toEqual([])
  })
})
