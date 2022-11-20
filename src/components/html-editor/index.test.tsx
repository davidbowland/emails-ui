import '@testing-library/jest-dom'
import { act, fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { mocked } from 'jest-mock'

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
      act(() => {
        formatButton.click()
      })

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
      act(() => {
        formatButton.click()
      })

      expect(execCommand).toHaveBeenCalledWith(command)
    })
  })

  describe('format other', () => {
    test.each([
      ['Unlink', 'unlink'],
      ['Remove format', 'removeFormat'],
    ])('expect format other button %s invokes command %s', async (label, command) => {
      render(<HtmlEditor inputRef={React.createRef<HTMLDivElement>()} />)

      const formatButton = (await screen.findByLabelText(label, { selector: 'button' })) as HTMLButtonElement
      act(() => {
        formatButton.click()
      })

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
      mocked(getSelection).mockReturnValue(selection)
      mocked(selection).getRangeAt.mockReturnValue(range)
      mocked(range).toString.mockReturnValue('range text')

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
      act(() => {
        createLinkButton.click()
      })

      expect(await screen.findByText(/Add link to email/i)).toBeVisible()
    })

    test('expect link dialog closed when cancel clicked', async () => {
      render(<HtmlEditor inputRef={React.createRef<HTMLDivElement>()} />)

      const createLinkButton = (await screen.findByLabelText(/Create link/i, {
        selector: 'button',
      })) as HTMLButtonElement
      act(() => {
        createLinkButton.click()
      })
      await screen.findByText(/Add link to email/i)
      const cancelButton = (await screen.findByText(/Cancel/i, { selector: 'button' })) as HTMLButtonElement
      act(() => {
        cancelButton.click()
      })

      expect(screen.queryByText(/Add link to email/i)).not.toBeVisible()
    })

    test('expect link added when link clicked, with range', async () => {
      render(<HtmlEditor inputRef={React.createRef<HTMLDivElement>()} />)

      const createLinkButton = (await screen.findByLabelText(/Create link/i, {
        selector: 'button',
      })) as HTMLButtonElement
      act(() => {
        createLinkButton.click()
      })
      const linkTextInput = (await screen.findByLabelText(/Link text/i)) as HTMLInputElement
      act(() => {
        fireEvent.change(linkTextInput, { target: { value: 'Google' } })
      })
      const linkValueInput = (await screen.findByLabelText(/Link to add/i)) as HTMLInputElement
      act(() => {
        fireEvent.change(linkValueInput, { target: { value: 'https://google.com' } })
      })
      const linkButton = (await screen.findByText(/Link/i, { selector: 'button' })) as HTMLButtonElement
      act(() => {
        linkButton.click()
      })

      expect(mocked(range).insertNode).toHaveBeenCalledTimes(1)
      expect(screen.queryByText(/Add link to email/i)).not.toBeVisible()
    })

    test('expect link added when link clicked, no range', async () => {
      getSelection.mockReturnValueOnce(undefined)
      render(<HtmlEditor inputRef={React.createRef<HTMLDivElement>()} />)

      const createLinkButton = (await screen.findByLabelText(/Create link/i, {
        selector: 'button',
      })) as HTMLButtonElement
      act(() => {
        createLinkButton.click()
      })
      const linkTextInput = (await screen.findByLabelText(/Link text/i)) as HTMLInputElement
      act(() => {
        fireEvent.change(linkTextInput, { target: { value: 'Google' } })
      })
      const linkValueInput = (await screen.findByLabelText(/Link to add/i)) as HTMLInputElement
      act(() => {
        fireEvent.change(linkValueInput, { target: { value: 'https://google.com' } })
      })
      const linkButton = (await screen.findByText(/Link/i, { selector: 'button' })) as HTMLButtonElement
      act(() => {
        linkButton.click()
      })

      expect(mocked(range).insertNode).not.toHaveBeenCalled()
      expect(screen.queryByText(/Add link to email/i)).not.toBeVisible()
    })
  })

  describe('body', () => {
    test('expect initialBody sets message body', async () => {
      const body = '<p>Hello, world!</p>'
      render(<HtmlEditor initialBody={body} inputRef={React.createRef<HTMLDivElement>()} />)

      expect(await screen.findByText('Hello, world!')).toBeInTheDocument()
    })
  })
})
