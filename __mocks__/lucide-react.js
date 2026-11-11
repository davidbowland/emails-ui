const React = require('react')

// Forwards every prop (size, strokeWidth, role, aria-*) to the svg so tests can read them as attributes.
const createIcon = (name) => {
  const Icon = (props) => React.createElement('svg', { 'data-testid': `icon-${name}`, ...props })
  Icon.displayName = name
  return Icon
}

const names = [
  'AlertCircle',
  'AlignCenter',
  'AlignLeft',
  'AlignRight',
  'AppWindow',
  'ArrowLeft',
  'ArrowRight',
  'Ban',
  'Bold',
  'Check',
  'ChevronDown',
  'CloudOff',
  'Download',
  'EllipsisVertical',
  'Eye',
  'EyeOff',
  'Forward',
  'Inbox',
  'IndentDecrease',
  'IndentIncrease',
  'Italic',
  'LayoutGrid',
  'Link',
  'Link2Off',
  'List',
  'ListOrdered',
  'LogOut',
  'Mail',
  'Menu',
  'Palette',
  'Paperclip',
  'Pencil',
  'RemoveFormatting',
  'Reply',
  'ReplyAll',
  'RotateCw',
  'Save',
  'Send',
  'Settings',
  'Shield',
  'ShieldAlert',
  'ShieldCheck',
  'Smartphone',
  'Strikethrough',
  'Subscript',
  'Superscript',
  'Trash2',
  'TriangleAlert',
  'Type',
  'Underline',
  'WifiOff',
  'X',
]

module.exports = Object.fromEntries(names.map((name) => [name, createIcon(name)]))
