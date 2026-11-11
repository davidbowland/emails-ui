import React from 'react'

import ButtonIconTile, { BUTTON_ICON_TILE_SIZE } from './index'
import Button from '@components/ui/button'
import { SendIcon } from '@components/ui/icons'
import Spinner from '@components/ui/spinner'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

jest.mock('@components/ui/spinner')

describe('ButtonIconTile component', () => {
  const SendTile = (): React.ReactNode => <ButtonIconTile icon={SendIcon} />

  it('should draw its icon at 12, hidden from assistive tech', () => {
    render(<ButtonIconTile icon={SendIcon} />)

    expect(screen.getByTestId('icon-Send')).toHaveAttribute('size', '12')
    expect(screen.getByTestId('icon-Send')).toHaveAttribute('aria-hidden', 'true')
  })

  it("should leave a Button's name to its label", () => {
    render(
      <Button icon={SendTile} iconSize={BUTTON_ICON_TILE_SIZE} variant="primary">
        Send
      </Button>,
    )

    expect(screen.getByRole('button', { name: 'Send' })).toContainElement(screen.getByTestId('icon-Send'))
  })

  it('should give way to a busy spinner the size of the tile inside a Button', () => {
    render(
      <Button busy busyLabel="Sending…" icon={SendTile} iconSize={BUTTON_ICON_TILE_SIZE} variant="primary">
        Send
      </Button>,
    )

    expect(screen.getByRole('button', { name: 'Sending…' })).toBeInTheDocument()
    expect(jest.mocked(Spinner)).toHaveBeenCalledWith(expect.objectContaining({ size: 24 }), undefined)
  })
})
