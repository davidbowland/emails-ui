import React, { RefObject, useEffect, useRef, useState } from 'react'

import { ToolbarButton, ToolbarDivider } from './elements'
import Button from '@components/ui/button'
import ColorInput from '@components/ui/color-input'
import Dialog from '@components/ui/dialog'
import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  IndentDecreaseIcon,
  IndentIncreaseIcon,
  ItalicIcon,
  LinkIcon,
  LinkOffIcon,
  ListIcon,
  ListOrderedIcon,
  PaletteIcon,
  RemoveFormattingIcon,
  StrikethroughIcon,
  SubscriptIcon,
  SuperscriptIcon,
  TypeIcon,
  UnderlineIcon,
} from '@components/ui/icons'
import TextInput from '@components/ui/text-input'

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
  { command: 'foreColor', icon: TypeIcon, id: 'font-color', label: 'Font color', value: '#000000' },
  {
    command: 'backColor',
    icon: PaletteIcon,
    id: 'background-color',
    label: 'Background color',
    value: '#ffffff',
  },
]

const formatTextButtons = [
  { command: 'bold', icon: BoldIcon, label: 'Bold' },
  { command: 'italic', icon: ItalicIcon, label: 'Italic' },
  { command: 'underline', icon: UnderlineIcon, label: 'Underline' },
  { command: 'strikeThrough', icon: StrikethroughIcon, label: 'Strikethrough' },
  { command: 'subscript', icon: SubscriptIcon, label: 'Subscript' },
  { command: 'superscript', icon: SuperscriptIcon, label: 'Superscript' },
]

const formatParagraphButtons = [
  { command: 'justifyLeft', icon: AlignLeftIcon, label: 'Left align' },
  { command: 'justifyCenter', icon: AlignCenterIcon, label: 'Center align' },
  { command: 'justifyRight', icon: AlignRightIcon, label: 'Right align' },
  { command: 'outdent', icon: IndentDecreaseIcon, label: 'Decrease indent' },
  { command: 'indent', icon: IndentIncreaseIcon, label: 'Increase indent' },
  { command: 'insertOrderedList', icon: ListOrderedIcon, label: 'Numbered list' },
  { command: 'insertUnorderedList', icon: ListIcon, label: 'Bulleted list' },
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
  const sizeMenuRef = useRef<HTMLDivElement>(null)

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
    sizeMenuEl?.focus()
  }

  useEffect(() => {
    if (!sizeMenuEl) return
    const firstOption = sizeMenuRef.current?.querySelector<HTMLElement>('button')
    firstOption?.focus()
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') sizeMenuClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [sizeMenuEl])

  useEffect(() => {
    try {
      new URL(linkTarget)
      setLinkErrorMessage(undefined)
    } catch {
      setLinkErrorMessage('Enter a valid URL — for example, https://example.com')
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
            <ToolbarButton
              icon={button.icon}
              key={index}
              label={button.label}
              onClick={() => handleButtonClick(button.command)}
            />
          ))}
        </span>
        <ToolbarDivider />
        <span className="inline-flex">
          {formatParagraphButtons.map((button, index) => (
            <ToolbarButton
              icon={button.icon}
              key={index}
              label={button.label}
              onClick={() => handleButtonClick(button.command)}
            />
          ))}
        </span>
        <ToolbarDivider />
        <span className="inline-flex">
          {formatColorButtons.map((button, index) => (
            <React.Fragment key={index}>
              <ColorInput
                data-testid={button.id}
                id={button.id}
                label={button.label}
                onChange={(value) => handleColorChange(button.command, value)}
                value={button.value}
              />
              <ToolbarButton
                icon={button.icon}
                label={button.label}
                onClick={() => document.getElementById(button.id)?.click()}
              />
            </React.Fragment>
          ))}
          <ToolbarButton icon={TypeIcon} label="Font size" onClick={(event) => setSizeMenuEl(event.currentTarget)} />
          <ToolbarDivider />
          <ToolbarButton icon={LinkIcon} label="Create link" onClick={linkDialogOpen} />
          <ToolbarButton icon={LinkOffIcon} label="Unlink" onClick={() => handleButtonClick('unlink')} />
          <ToolbarDivider />
          <ToolbarButton
            icon={RemoveFormattingIcon}
            label="Remove format"
            onClick={() => handleButtonClick('removeFormat')}
          />
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
          aria-multiline="true"
          contentEditable={true}
          onPaste={handlePasteEvent}
          ref={inputRef}
          role="textbox"
          style={{ minHeight: '180px', outline: 'none' }}
        />
      </div>

      {/* Font size dropdown */}
      {sizeMenuEl && (
        <div
          aria-label="Font size"
          className="absolute z-50 rounded-lg overflow-hidden"
          ref={sizeMenuRef}
          role="listbox"
          style={{
            background: 'var(--paper-bg)',
            border: '1px solid var(--paper-border)',
            boxShadow: 'var(--shadow-md)',
            minWidth: '140px',
          }}
        >
          {fontSizeOptions.map((size, index) => (
            // The toolbar variant gives the hover; the option keeps its square, full-width row.
            <Button
              className="w-full px-4 py-2 text-left text-sm transition-colors"
              key={index}
              onClick={() => handleFontSizeSelect(size.value)}
              role="option"
              style={{
                borderRadius: 0,
                color: 'var(--text-paper)',
                display: 'block',
                fontFamily: 'Outfit, sans-serif',
              }}
              variant="toolbar"
            >
              {size.label}
            </Button>
          ))}
        </div>
      )}

      <Dialog
        cancelLabel="Cancel"
        confirmLabel="Add link"
        onCancel={linkDialogClose}
        onConfirm={handleLinkDialogClick}
        open={showLinkDialog}
        title="Add link to email"
      >
        <div className="flex flex-col gap-4">
          <label>
            <TextInput
              aria-label="Link text"
              className="text-sm"
              name="link-text"
              onChange={(event) => setLinkText(event.target.value)}
              placeholder="Link text"
              style={{ maxWidth: '450px', padding: '8px 12px' }}
              value={linkText}
            />
            {!linkText && (
              <p className="mt-1 text-xs" style={{ color: 'var(--accent)', fontFamily: 'Outfit, sans-serif' }}>
                Link text is required
              </p>
            )}
          </label>
          <label>
            <TextInput
              aria-label="Link to add"
              className="text-sm"
              name="link-to-add"
              onChange={(event) => setLinkTarget(event.target.value)}
              placeholder="https://…"
              style={{ fontFamily: 'IBM Plex Mono, monospace', maxWidth: '450px', padding: '8px 12px' }}
              value={linkTarget}
            />
            {linkErrorMessage && (
              <p className="mt-1 text-xs" style={{ color: 'var(--accent)', fontFamily: 'Outfit, sans-serif' }}>
                {linkErrorMessage}
              </p>
            )}
          </label>
        </div>
      </Dialog>
    </>
  )
}

export default HtmlEditor
