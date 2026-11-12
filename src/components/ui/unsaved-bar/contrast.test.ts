import { readFileSync } from 'fs'
import { join } from 'path'

// The unsaved bar's pairs (spec §6), read from index.css so a token change that breaks them fails here.
type Rgb = [number, number, number]

const css = readFileSync(join(__dirname, '../../../assets/css/index.css'), 'utf8')

const tokens: Record<string, string> = Object.fromEntries(
  Array.from(css.matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g), ([, name, value]) => [name, value]),
)

const toRgb = (hex: string): Rgb => [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16)) as Rgb

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

describe('unsaved bar contrast', () => {
  it('should find the tokens it measures in the stylesheet', () => {
    expect(tokens['--shell-surface']).toBe('#0c0d1a')
    expect(tokens['--text-primary']).toBe('#9ba1be')
    expect(tokens['--accent-deep']).toBe('#6f4ee8')
    expect(tokens['--paper-surface']).toBe('#fdfaf5')
  })

  it('should read the title (#fdfaf5) on the shell surface at 18.4:1 or more', () => {
    expect(contrast(toRgb('#fdfaf5'), toRgb(tokens['--shell-surface']))).toBeGreaterThanOrEqual(18.4)
  })

  it('should read the detail (--text-primary) on the shell surface at 7.5:1 or more', () => {
    expect(contrast(toRgb(tokens['--text-primary']), toRgb(tokens['--shell-surface']))).toBeGreaterThanOrEqual(7.5)
  })

  it('should read --accent-deep on --paper-surface at 5.1:1 or more', () => {
    expect(contrast(toRgb(tokens['--accent-deep']), toRgb(tokens['--paper-surface']))).toBeGreaterThanOrEqual(5.1)
  })
})
