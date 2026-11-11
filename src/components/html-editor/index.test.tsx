import React from 'react'

import HtmlEditor from './index'
import '@testing-library/jest-dom'
import { createEvent, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

jest.mock('@components/ui/dialog', () => {
  const React = require('react')
  // eslint-disable-next-line react/display-name
  return ({ cancelLabel, children, confirmLabel, onCancel, onConfirm, open, title }: any) =>
    React.createElement(
      'div',
      { style: open ? undefined : { display: 'none' } },
      React.createElement('span', null, title),
      children,
      React.createElement('button', { onClick: onCancel }, cancelLabel),
      React.createElement('button', { onClick: onConfirm }, confirmLabel),
    )
})

describe('HtmlEditor component', () => {
  const execCommand = jest.fn()

  beforeAll(() => {
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execCommand,
    })
  })

  describe('format text', () => {
    test.each([
      ['Bold', 'bold'],
      ['Italic', 'italic'],
      ['Underline', 'underline'],
      ['Strikethrough', 'strikeThrough'],
      ['Subscript', 'subscript'],
      ['Superscript', 'superscript'],
    ])('expect format text button %s invokes command %s', async (label, command) => {
      render(<HtmlEditor inputRef={React.createRef<HTMLDivElement>()} />)

      await userEvent.click(await screen.findByRole('button', { name: label }))

      expect(execCommand).toHaveBeenCalledWith(command)
    })
  })

  describe('format paragraph', () => {
    test.each([
      ['Left align', 'justifyLeft'],
      ['Center align', 'justifyCenter'],
      ['Right align', 'justifyRight'],
      ['Decrease indent', 'outdent'],
      ['Increase indent', 'indent'],
      ['Numbered list', 'insertOrderedList'],
      ['Bulleted list', 'insertUnorderedList'],
    ])('expect format paragraph button %s invokes command %s', async (label, command) => {
      render(<HtmlEditor inputRef={React.createRef<HTMLDivElement>()} />)

      await userEvent.click(await screen.findByRole('button', { name: label }))

      expect(execCommand).toHaveBeenCalledWith(command)
    })
  })

  describe('format color', () => {
    test.each([
      ['Font color', 'foreColor', 'font-color'],
      ['Background color', 'backColor', 'background-color'],
    ])('expect format %s invokes command %s', async (label, command, testId) => {
      render(<HtmlEditor inputRef={React.createRef<HTMLDivElement>()} />)

      await userEvent.click(await screen.findByRole('button', { name: label }))
      // userEvent can't drive a native color picker, so the change is fired directly.
      const colorInput = (await screen.findByTestId(testId)) as HTMLInputElement
      fireEvent.change(colorInput, { target: { value: '#123456' } })

      expect(execCommand).toHaveBeenCalledWith(command, false, '#123456')
    })
  })

  describe('format size', () => {
    test.each([
      ['Extra small', '1'],
      ['Small', '2'],
      ['Normal', '3'],
      ['Large', '4'],
      ['Extra large', '5'],
      ['XX Large', '6'],
      ['Huge', '7'],
    ])('expect font size %s invokes command with value %s', async (label, value) => {
      render(<HtmlEditor inputRef={React.createRef<HTMLDivElement>()} />)

      await userEvent.click(await screen.findByRole('button', { name: /Font size/i }))
      await userEvent.click(await screen.findByRole('option', { name: label }))

      expect(execCommand).toHaveBeenCalledWith('fontSize', false, value)
    })
  })

  it('should keep the tooltip on each toolbar button', async () => {
    render(<HtmlEditor inputRef={React.createRef<HTMLDivElement>()} />)

    expect(await screen.findByRole('button', { name: 'Bold' })).toHaveAttribute('title', 'Bold')
    expect(screen.getByRole('button', { name: 'Font size' })).toHaveAttribute('title', 'Font size')
  })

  describe('format other', () => {
    test.each([
      ['Unlink', 'unlink'],
      ['Remove format', 'removeFormat'],
    ])('expect format other button %s invokes command %s', async (label, command) => {
      render(<HtmlEditor inputRef={React.createRef<HTMLDivElement>()} />)

      await userEvent.click(await screen.findByRole('button', { name: label }))

      expect(execCommand).toHaveBeenCalledWith(command)
    })
  })

  describe('create link', () => {
    const getSelection = jest.fn()
    const selection = {
      getRangeAt: jest.fn(),
    }
    const range = {
      deleteContents: jest.fn(),
      insertNode: jest.fn(),
      toString: jest.fn(),
    }

    beforeAll(() => {
      jest.mocked(getSelection).mockReturnValue(selection)
      jest.mocked(selection).getRangeAt.mockReturnValue(range)
      jest.mocked(range).toString.mockReturnValue('range text')

      Object.defineProperty(window, 'getSelection', {
        configurable: true,
        value: getSelection,
      })
    })

    it('expect link dialog opened when create link clicked', async () => {
      render(<HtmlEditor inputRef={React.createRef<HTMLDivElement>()} />)

      await userEvent.click(await screen.findByRole('button', { name: /Create link/i }))

      expect(await screen.findByText(/Add link to email/i)).toBeVisible()
    })

    it('expect link dialog closed when cancel clicked', async () => {
      render(<HtmlEditor inputRef={React.createRef<HTMLDivElement>()} />)

      await userEvent.click(await screen.findByRole('button', { name: /Create link/i }))
      await screen.findByText(/Add link to email/i)
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(screen.queryByText(/Add link to email/i)).not.toBeVisible()
    })

    it('expect link added when link clicked, with range', async () => {
      render(<HtmlEditor inputRef={React.createRef<HTMLDivElement>()} />)

      await userEvent.click(await screen.findByRole('button', { name: /Create link/i }))
      const linkTextInput = await screen.findByRole('textbox', { name: 'Link text' })
      await userEvent.clear(linkTextInput)
      await userEvent.type(linkTextInput, 'Google')
      await userEvent.type(screen.getByRole('textbox', { name: 'Link to add' }), 'https://google.com')
      await userEvent.click(screen.getByRole('button', { name: 'Add link' }))

      expect(range.insertNode).toHaveBeenCalledTimes(1)
      expect(screen.queryByText(/Add link to email/i)).not.toBeVisible()
    })

    it('expect link added when link clicked, no range', async () => {
      getSelection.mockReturnValueOnce(undefined)
      render(<HtmlEditor inputRef={React.createRef<HTMLDivElement>()} />)

      await userEvent.click(await screen.findByRole('button', { name: /Create link/i }))
      const linkTextInput = await screen.findByRole('textbox', { name: 'Link text' })
      await userEvent.clear(linkTextInput)
      await userEvent.type(linkTextInput, 'Google')
      await userEvent.type(screen.getByRole('textbox', { name: 'Link to add' }), 'https://google.com')
      await userEvent.click(screen.getByRole('button', { name: 'Add link' }))

      expect(range.insertNode).not.toHaveBeenCalled()
      expect(screen.queryByText(/Add link to email/i)).not.toBeVisible()
    })
  })

  describe('body', () => {
    const pasteEvent = {
      clipboardData: {
        getData: jest.fn(),
      },
      preventDefault: jest.fn(),
    }

    beforeAll(() => {
      jest.mocked(pasteEvent).clipboardData.getData.mockReturnValue('pasted text')
    })

    it('expect initialBody sets message body', async () => {
      const body = '<p>Hello, world!</p>'
      render(<HtmlEditor initialBody={body} inputRef={React.createRef<HTMLDivElement>()} />)

      expect(await screen.findByText(/Hello, world!/i)).toBeInTheDocument()
    })

    it('expect pasting does not work with images', async () => {
      render(<HtmlEditor inputRef={React.createRef<HTMLDivElement>()} />)

      const inputDiv = (await screen.findByLabelText(/Message contents/i)) as HTMLDivElement
      fireEvent(inputDiv, createEvent.paste(inputDiv, pasteEvent))

      expect(pasteEvent.preventDefault).not.toHaveBeenCalled()
    })

    it('expect pasting works with plain text', async () => {
      jest.mocked(pasteEvent).clipboardData.getData.mockReturnValueOnce('')
      render(<HtmlEditor inputRef={React.createRef<HTMLDivElement>()} />)

      const inputDiv = (await screen.findByLabelText(/Message contents/i)) as HTMLDivElement
      fireEvent(inputDiv, createEvent.paste(inputDiv, pasteEvent))

      expect(pasteEvent.preventDefault).not.toHaveBeenCalled()
    })
  })
})
