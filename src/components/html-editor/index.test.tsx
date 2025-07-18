import '@testing-library/jest-dom'
import { createEvent, fireEvent, render, screen } from '@testing-library/react'
import React from 'react'

import HtmlEditor from './index'

jest.mock('aws-amplify')

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

      const formatButton = (await screen.findByLabelText(label, { selector: 'button' })) as HTMLButtonElement
      fireEvent.click(formatButton)

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

      const formatButton = (await screen.findByLabelText(label, { selector: 'button' })) as HTMLButtonElement
      fireEvent.click(formatButton)

      expect(execCommand).toHaveBeenCalledWith(command)
    })
  })

  describe('format color', () => {
    test.each([
      ['Font color', 'foreColor', 'font-color'],
      ['Background color', 'backColor', 'background-color'],
    ])('expect format %s invokes command %s', async (label, command, testId) => {
      render(<HtmlEditor inputRef={React.createRef<HTMLDivElement>()} />)

      const formatButton = (await screen.findByLabelText(label, { selector: 'button' })) as HTMLButtonElement
      fireEvent.click(formatButton)
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

      const formatButton = (await screen.findByLabelText(/Font size/i, { selector: 'button' })) as HTMLButtonElement
      fireEvent.click(formatButton)
      const sizeItem = (await screen.findByText(label)) as HTMLButtonElement
      fireEvent.click(sizeItem)

      expect(execCommand).toHaveBeenCalledWith('fontSize', false, value)
    })
  })

  describe('format other', () => {
    test.each([
      ['Unlink', 'unlink'],
      ['Remove format', 'removeFormat'],
    ])('expect format other button %s invokes command %s', async (label, command) => {
      render(<HtmlEditor inputRef={React.createRef<HTMLDivElement>()} />)

      const formatButton = (await screen.findByLabelText(label, { selector: 'button' })) as HTMLButtonElement
      fireEvent.click(formatButton)

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

    test('expect link dialog opened when create link clicked', async () => {
      render(<HtmlEditor inputRef={React.createRef<HTMLDivElement>()} />)

      const createLinkButton = (await screen.findByLabelText(/Create link/i, {
        selector: 'button',
      })) as HTMLButtonElement
      fireEvent.click(createLinkButton)

      expect(await screen.findByText(/Add link to email/i)).toBeVisible()
    })

    test('expect link dialog closed when cancel clicked', async () => {
      render(<HtmlEditor inputRef={React.createRef<HTMLDivElement>()} />)

      const createLinkButton = (await screen.findByLabelText(/Create link/i, {
        selector: 'button',
      })) as HTMLButtonElement
      fireEvent.click(createLinkButton)
      await screen.findByText(/Add link to email/i)
      const cancelButton = (await screen.findByText(/Cancel/i, { selector: 'button' })) as HTMLButtonElement
      fireEvent.click(cancelButton)

      expect(screen.queryByText(/Add link to email/i)).not.toBeVisible()
    })

    test('expect link added when link clicked, with range', async () => {
      render(<HtmlEditor inputRef={React.createRef<HTMLDivElement>()} />)

      const createLinkButton = (await screen.findByLabelText(/Create link/i, {
        selector: 'button',
      })) as HTMLButtonElement
      fireEvent.click(createLinkButton)
      const linkTextInput = (await screen.findByLabelText(/Link text/i)) as HTMLInputElement
      fireEvent.change(linkTextInput, { target: { value: 'Google' } })
      const linkValueInput = (await screen.findByLabelText(/Link to add/i)) as HTMLInputElement
      fireEvent.change(linkValueInput, { target: { value: 'https://google.com' } })
      const linkButton = (await screen.findByText(/Link/i, { selector: 'button' })) as HTMLButtonElement
      fireEvent.click(linkButton)

      expect(range.insertNode).toHaveBeenCalledTimes(1)
      expect(screen.queryByText(/Add link to email/i)).not.toBeVisible()
    })

    test('expect link added when link clicked, no range', async () => {
      getSelection.mockReturnValueOnce(undefined)
      render(<HtmlEditor inputRef={React.createRef<HTMLDivElement>()} />)

      const createLinkButton = (await screen.findByLabelText(/Create link/i, {
        selector: 'button',
      })) as HTMLButtonElement
      fireEvent.click(createLinkButton)
      const linkTextInput = (await screen.findByLabelText(/Link text/i)) as HTMLInputElement
      fireEvent.change(linkTextInput, { target: { value: 'Google' } })
      const linkValueInput = (await screen.findByLabelText(/Link to add/i)) as HTMLInputElement
      fireEvent.change(linkValueInput, { target: { value: 'https://google.com' } })
      const linkButton = (await screen.findByText(/Link/i, { selector: 'button' })) as HTMLButtonElement
      fireEvent.click(linkButton)

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

    test('expect initialBody sets message body', async () => {
      const body = '<p>Hello, world!</p>'
      render(<HtmlEditor initialBody={body} inputRef={React.createRef<HTMLDivElement>()} />)

      expect(await screen.findByText(/Hello, world!/i)).toBeInTheDocument()
    })

    test('expect pasting does not work with images', async () => {
      render(<HtmlEditor inputRef={React.createRef<HTMLDivElement>()} />)

      const inputDiv = (await screen.findByLabelText(/Message contents/i)) as HTMLDivElement
      fireEvent(inputDiv, createEvent.paste(inputDiv, pasteEvent))

      expect(pasteEvent.preventDefault).not.toHaveBeenCalled()
    })

    test('expect pasting works with plain text', async () => {
      jest.mocked(pasteEvent).clipboardData.getData.mockReturnValueOnce('')
      render(<HtmlEditor inputRef={React.createRef<HTMLDivElement>()} />)

      const inputDiv = (await screen.findByLabelText(/Message contents/i)) as HTMLDivElement
      fireEvent(inputDiv, createEvent.paste(inputDiv, pasteEvent))

      expect(pasteEvent.preventDefault).not.toHaveBeenCalled()
    })
  })
})
