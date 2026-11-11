import React from 'react'

import { IconProps } from '@components/ui/icons'

// The size of the tile, and the iconSize a Button must pass for it.
export const BUTTON_ICON_TILE_SIZE = 24

export interface ButtonIconTileProps {
  icon: React.ComponentType<IconProps>
}

// Decorative chrome around an icon: a tinted 24px tile that sits inside a primary Button. Pass it as
// Button's `icon` (with iconSize BUTTON_ICON_TILE_SIZE) rather than as children, so that while busy
// Button swaps the whole tile for a spinner of the same size and the label never jumps. Wrap it in a
// component that ignores the size Button passes: the tile is fixed, and the icon inside is always 12.
const ButtonIconTile = ({ icon: Icon }: ButtonIconTileProps): React.ReactNode => (
  <span
    style={{
      alignItems: 'center',
      background: 'rgba(255,255,255,0.15)',
      borderRadius: '7px',
      display: 'flex',
      flexShrink: 0,
      height: `${BUTTON_ICON_TILE_SIZE}px`,
      justifyContent: 'center',
      width: `${BUTTON_ICON_TILE_SIZE}px`,
    }}
  >
    <Icon size={12} />
  </span>
)

export default ButtonIconTile
