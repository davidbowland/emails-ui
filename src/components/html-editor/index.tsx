import React, { RefObject, useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter'
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft'
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight'
import FormatBoldIcon from '@mui/icons-material/FormatBold'
import FormatClearIcon from '@mui/icons-material/FormatClear'
import FormatColorTextIcon from '@mui/icons-material/FormatColorText'
import FormatIndentDecreaseIcon from '@mui/icons-material/FormatIndentDecrease'
import FormatIndentIncreaseIcon from '@mui/icons-material/FormatIndentIncrease'
import FormatItalicIcon from '@mui/icons-material/FormatItalic'
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered'
import FormatSizeIcon from '@mui/icons-material/FormatSize'
import FormatStrikethroughIcon from '@mui/icons-material/FormatStrikethrough'
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined'
import IconButton from '@mui/material/IconButton'
import InsertLinkIcon from '@mui/icons-material/InsertLink'
import LinkOffIcon from '@mui/icons-material/LinkOff'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import PaletteIcon from '@mui/icons-material/Palette'
import Stack from '@mui/material/Stack'
import SubscriptIcon from '@mui/icons-material/Subscript'
import SuperscriptIcon from '@mui/icons-material/Superscript'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'

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
  { command: 'foreColor', icon: <FormatColorTextIcon />, id: 'font-color', label: 'Font color', value: '#000000' },
  { command: 'backColor', icon: <PaletteIcon />, id: 'background-color', label: 'Background color', value: '#ffffff' },
]

const formatTextButtons = [
  { command: 'bold', icon: <FormatBoldIcon />, label: 'Bold' },
  { command: 'italic', icon: <FormatItalicIcon />, label: 'Italic' },
  { command: 'underline', icon: <FormatUnderlinedIcon />, label: 'Underline' },
  { command: 'strikeThrough', icon: <FormatStrikethroughIcon />, label: 'Strikethrough' },
  { command: 'subscript', icon: <SubscriptIcon />, label: 'Subscript' },
  { command: 'superscript', icon: <SuperscriptIcon />, label: 'Superscript' },
]

const formatParagraphButtons = [
  { command: 'justifyLeft', icon: <FormatAlignLeftIcon />, label: 'Left align' },
  { command: 'justifyCenter', icon: <FormatAlignCenterIcon />, label: 'Center align' },
  { command: 'justifyRight', icon: <FormatAlignRightIcon />, label: 'Right align' },
  { command: 'outdent', icon: <FormatIndentDecreaseIcon />, label: 'Decrease indent' },
  { command: 'indent', icon: <FormatIndentIncreaseIcon />, label: 'Increase indent' },
  { command: 'insertOrderedList', icon: <FormatListNumberedIcon />, label: 'Numbered list' },
  { command: 'insertUnorderedList', icon: <FormatListBulletedIcon />, label: 'Bulleted list' },
]

export interface HtmlEditorProps {
  initialBody?: string
  inputRef: RefObject<HTMLDivElement>
}

const HtmlEditor = ({ initialBody, inputRef }: HtmlEditorProps): JSX.Element => {
  const [linkErrorMessage, setLinkErrorMessage] = useState<string | undefined>(undefined)
  const [linkRange, setLinkRange] = useState<Range | undefined>(undefined)
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
      <Box>
        <Box component="span" sx={{ display: { sm: 'inline-block', xs: 'initial' } }}>
          {formatTextButtons.map((button, index) => (
            <Tooltip key={index} title={button.label}>
              <IconButton onClick={() => handleButtonClick(button.command)}>{button.icon}</IconButton>
            </Tooltip>
          ))}
        </Box>
        <Divider component="span" orientation="vertical" />
        <Box component="span" sx={{ display: { sm: 'inline-block', xs: 'initial' } }}>
          {formatParagraphButtons.map((button, index) => (
            <Tooltip key={index} title={button.label}>
              <IconButton onClick={() => handleButtonClick(button.command)}>{button.icon}</IconButton>
            </Tooltip>
          ))}
        </Box>
        <Divider component="span" orientation="vertical" />
        <Box component="span" sx={{ display: { sm: 'inline-block', xs: 'initial' } }}>
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
              <Tooltip title={button.label}>
                <IconButton onClick={() => document.getElementById(button.id)?.click()}>{button.icon}</IconButton>
              </Tooltip>
            </React.Fragment>
          ))}
          <Tooltip title="Font size">
            <IconButton onClick={(event) => setSizeMenuEl(event.currentTarget)}>
              <FormatSizeIcon />
            </IconButton>
          </Tooltip>
          <Divider component="span" orientation="vertical" />
          <Tooltip title="Create link">
            <IconButton onClick={linkDialogOpen}>
              <InsertLinkIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Unlink">
            <IconButton onClick={() => handleButtonClick('unlink')}>
              <LinkOffIcon />
            </IconButton>
          </Tooltip>
          <Divider component="span" orientation="vertical" />
          <Tooltip title="Remove format">
            <IconButton onClick={() => handleButtonClick('removeFormat')}>
              <FormatClearIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <Box border={1} padding={1}>
        <div
          aria-label="Message contents"
          contentEditable={true}
          onPaste={handlePasteEvent}
          ref={inputRef}
          style={{ minHeight: '20vh' }}
        ></div>
      </Box>
      <Menu anchorEl={sizeMenuEl} onClose={sizeMenuClose} open={!!sizeMenuEl}>
        {fontSizeOptions.map((size, index) => (
          <MenuItem key={index} onClick={() => handleFontSizeSelect(size.value)}>
            {size.label}
          </MenuItem>
        ))}
      </Menu>
      <Dialog
        aria-describedby="What link should the selected text have?"
        aria-labelledby="Add link to email"
        onClose={linkDialogClose}
        open={showLinkDialog}
      >
        <DialogTitle>Add link to email</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <label>
              <TextField
                error={!linkText}
                fullWidth
                helperText={linkText ? undefined : 'Link text is required'}
                label="Link text"
                name="link-text"
                onChange={(event) => setLinkText(event.target.value)}
                sx={{ maxWidth: '100%', width: '450px' }}
                type="text"
                value={linkText}
                variant="filled"
              />
            </label>
            <label>
              <TextField
                error={linkErrorMessage !== undefined}
                fullWidth
                helperText={linkErrorMessage}
                label="Link to add"
                name="link-to-add"
                onChange={(event) => setLinkTarget(event.target.value)}
                sx={{ maxWidth: '100%', width: '450px' }}
                type="text"
                value={linkTarget}
                variant="filled"
              />
            </label>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={linkDialogClose}>
            Cancel
          </Button>
          <Button disabled={!linkText || linkErrorMessage !== undefined} onClick={handleLinkDialogClick}>
            Link
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default HtmlEditor
