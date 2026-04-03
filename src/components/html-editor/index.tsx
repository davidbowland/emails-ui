import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Link,
  Link2Off,
  List,
  ListOrdered,
  Palette,
  RemoveFormatting,
  Strikethrough,
  Subscript,
  Superscript,
  Type,
  Underline,
} from 'lucide-react'
import React, { RefObject, useEffect, useState } from 'react'

import { ToolbarButton, ToolbarDivider } from './elements'
import ConfirmDialog from '@components/confirm-dialog'

const fontSizeOptions = [
  { label: 'Extra small', value: '1' },
  { label: 'Small', value: '2' },
  { label: 'Normal', value: '3' },
  { label: 'Large', value: '4' },
  { label: 'Extra large', value: '5' },
  { label: 'XX Large', value: '6' },
  { label: 'Huge', value: '7' },
]

const formatColorButtons = [
  { command: 'foreColor', icon: <Type size={15} />, id: 'font-color', label: 'Font color', value: '#000000' },
  {
    command: 'backColor',
    icon: <Palette size={15} />,
    id: 'background-color',
    label: 'Background color',
    value: '#ffffff',
  },
]

const formatTextButtons = [
  { command: 'bold', icon: <Bold size={15} />, label: 'Bold' },
  { command: 'italic', icon: <Italic size={15} />, label: 'Italic' },
  { command: 'underline', icon: <Underline size={15} />, label: 'Underline' },
  { command: 'strikeThrough', icon: <Strikethrough size={15} />, label: 'Strikethrough' },
  { command: 'subscript', icon: <Subscript size={15} />, label: 'Subscript' },
  { command: 'superscript', icon: <Superscript size={15} />, label: 'Superscript' },
]

const formatParagraphButtons = [
  { command: 'justifyLeft', icon: <AlignLeft size={15} />, label: 'Left align' },
  { command: 'justifyCenter', icon: <AlignCenter size={15} />, label: 'Center align' },
  { command: 'justifyRight', icon: <AlignRight size={15} />, label: 'Right align' },
  { command: 'outdent', icon: <IndentDecrease size={15} />, label: 'Decrease indent' },
  { command: 'indent', icon: <IndentIncrease size={15} />, label: 'Increase indent' },
  { command: 'insertOrderedList', icon: <ListOrdered size={15} />, label: 'Numbered list' },
  { command: 'insertUnorderedList', icon: <List size={15} />, label: 'Bulleted list' },
]

export interface HtmlEditorProps {
  initialBody?: string
  inputRef: RefObject<HTMLDivElement | null>
}

const HtmlEditor = ({ initialBody, inputRef }: HtmlEditorProps): React.ReactNode => {
  const [linkErrorMessage, setLinkErrorMessage] = useState<string | undefined>()
  const [linkRange, setLinkRange] = useState<Range | undefined>()
  const [linkTarget, setLinkTarget] = useState('')
  const [linkText, setLinkText] = useState('')
  const [sizeMenuEl, setSizeMenuEl] = useState<HTMLButtonElement | null>(null)
  const [showLinkDialog, setShowLinkDialog] = useState(false)

  const handleButtonClick = (command: string): void => {
    document.execCommand(command)
  }

  const handleColorChange = (command: string, value: string): void => {
    document.execCommand(command, false, value)
  }

  const handleFontSizeSelect = (value: string): void => {
    document.execCommand('fontSize', false, value)
    sizeMenuClose()
  }

  const handleLinkDialogClick = (): void => {
    linkDialogClose()

    const a = document.createElement('a')
    a.href = linkTarget
    a.textContent = linkText
    if (linkRange) {
      linkRange.deleteContents()
      linkRange.insertNode(a)
    } else {
      inputRef.current?.insertBefore(a, null)
    }
  }

  const handlePasteEvent = (event: React.ClipboardEvent<HTMLDivElement>): void => {
    if (!event.clipboardData.getData('text')) {
      event.preventDefault()
    }
  }

  const linkDialogClose = (): void => {
    setShowLinkDialog(false)
  }

  const linkDialogOpen = (): void => {
    const range = window.getSelection()?.getRangeAt(0)
    setLinkErrorMessage(undefined)
    setLinkRange(range)
    setLinkTarget('')
    setLinkText(range?.toString() ?? '')
    setShowLinkDialog(true)
  }

  const sizeMenuClose = (): void => {
    setSizeMenuEl(null)
  }

  useEffect(() => {
    try {
      new URL(linkTarget)
      setLinkErrorMessage(undefined)
    } catch (error) {
      setLinkErrorMessage('Invalid URL')
    }
  }, [linkTarget])

  useEffect(() => {
    if (initialBody && inputRef.current) {
      inputRef.current.innerHTML = initialBody
    }
  }, [])

  return (
    <>
      {/* Toolbar */}
      <div
        className="mb-2 flex flex-wrap items-center rounded-md px-1 py-1"
        style={{
          background: 'var(--paper-surface)',
          border: '1px solid var(--paper-border)',
        }}
      >
        <span className="inline-flex">
          {formatTextButtons.map((button, index) => (
            <ToolbarButton key={index} label={button.label} onClick={() => handleButtonClick(button.command)}>
              {button.icon}
            </ToolbarButton>
          ))}
        </span>
        <ToolbarDivider />
        <span className="inline-flex">
          {formatParagraphButtons.map((button, index) => (
            <ToolbarButton key={index} label={button.label} onClick={() => handleButtonClick(button.command)}>
              {button.icon}
            </ToolbarButton>
          ))}
        </span>
        <ToolbarDivider />
        <span className="inline-flex">
          {formatColorButtons.map((button, index) => (
            <React.Fragment key={index}>
              <input
                data-testid={button.id}
                id={button.id}
                onChange={(event) => handleColorChange(button.command, event.target.value)}
                style={{ display: 'none' }}
                type="color"
                value={button.value}
              />
              <ToolbarButton label={button.label} onClick={() => document.getElementById(button.id)?.click()}>
                {button.icon}
              </ToolbarButton>
            </React.Fragment>
          ))}
          <ToolbarButton label="Font size" onClick={(event: any) => setSizeMenuEl(event.currentTarget)}>
            <Type size={15} />
          </ToolbarButton>
          <ToolbarDivider />
          <ToolbarButton label="Create link" onClick={linkDialogOpen}>
            <Link size={15} />
          </ToolbarButton>
          <ToolbarButton label="Unlink" onClick={() => handleButtonClick('unlink')}>
            <Link2Off size={15} />
          </ToolbarButton>
          <ToolbarDivider />
          <ToolbarButton label="Remove format" onClick={() => handleButtonClick('removeFormat')}>
            <RemoveFormatting size={15} />
          </ToolbarButton>
        </span>
      </div>

      {/* Editor area */}
      <div
        className="rounded-md p-4"
        style={{
          border: '1px solid var(--paper-border)',
          background: 'var(--paper-surface)',
          minHeight: '200px',
        }}
      >
        <div
          aria-label="Message contents"
          contentEditable={true}
          onPaste={handlePasteEvent}
          ref={inputRef}
          style={{ minHeight: '180px', outline: 'none' }}
        />
      </div>

      {/* Font size dropdown */}
      {sizeMenuEl && (
        <div
          className="absolute z-50 rounded-lg overflow-hidden"
          style={{
            background: 'var(--paper-bg)',
            border: '1px solid var(--paper-border)',
            boxShadow: 'var(--shadow-md)',
            minWidth: '140px',
          }}
        >
          {fontSizeOptions.map((size, index) => (
            <button
              className="block w-full px-4 py-2 text-left text-sm transition-colors"
              key={index}
              onClick={() => handleFontSizeSelect(size.value)}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--paper-border)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              style={{ color: 'var(--text-paper)', fontFamily: 'Outfit, sans-serif' }}
            >
              {size.label}
            </button>
          ))}
        </div>
      )}

      <ConfirmDialog
        cancelLabel="Cancel"
        confirmLabel="Link"
        onCancel={linkDialogClose}
        onConfirm={handleLinkDialogClick}
        open={showLinkDialog}
        title="Add link to email"
      >
        <div className="flex flex-col gap-4">
          <label>
            <input
              aria-label="Link text"
              className="w-full rounded-md px-3 py-2 text-sm outline-none"
              name="link-text"
              onChange={(event) => setLinkText(event.target.value)}
              placeholder="Link text"
              style={{
                background: 'var(--paper-surface)',
                border: '1px solid var(--paper-border)',
                color: 'var(--text-paper)',
                fontFamily: 'Outfit, sans-serif',
                maxWidth: '450px',
              }}
              type="text"
              value={linkText}
            />
            {!linkText && (
              <p className="mt-1 text-xs" style={{ color: 'var(--accent)', fontFamily: 'Outfit, sans-serif' }}>
                Link text is required
              </p>
            )}
          </label>
          <label>
            <input
              aria-label="Link to add"
              className="w-full rounded-md px-3 py-2 text-sm outline-none"
              name="link-to-add"
              onChange={(event) => setLinkTarget(event.target.value)}
              placeholder="https://…"
              style={{
                background: 'var(--paper-surface)',
                border: '1px solid var(--paper-border)',
                color: 'var(--text-paper)',
                fontFamily: 'IBM Plex Mono, monospace',
                maxWidth: '450px',
              }}
              type="text"
              value={linkTarget}
            />
            {linkErrorMessage && (
              <p className="mt-1 text-xs" style={{ color: 'var(--accent)', fontFamily: 'Outfit, sans-serif' }}>
                {linkErrorMessage}
              </p>
            )}
          </label>
        </div>
      </ConfirmDialog>
    </>
  )
}

export default HtmlEditor
