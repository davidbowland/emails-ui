const React = require('react')

const createIcon = (name) => {
  const Icon = (props) => React.createElement('svg', { 'data-testid': `icon-${name}`, ...props })
  Icon.displayName = name
  return Icon
}

module.exports = {
  AlignCenter: createIcon('AlignCenter'),
  AlignLeft: createIcon('AlignLeft'),
  AlignRight: createIcon('AlignRight'),
  ArrowLeft: createIcon('ArrowLeft'),
  ArrowRight: createIcon('ArrowRight'),
  Ban: createIcon('Ban'),
  Bold: createIcon('Bold'),
  ChevronLeft: createIcon('ChevronLeft'),
  ChevronsUp: createIcon('ChevronsUp'),
  Eye: createIcon('Eye'),
  EyeOff: createIcon('EyeOff'),
  Forward: createIcon('Forward'),
  IndentDecrease: createIcon('IndentDecrease'),
  IndentIncrease: createIcon('IndentIncrease'),
  Italic: createIcon('Italic'),
  Link: createIcon('Link'),
  Link2Off: createIcon('Link2Off'),
  LinkOff: createIcon('LinkOff'),
  List: createIcon('List'),
  ListOrdered: createIcon('ListOrdered'),
  LogOut: createIcon('LogOut'),
  Mail: createIcon('Mail'),
  Menu: createIcon('Menu'),
  Palette: createIcon('Palette'),
  Paperclip: createIcon('Paperclip'),
  Pencil: createIcon('Pencil'),
  RemoveFormatting: createIcon('RemoveFormatting'),
  Reply: createIcon('Reply'),
  ReplyAll: createIcon('ReplyAll'),
  Save: createIcon('Save'),
  Send: createIcon('Send'),
  Settings: createIcon('Settings'),
  Shield: createIcon('Shield'),
  Strikethrough: createIcon('Strikethrough'),
  Subscript: createIcon('Subscript'),
  Superscript: createIcon('Superscript'),
  Trash2: createIcon('Trash2'),
  Type: createIcon('Type'),
  Underline: createIcon('Underline'),
}
