import { readFileSync } from 'fs'
import { join } from 'path'
import React from 'react'

import {
  LIST_SELECTED_TEXT_COLOR,
  LIST_TEXT_COLOR,
  ListRowState,
  listSenderStyle,
  listSubjectStyle,
  listTimeStyle,
} from './elements'

// AC-035: subject, sender and time text in the mailbox list read at least 4.5:1 against
// --shell-bg on unread, read and selected rows. The token values come from the stylesheet itself,
// so a token change that breaks the bar fails here.
type Rgb = [number, number, number]

const css = readFileSync(join(__dirname, '../../assets/css/index.css'), 'utf8')

const tokens: Record<string, string> = Object.fromEntries(
  Array.from(css.matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g), ([, name, value]) => [name, value]),
)

const toRgb = (hex: string): Rgb => [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16)) as Rgb

const tokenRgb = (name: string): Rgb => toRgb(tokens[name])

const varName = (color: string): string => color.replace(/^var\((--[\w-]+)\)$/, '$1')

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

// The background a row actually paints: an unselected row under the pointer gets
// --shell-surface-hover, and a selected row gets --accent at up to 14% over the shell
// (mailbox/index.tsx).
const hoverBackground = tokenRgb('--shell-surface-hover')
const selectedBackground = blend(tokenRgb('--accent'), 0.14, tokenRgb('--shell-bg'))

const states: [string, ListRowState, Rgb][] = [
  ['unread', { isSelected: false, isUnread: true }, hoverBackground],
  ['read', { isSelected: false, isUnread: false }, hoverBackground],
  ['selected unread', { isSelected: true, isUnread: true }, selectedBackground],
  ['selected read', { isSelected: true, isUnread: false }, selectedBackground],
]

const fields: [string, (state: ListRowState) => React.CSSProperties][] = [
  ['subject', listSubjectStyle],
  ['sender', listSenderStyle],
  ['time', listTimeStyle],
]

const cases = fields.flatMap(([field, style]) =>
  states.map(([state, rowState, rowBackground]) => ({ field, rowBackground, state, style: style(rowState) })),
)

describe('mailbox list contrast', () => {
  it('should find the tokens it measures in the stylesheet', () => {
    expect(tokens['--shell-bg']).toMatch(/^#/)
    expect(tokens[varName(LIST_TEXT_COLOR)]).toMatch(/^#/)
    expect(tokens[varName(LIST_SELECTED_TEXT_COLOR)]).toMatch(/^#/)
  })

  describe('listSubjectStyle, listSenderStyle and listTimeStyle', () => {
    it.each(cases)('$field text on a $state row reads at least 4.5:1 on --shell-bg', ({ style }) => {
      expect(contrast(tokenRgb(varName(String(style.color))), tokenRgb('--shell-bg'))).toBeGreaterThanOrEqual(4.5)
    })

    it.each(cases)('$field text on a $state row is not faded', ({ style }) => {
      expect(style.opacity ?? 1).toEqual(1)
    })

    it.each(cases)(
      '$field text on a $state row reads at least 4.5:1 on the row background',
      ({ rowBackground, style }) => {
        expect(contrast(tokenRgb(varName(String(style.color))), rowBackground)).toBeGreaterThanOrEqual(4.5)
      },
    )
  })

  it('should mark unread rows by weight, not by color alone', () => {
    const unread = listSubjectStyle({ isSelected: false, isUnread: true })
    const read = listSubjectStyle({ isSelected: false, isUnread: false })

    expect(unread.color).toEqual(read.color)
    expect(unread.fontWeight).toEqual(600)
    expect(read.fontWeight).toEqual(400)
  })
})
