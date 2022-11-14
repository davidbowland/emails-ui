import '@testing-library/jest-dom'
import { act, render, screen } from '@testing-library/react'
import DOMPurify from 'dompurify'
import React from 'react'
import { mocked } from 'jest-mock'

import { accountId, attachmentContents, emailContents, emailId } from '@test/__mocks__'
import { EmailContents } from '@types'
import EmailViewer from './index'

jest.mock('aws-amplify')
jest.mock('dompurify')

describe('Email viewer component', () => {
  const style = ['background-url', 'color'] as any
  style['background-url'] = 'url("https://dbowland.com/jest-email-viewer")'
  style['color'] = 'blue'
  style.removeProperty = jest.fn()

  const node = {
    getAttribute: jest.fn(),
    hasAttribute: jest.fn(),
    removeAttribute: jest.fn(),
    setAttribute: jest.fn(),
    style,
  }

  const deleteReceivedEmail = jest.fn()
  const getReceivedAttachment = jest.fn()
  const hookMock = jest.fn()

  beforeAll(() => {
    mocked(DOMPurify).addHook.mockImplementation((hook: string) => hookMock(hook))
    mocked(DOMPurify).sanitize.mockImplementation((source: string | Node) => source as any)
    getReceivedAttachment.mockResolvedValue(attachmentContents)
  })

  describe('general', () => {
    test('expect from shows correctly', async () => {
      const emailNoFromName = {
        ...emailContents,
        fromAddress: { value: [{ address: 'some@domain.com' }] },
      } as unknown as EmailContents
      render(
        <EmailViewer
          accountId={accountId}
          email={emailNoFromName}
          emailId={emailId}
          getAttachment={getReceivedAttachment}
        />
      )

      expect(await screen.findByText(/some@domain.com/i)).toBeVisible()
    })
  })

  describe('DOMPurify sanitizer', () => {
    test('expect email viewer shows html', async () => {
      render(
        <EmailViewer
          accountId={accountId}
          email={emailContents}
          emailId={emailId}
          getAttachment={getReceivedAttachment}
        />
      )

      expect(await screen.findByText(/7:47/i)).toBeVisible()
    })

    test('expect email viewer shows text when no html', async () => {
      const emailNoHtml = { ...emailContents, attachments: undefined, bodyHtml: undefined } as unknown as EmailContents
      render(
        <EmailViewer
          accountId={accountId}
          email={emailNoHtml}
          emailId={emailId}
          getAttachment={getReceivedAttachment}
        />
      )

      expect(await screen.findByText(/7:46/i)).toBeVisible()
    })
  })

  describe('DOMPurify hooks', () => {
    test('expect style sheet sanitizied', async () => {
      const styleNode = { innerText: '', sheet: { cssRules: [{ cssText: 'a { color: blue; }', style }] } }
      mocked(DOMPurify).addHook.mockImplementationOnce((hook, callback) => {
        hookMock(hook)
        callback(styleNode as any, { tagName: 'a' } as any, {})
        callback(styleNode as any, { tagName: 'style' } as any, {})
      })
      render(
        <EmailViewer
          accountId={accountId}
          email={emailContents}
          emailId={emailId}
          getAttachment={getReceivedAttachment}
        />
      )

      expect(hookMock).toHaveBeenCalledWith('uponSanitizeElement')
      expect(style.removeProperty).toHaveBeenCalledWith('background-url')
      expect(styleNode.innerText).toEqual(' a { color: blue; }')
    })

    test('expect HTTP leak attributes removed', async () => {
      mocked(node).getAttribute.mockReturnValueOnce('data:image/iytfvbuytgh')
      mocked(node).getAttribute.mockReturnValueOnce('https://dbowland.com/jest-email-viewer-http-leaks')
      mocked(node).getAttribute.mockReturnValueOnce('data:image/oiuyfjkmnbg')
      mocked(node).getAttribute.mockReturnValueOnce('')
      mocked(DOMPurify).addHook.mockImplementationOnce(() => undefined)
      mocked(DOMPurify).addHook.mockImplementationOnce((hook, callback) => {
        hookMock(hook)
        callback(node as any, {} as any, {})
      })
      render(
        <EmailViewer
          accountId={accountId}
          email={emailContents}
          emailId={emailId}
          getAttachment={getReceivedAttachment}
        />
      )

      expect(hookMock).toHaveBeenCalledWith('afterSanitizeAttributes')
      expect(node.removeAttribute).toHaveBeenCalledWith('background')
      expect(node.removeAttribute).toHaveBeenCalledWith('src')
    })

    test('expect target added to anchor', async () => {
      const anchorNode = { ...node, target: 'self' }
      mocked(DOMPurify).addHook.mockImplementationOnce(() => undefined)
      mocked(DOMPurify).addHook.mockImplementationOnce(() => undefined)
      mocked(DOMPurify).addHook.mockImplementationOnce((hook, callback) => {
        hookMock(hook)
        callback(anchorNode as any, {} as any, {})
      })
      render(
        <EmailViewer
          accountId={accountId}
          email={emailContents}
          emailId={emailId}
          getAttachment={getReceivedAttachment}
        />
      )

      expect(hookMock).toHaveBeenCalledWith('afterSanitizeAttributes')
      expect(node.setAttribute).toHaveBeenCalledWith('target', '_blank')
    })

    test('expect target added to href', async () => {
      mocked(DOMPurify).addHook.mockImplementationOnce(() => undefined)
      mocked(DOMPurify).addHook.mockImplementationOnce(() => undefined)
      mocked(DOMPurify).addHook.mockImplementationOnce((hook, callback) => {
        hookMock(hook)
        callback(node as any, {} as any, {})
      })
      mocked(node).hasAttribute.mockReturnValueOnce(false)
      mocked(node).hasAttribute.mockReturnValueOnce(true)
      render(
        <EmailViewer
          accountId={accountId}
          email={emailContents}
          emailId={emailId}
          getAttachment={getReceivedAttachment}
        />
      )

      expect(hookMock).toHaveBeenCalledWith('afterSanitizeAttributes')
      expect(node.setAttribute).toHaveBeenCalledWith('xlink:show', 'new')
    })

    test('expect only afterSanitizeAttributes hook when images shown', async () => {
      render(
        <EmailViewer
          accountId={accountId}
          email={emailContents}
          emailId={emailId}
          getAttachment={getReceivedAttachment}
        />
      )

      hookMock.mockClear()
      const showImagesButton = (await screen.findByText(/Show images/i)) as HTMLButtonElement
      act(() => {
        showImagesButton.click()
      })

      expect(hookMock).toHaveBeenCalledWith('afterSanitizeAttributes')
    })

    test('expect uponSanitizeElement, afterSanitizeAttributes, and another afterSanitizeAttributes hook when no images shown', async () => {
      render(
        <EmailViewer
          accountId={accountId}
          email={emailContents}
          emailId={emailId}
          getAttachment={getReceivedAttachment}
        />
      )

      const showImagesButton = (await screen.findByText(/Show images/i)) as HTMLButtonElement
      act(() => {
        showImagesButton.click()
      })
      hookMock.mockClear()
      const hideImagesButton = (await screen.findByText(/Hide images/i)) as HTMLButtonElement
      act(() => {
        hideImagesButton.click()
      })

      expect(hookMock).toHaveBeenCalledWith('uponSanitizeElement')
      expect(hookMock).toHaveBeenCalledWith('afterSanitizeAttributes')
      expect(hookMock).toHaveBeenCalledWith('afterSanitizeAttributes')
    })
  })

  describe('attachments', () => {
    test('expect attachment downloaded', async () => {
      render(
        <EmailViewer
          accountId={accountId}
          email={emailContents}
          emailId={emailId}
          getAttachment={getReceivedAttachment}
        />
      )

      const attachmentElement = (await screen.findByText(/20221018_135343.jpg/i)) as HTMLButtonElement
      await act(async () => {
        await attachmentElement.click()
      })

      expect(getReceivedAttachment).toHaveBeenCalledWith(accountId, emailId, '18453696e0bac7e24cd1')
    })

    test('expect error message when attachment download error', async () => {
      getReceivedAttachment.mockRejectedValueOnce(undefined)
      render(
        <EmailViewer
          accountId={accountId}
          email={emailContents}
          emailId={emailId}
          getAttachment={getReceivedAttachment}
        />
      )

      const attachmentElement = (await screen.findByText(/20221018_135343.jpg/i)) as HTMLButtonElement
      await act(async () => {
        await attachmentElement.click()
      })

      expect(await screen.findByText(/Error downloading the attachment. Please try again./i)).toBeVisible()
    })

    test('expect closing error message removes it', async () => {
      getReceivedAttachment.mockRejectedValueOnce(undefined)
      render(
        <EmailViewer
          accountId={accountId}
          email={emailContents}
          emailId={emailId}
          getAttachment={getReceivedAttachment}
        />
      )

      const attachmentElement = (await screen.findByText(/20221018_135343.jpg/i)) as HTMLButtonElement
      await act(async () => {
        await attachmentElement.click()
      })
      await screen.findByText(/Error downloading the attachment. Please try again./i)
      const closeSnackbarButton = (await screen.findByLabelText(/Close/i, { selector: 'button' })) as HTMLButtonElement
      act(() => {
        closeSnackbarButton.click()
      })
      expect(screen.queryByText(/Error downloading the attachment. Please try again./i)).not.toBeInTheDocument()
    })
  })

  describe('delete', () => {
    test('clicking delete opens dialog', async () => {
      render(
        <EmailViewer
          accountId={accountId}
          deleteEmail={deleteReceivedEmail}
          email={emailContents}
          emailId={emailId}
          getAttachment={getReceivedAttachment}
        />
      )

      const deleteIcon = (await screen.findByLabelText(/Delete email/i, { selector: 'button' })) as HTMLButtonElement
      act(() => {
        deleteIcon.click()
      })

      expect(await screen.findByText(/Are you sure you want to delete this email/i)).toBeVisible()
    })

    test('clicking cancel on delete dialog closes it', async () => {
      render(
        <EmailViewer
          accountId={accountId}
          deleteEmail={deleteReceivedEmail}
          email={emailContents}
          emailId={emailId}
          getAttachment={getReceivedAttachment}
        />
      )

      const deleteIcon = (await screen.findByLabelText(/Delete email/i, { selector: 'button' })) as HTMLButtonElement
      act(() => {
        deleteIcon.click()
      })
      const cancelButton = (await screen.findByText(/Cancel/i, { selector: 'button' })) as HTMLButtonElement
      act(() => {
        cancelButton.click()
      })

      expect(screen.queryByText(/Are you sure you want to delete this email/i)).not.toBeVisible()
      expect(deleteReceivedEmail).not.toHaveBeenCalled()
    })

    test('clicking delete on delete dialog deletes email', async () => {
      render(
        <EmailViewer
          accountId={accountId}
          deleteEmail={deleteReceivedEmail}
          email={emailContents}
          emailId={emailId}
          getAttachment={getReceivedAttachment}
        />
      )

      const deleteIcon = (await screen.findByLabelText(/Delete email/i, { selector: 'button' })) as HTMLButtonElement
      act(() => {
        deleteIcon.click()
      })
      const deleteButton = (await screen.findByText(/Delete/i, { selector: 'button' })) as HTMLButtonElement
      await act(async () => {
        await deleteButton.click()
      })

      expect(screen.queryByText(/Are you sure you want to delete this email/i)).not.toBeVisible()
      expect(deleteReceivedEmail).toHaveBeenCalledWith(accountId, emailId)
    })

    test('clicking error on delete shows error message', async () => {
      deleteReceivedEmail.mockRejectedValueOnce(undefined)
      render(
        <EmailViewer
          accountId={accountId}
          deleteEmail={deleteReceivedEmail}
          email={emailContents}
          emailId={emailId}
          getAttachment={getReceivedAttachment}
        />
      )

      const deleteIcon = (await screen.findByLabelText(/Delete email/i, { selector: 'button' })) as HTMLButtonElement
      act(() => {
        deleteIcon.click()
      })
      const deleteButton = (await screen.findByText(/Delete/i, { selector: 'button' })) as HTMLButtonElement
      await act(async () => {
        await deleteButton.click()
      })

      expect(await screen.findByText(/Error deleting email. Please refresh and try again./i)).toBeVisible()
    })
  })
})
