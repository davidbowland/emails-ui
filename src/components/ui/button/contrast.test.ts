import { readFileSync } from 'fs'
import { join } from 'path'
import React from 'react'

import { BUTTON_VARIANT_CLASSES, ButtonVariant } from '@components/ui/button'
import { ICON_BUTTON_VARIANT_CLASSES, IconButtonVariant } from '@components/ui/icon-button'
import { SPINNER_COLORS, SpinnerSurface } from '@components/ui/spinner'
import TextInput from '@components/ui/text-input'

// AC6: every Button and IconButton variant's ready-state text reads at least 4.5:1 on what it sits
// on. Busy and unavailable buttons keep the ready colors, so this covers them too. Spinner arcs
// read at least 3:1 on their surface, and read-only input text at least 4.5:1. Colors come from
// index.css itself, so a stylesheet change that breaks the bar fails here.
type Rgb = [number, number, number]

const css = readFileSync(join(__dirname, '../../../assets/css/index.css'), 'utf8')

const tokens: Record<string, string> = Object.fromEntries(
  Array.from(css.matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g), ([, name, value]) => [name, value]),
)

const toRgb = (hex: string): Rgb =>
  hex.length === 4
    ? ([1, 2, 3].map((index) => parseInt(hex[index] + hex[index], 16)) as Rgb)
    : ([1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16)) as Rgb)

// A color as index.css or a style writes it: a token reference or a hex value.
const colorRgb = (color: string): Rgb => {
  const token = color.trim().match(/^var\((--[\w-]+)\)$/)
  return toRgb(token ? tokens[token[1]] : color.trim())
}

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

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// The declarations of the rule with exactly this selector.
const declarationsOf = (selector: string): Record<string, string> => {
  const block = css.match(new RegExp(`(?:^|\\n)${escapeRegExp(selector)} \\{([^}]*)\\}`))
  return Object.fromEntries(
    Array.from((block?.[1] ?? '').matchAll(/^\s*([\w-]+):\s*([^;]+);/gm), ([, property, value]) => [property, value]),
  )
}

// A class's own rule (`.btn-accent {`), not its :hover or :active rules.
const ruleFor = (className: string): Record<string, string> => declarationsOf(`.${className}`)

// A translucent token (`--accent-subtle: rgba(…)`) painted over an opaque background.
const tintOver = (tint: string, background: Rgb): Rgb => {
  const name = tint.trim().match(/^var\((--[\w-]+)\)$/)?.[1] ?? ''
  const [red, green, blue, alpha] = (css.match(new RegExp(`${name}:\\s*rgba\\(([^)]*)\\)`))?.[1] ?? '')
    .split(',')
    .map(Number)
  return [red, green, blue].map((channel, index) => channel * alpha + background[index] * (1 - alpha)) as Rgb
}

// What a class paints behind its text: each stop of its own background, or, when it paints none,
// the surfaces it sits on.
const backgroundsOf = (className: string, surfaces: string[]): [string, Rgb][] => {
  const background = ruleFor(className).background ?? 'transparent'
  const colors = Array.from(background.matchAll(/var\(--[\w-]+\)|#[0-9a-fA-F]{3,6}\b/g), ([color]) => color)
  const paints = colors.length > 0 ? colors : surfaces
  return paints.map((color) => [color, colorRgb(color)])
}

const PAPER = ['var(--paper-bg)', 'var(--paper-surface)']
const SHELL = ['var(--shell-bg)', 'var(--shell-surface)']

const BUTTON_SURFACES: Record<ButtonVariant, string[]> = {
  attachment: PAPER,
  danger: PAPER,
  primary: PAPER,
  secondary: PAPER,
  shell: SHELL,
  toolbar: PAPER,
}

const ICON_BUTTON_SURFACES: Record<IconButtonVariant, string[]> = {
  'chip-remove': PAPER,
  close: PAPER,
  shell: SHELL,
  toolbar: PAPER,
}

const SPINNER_SURFACES: Record<SpinnerSurface, string[]> = {
  accent: ['var(--accent-deep)', 'var(--accent-deep-hover)'],
  paper: PAPER,
  shell: SHELL,
}

const textCases = [
  ...Object.entries(BUTTON_VARIANT_CLASSES).map(([variant, className]) => ({
    className,
    component: 'Button',
    surfaces: BUTTON_SURFACES[variant as ButtonVariant],
    variant,
  })),
  ...Object.entries(ICON_BUTTON_VARIANT_CLASSES).map(([variant, className]) => ({
    className,
    component: 'IconButton',
    surfaces: ICON_BUTTON_SURFACES[variant as IconButtonVariant],
    variant,
  })),
].flatMap(({ className, component, surfaces, variant }) =>
  backgroundsOf(className, surfaces).map(([background, backgroundRgb]) => ({
    background,
    backgroundRgb,
    className,
    color: ruleFor(className).color,
    component,
    variant,
  })),
)

const spinnerCases = (Object.keys(SPINNER_COLORS) as SpinnerSurface[]).flatMap((surface) =>
  SPINNER_SURFACES[surface].map((background) => ({ arc: SPINNER_COLORS[surface].arc, background, surface })),
)

const readOnlyInputStyle = (TextInput({ readOnly: true }) as React.ReactElement<{ style: React.CSSProperties }>).props
  .style

describe('button and spinner contrast', () => {
  it('should find the tokens it measures in the stylesheet', () => {
    expect(tokens['--paper-bg']).toMatch(/^#/)
    expect(tokens['--paper-surface']).toMatch(/^#/)
    expect(tokens['--shell-bg']).toMatch(/^#/)
    expect(textCases.every(({ color }) => color !== undefined)).toBe(true)
  })

  it('should have no disabled-state button rules', () => {
    expect(css).not.toMatch(/\.(btn-[\w-]+|chip-delete)[^{};]*(:disabled|\[aria-disabled)/)
  })

  it.each(textCases)(
    '$component $variant text ($color) reads at least 4.5:1 on $background',
    ({ backgroundRgb, color }) => {
      expect(contrast(colorRgb(color), backgroundRgb)).toBeGreaterThanOrEqual(4.5)
    },
  )

  it('should keep shell text readable on hover', () => {
    expect(
      contrast(colorRgb(ruleFor('btn-shell').color), colorRgb('var(--shell-surface-hover)')),
    ).toBeGreaterThanOrEqual(4.5)
  })

  it.each(PAPER)('should keep danger text readable on hover over %s', (surface) => {
    const hover = declarationsOf(".btn-ghost-danger:hover:not([aria-busy='true'])")

    expect(contrast(colorRgb(hover.color), tintOver(hover.background, colorRgb(surface)))).toBeGreaterThanOrEqual(4.5)
  })

  it.each(spinnerCases)('$surface spinner arc ($arc) reads at least 3:1 on $background', ({ arc, background }) => {
    expect(contrast(colorRgb(arc), colorRgb(background))).toBeGreaterThanOrEqual(3)
  })

  it('should give the reason bubble readable text and a visible icon', () => {
    const bubble = ruleFor('btn-reason')

    expect(contrast(colorRgb(bubble.color), colorRgb(bubble.background))).toBeGreaterThanOrEqual(4.5)
    expect(contrast(colorRgb('var(--accent)'), colorRgb(bubble.background))).toBeGreaterThanOrEqual(3)
  })

  it.each(PAPER)('read-only input text reads at least 4.5:1 on %s', (background) => {
    expect(contrast(colorRgb(String(readOnlyInputStyle.color)), colorRgb(background))).toBeGreaterThanOrEqual(4.5)
  })
})
