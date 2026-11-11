import { readFileSync } from 'fs'
import { join } from 'path'

import { BADGE_STYLES } from '@components/ui/badge'

// The accent Badge ("Bounced") sits on mailbox list rows, on the dark shell. Its text must read at
// least 4.5:1 over its own --accent-subtle tint on every row background the list paints
// (mailbox/index.tsx): resting, selected and hovered. Colors come from index.css itself.
type Rgb = [number, number, number]

const css = readFileSync(join(__dirname, '../../../assets/css/index.css'), 'utf8')

const tokens: Record<string, string> = Object.fromEntries(
  Array.from(css.matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g), ([, name, value]) => [name, value]),
)

const varName = (color: string): string => color.trim().match(/^var\((--[\w-]+)\)$/)?.[1] ?? ''

const tokenRgb = (name: string): Rgb =>
  [1, 3, 5].map((start) => parseInt(tokens[name].slice(start, start + 2), 16)) as Rgb

const channelLuminance = (channel: number): number => {
  const value = channel / 255
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

const luminance = ([red, green, blue]: Rgb): number =>
  0.2126 * channelLuminance(red) + 0.7152 * channelLuminance(green) + 0.0722 * channelLuminance(blue)

const contrast = (foreground: Rgb, background: Rgb): number => {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
  return (lighter + 0.05) / (darker + 0.05)
}

const blend = (top: Rgb, alpha: number, bottom: Rgb): Rgb =>
  top.map((channel, index) => channel * alpha + bottom[index] * (1 - alpha)) as Rgb

// A translucent token (`--accent-subtle: rgba(…)`) painted over an opaque background.
const tintOver = (tint: string, background: Rgb): Rgb => {
  const [red, green, blue, alpha] = (css.match(new RegExp(`${varName(tint)}:\\s*rgba\\(([^)]*)\\)`))?.[1] ?? '')
    .split(',')
    .map(Number)
  return blend([red, green, blue], alpha, background)
}

// What a mailbox row paints behind the badge: transparent over --shell-bg at rest, --accent at up to
// 14% over the shell when selected, and --shell-surface-hover under the pointer.
const rows: [string, Rgb][] = [
  ['resting', tokenRgb('--shell-bg')],
  ['selected', blend(tokenRgb('--accent'), 0.14, tokenRgb('--shell-bg'))],
  ['hovered', tokenRgb('--shell-surface-hover')],
]

describe('badge contrast', () => {
  const accent = BADGE_STYLES.shell.accent

  it('should find the tokens it measures in the stylesheet', () => {
    expect(tokens['--shell-bg']).toMatch(/^#/)
    expect(tokens['--shell-surface-hover']).toMatch(/^#/)
    expect(tokens[varName(String(accent.color))]).toMatch(/^#/)
    expect(css).toMatch(new RegExp(`${varName(String(accent.background))}:\\s*rgba\\(`))
  })

  it.each(rows)('accent badge text reads at least 4.5:1 on a %s mailbox row', (_row, rowBackground) => {
    const behindText = tintOver(String(accent.background), rowBackground)

    expect(contrast(tokenRgb(varName(String(accent.color))), behindText)).toBeGreaterThanOrEqual(4.5)
  })

  // On paper the accent badge sits on the email viewer's subject line, over --paper-bg. Its fill is
  // an opaque token, so what is behind it doesn't change the text's contrast; both paper
  // backgrounds are measured anyway, in case the fill ever becomes a tint again.
  const paperAccent = BADGE_STYLES.paper.accent
  const fillOver = (fill: string, background: Rgb): Rgb =>
    tokens[varName(fill)] ? tokenRgb(varName(fill)) : tintOver(fill, background)

  it.each([['--paper-bg'], ['--paper-surface']])('paper accent badge text reads at least 4.5:1 on %s', (background) => {
    const behindText = fillOver(String(paperAccent.background), tokenRgb(background))

    expect(tokens[varName(String(paperAccent.color))]).toMatch(/^#/)
    expect(contrast(tokenRgb(varName(String(paperAccent.color))), behindText)).toBeGreaterThanOrEqual(4.5)
  })
})
