import AddressLine from '@components/address-line'
import AttachmentViewer from '@components/attachment-viewer'
import Compose from '@components/compose'
import { accountId, attachments, attachmentUrl, emailContents, emailId } from '@test/__mocks__'
import '@testing-library/jest-dom'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DOMPurify from 'dompurify'
import React from 'react'

import EmailViewer from './index'
import { EmailContents } from '@types'

jest.mock('aws-amplify')
jest.mock('dompurify')
jest.mock('@components/address-line')
jest.mock('@components/attachment-viewer')
jest.mock('@components/compose')

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
  const getAttachment = jest.fn()
  const hookMock = jest.fn()

  beforeAll(() => {
    jest.mocked(DOMPurify).addHook.mockImplementation((hook: string) => hookMock(hook))
    jest.mocked(DOMPurify).sanitize.mockImplementation((source: string | Node) => source as any)
    jest.mocked(AddressLine).mockReturnValue(<>AddressLine</>)
    jest.mocked(AttachmentViewer).mockReturnValue(<>AttachmentViewer</>)
    jest.mocked(Compose).mockReturnValue(<>Compose</>)
    getAttachment.mockResolvedValue(attachmentUrl)
    console.error = jest.fn()
  })

  describe('general', () => {
    it('should display all address lines', async () => {
      render(
        <EmailViewer accountId={accountId} email={emailContents} emailId={emailId} getAttachment={getAttachment} />,
      )

      expect(AddressLine).toHaveBeenCalledWith(
        {
          addresses: emailContents.toAddress?.value,
          label: 'To:',
        },
        {},
      )
      expect(AddressLine).toHaveBeenCalledWith(
        {
          addresses: emailContents.ccAddress?.value,
          label: 'CC:',
        },
        {},
      )
      expect(AddressLine).toHaveBeenCalledWith(
        {
          addresses: emailContents.bccAddress?.value,
          label: 'BCC:',
        },
        {},
      )
      expect(AddressLine).toHaveBeenCalledWith(
        {
          addresses: emailContents.fromAddress.value,
          label: 'From:',
        },
        {},
      )
    })

    it('should display empty To line when no recipients', async () => {
      const emailNoToAddress = {
        ...emailContents,
        toAddress: undefined,
      } as unknown as EmailContents
      render(
        <EmailViewer accountId={accountId} email={emailNoToAddress} emailId={emailId} getAttachment={getAttachment} />,
      )

      expect(AddressLine).toHaveBeenCalledWith({ addresses: [], label: 'To:' }, {})
    })

    it('should display attachments when present', async () => {
      const emailNoToAddress = {
        ...emailContents,
        toAddress: undefined,
      } as unknown as EmailContents
      render(
        <EmailViewer accountId={accountId} email={emailNoToAddress} emailId={emailId} getAttachment={getAttachment} />,
      )

      expect(AttachmentViewer).toHaveBeenCalledWith(expect.objectContaining({ accountId, attachments, emailId }), {})
    })
  })

  describe('DOMPurify sanitizer', () => {
    it('should display HTML content when available', async () => {
      render(
        <EmailViewer accountId={accountId} email={emailContents} emailId={emailId} getAttachment={getAttachment} />,
      )

      expect(await screen.findByText(/7:47/i)).toBeVisible()
    })

    it('should display text content when HTML is not available', async () => {
      const emailNoHtml = { ...emailContents, attachments: undefined, bodyHtml: undefined } as unknown as EmailContents
      render(<EmailViewer accountId={accountId} email={emailNoHtml} emailId={emailId} getAttachment={getAttachment} />)

      expect(await screen.findByText(/7:46/i)).toBeVisible()
    })
  })

  describe('DOMPurify hooks', () => {
    it('should sanitize style sheets', async () => {
      const styleNode = {
        innerText: '',
        sheet: {
          cssRules: [
            { cssText: 'a { color: blue; }', style },
            { cssText: 'li { color: red; }', style: undefined },
          ],
        },
      }
      jest.mocked(DOMPurify).addHook.mockImplementationOnce((hook, callback) => {
        hookMock(hook)
        callback.call(DOMPurify, styleNode as any, { tagName: 'a' } as any, {})
        callback.call(DOMPurify, styleNode as any, { tagName: 'style' } as any, {})
      })
      render(
        <EmailViewer accountId={accountId} email={emailContents} emailId={emailId} getAttachment={getAttachment} />,
      )

      expect(hookMock).toHaveBeenCalledWith('uponSanitizeElement')
      expect(style.removeProperty).toHaveBeenCalledWith('background-url')
      expect(styleNode.innerText).toEqual(' a { color: blue; } li { color: red; }')
    })

    it('should remove HTTP leak attributes', async () => {
      jest.mocked(node).getAttribute.mockReturnValueOnce('data:image/iytfvbuytgh')
      jest.mocked(node).getAttribute.mockReturnValueOnce('https://dbowland.com/jest-email-viewer-http-leaks')
      jest.mocked(node).getAttribute.mockReturnValueOnce('data:image/oiuyfjkmnbg')
      jest.mocked(node).getAttribute.mockReturnValueOnce('')
      jest.mocked(DOMPurify).addHook.mockImplementationOnce(() => undefined)
      jest.mocked(DOMPurify).addHook.mockImplementationOnce((hook, callback) => {
        hookMock(hook)
        callback.call(DOMPurify, node as any, {} as any, {})
      })
      render(
        <EmailViewer accountId={accountId} email={emailContents} emailId={emailId} getAttachment={getAttachment} />,
      )

      expect(hookMock).toHaveBeenCalledWith('afterSanitizeAttributes')
      expect(node.removeAttribute).toHaveBeenCalledWith('background')
      expect(node.removeAttribute).toHaveBeenCalledWith('src')
    })

    it('should add target="_blank" to anchor elements', async () => {
      const anchorNode = { ...node, target: 'self' }
      jest.mocked(DOMPurify).addHook.mockImplementationOnce(() => undefined)
      jest.mocked(DOMPurify).addHook.mockImplementationOnce(() => undefined)
      jest.mocked(DOMPurify).addHook.mockImplementationOnce((hook, callback) => {
        hookMock(hook)
        callback.call(DOMPurify, anchorNode as any, {} as any, {})
      })
      render(
        <EmailViewer accountId={accountId} email={emailContents} emailId={emailId} getAttachment={getAttachment} />,
      )

      expect(hookMock).toHaveBeenCalledWith('afterSanitizeAttributes')
      expect(node.setAttribute).toHaveBeenCalledWith('target', '_blank')
    })

    it('should add xlink:show="new" to elements with href attributes', async () => {
      jest.mocked(DOMPurify).addHook.mockImplementationOnce(() => undefined)
      jest.mocked(DOMPurify).addHook.mockImplementationOnce(() => undefined)
      jest.mocked(DOMPurify).addHook.mockImplementationOnce((hook, callback) => {
        hookMock(hook)
        callback.call(DOMPurify, node as any, {} as any, {})
      })
      jest.mocked(node).hasAttribute.mockReturnValueOnce(false)
      jest.mocked(node).hasAttribute.mockReturnValueOnce(true)
      render(
        <EmailViewer accountId={accountId} email={emailContents} emailId={emailId} getAttachment={getAttachment} />,
      )

      expect(hookMock).toHaveBeenCalledWith('afterSanitizeAttributes')
      expect(node.setAttribute).toHaveBeenCalledWith('xlink:show', 'new')
    })

    it('should only use afterSanitizeAttributes hook when images are shown', async () => {
      render(
        <EmailViewer accountId={accountId} email={emailContents} emailId={emailId} getAttachment={getAttachment} />,
      )

      hookMock.mockClear()
      const showImagesButton = (await screen.findByText(/Show images/i)) as HTMLButtonElement

      await act(async () => {
        await userEvent.click(showImagesButton)
      })

      expect(hookMock).toHaveBeenCalledWith('afterSanitizeAttributes')
    })

    it('should use multiple hooks when hiding images', async () => {
      render(
        <EmailViewer accountId={accountId} email={emailContents} emailId={emailId} getAttachment={getAttachment} />,
      )

      const showImagesButton = (await screen.findByText(/Show images/i)) as HTMLButtonElement

      await act(async () => {
        await userEvent.click(showImagesButton)
      })

      hookMock.mockClear()
      const hideImagesButton = (await screen.findByText(/Hide images/i)) as HTMLButtonElement

      await act(async () => {
        await userEvent.click(hideImagesButton)
      })

      expect(hookMock).toHaveBeenCalledWith('uponSanitizeElement')
      expect(hookMock).toHaveBeenCalledWith('afterSanitizeAttributes')
      expect(hookMock).toHaveBeenCalledWith('afterSanitizeAttributes')
    })
  })

  describe('compose', () => {
    it('should invoke Compose component when replying to an email', async () => {
      render(
        <EmailViewer
          accountId={accountId}
          deleteEmail={deleteReceivedEmail}
          email={emailContents}
          emailId={emailId}
          getAttachment={getAttachment}
        />,
      )

      const replyIcon = (await screen.findByLabelText(/Reply$/i, { selector: 'button' })) as HTMLButtonElement

      await act(async () => {
        await userEvent.click(replyIcon)
      })

      expect(Compose).toHaveBeenCalledWith(
        expect.objectContaining({
          initialSubject: 'RE: Hello, world',
          initialToAddresses: [{ address: 'reply@domain.com', name: '' }],
          inReplyTo: emailContents.id,
          references: emailContents.references,
        }),
        {},
      )
    })

    it('should invoke Compose component when replying to all recipients', async () => {
      render(
        <EmailViewer
          accountId={accountId}
          deleteEmail={deleteReceivedEmail}
          email={emailContents}
          emailId={emailId}
          getAttachment={getAttachment}
        />,
      )

      const replyAllIcon = (await screen.findByLabelText(/Reply all/i, { selector: 'button' })) as HTMLButtonElement

      await act(async () => {
        await userEvent.click(replyAllIcon)
      })

      expect(Compose).toHaveBeenCalledWith(
        expect.objectContaining({
          initialCcAddresses: [
            { address: 'someone@domain.com', name: '' },
            { address: 'fred@domain.com', name: 'Fred' },
          ],
          initialSubject: 'RE: Hello, world',
          initialToAddresses: [
            { address: 'reply@domain.com', name: '' },
            { address: 'account@domain.com', name: '' },
            { address: 'admin@domain.com', name: 'Admin' },
          ],
          inReplyTo: emailContents.id,
        }),
        {},
      )
    })

    it('should handle reply all with missing email attributes', async () => {
      const contentsMissingFields = {
        ...emailContents,
        bccAddress: undefined,
        ccAddress: undefined,
        date: undefined,
        fromAddress: {
          html: '',
          text: '',
          value: [
            {
              address: 'another@domain.com',
              name: '',
            },
          ],
        },
        replyToAddress: {
          display: '',
          value: [
            {
              address: '',
              name: '',
            },
          ],
        },
        subject: undefined,
        toAddress: undefined,
      }
      render(
        <EmailViewer
          accountId={accountId}
          deleteEmail={deleteReceivedEmail}
          email={contentsMissingFields}
          emailId={emailId}
          getAttachment={getAttachment}
        />,
      )

      const replyAllIcon = (await screen.findByLabelText(/Reply all/i, { selector: 'button' })) as HTMLButtonElement

      await act(async () => {
        await userEvent.click(replyAllIcon)
      })

      expect(Compose).toHaveBeenCalledWith(
        expect.objectContaining({
          initialSubject: 'RE: no subject',
          initialToAddresses: [{ address: 'another@domain.com', name: '' }],
          inReplyTo: emailContents.id,
        }),
        {},
      )
    })

    it('should invoke Compose component when forwarding an email', async () => {
      render(
        <EmailViewer
          accountId={accountId}
          deleteEmail={deleteReceivedEmail}
          email={emailContents}
          emailId={emailId}
          getAttachment={getAttachment}
        />,
      )

      const forwardIcon = (await screen.findByLabelText(/Forward/i, { selector: 'button' })) as HTMLButtonElement

      await act(async () => {
        await userEvent.click(forwardIcon)
      })

      expect(Compose).toHaveBeenCalledWith(
        expect.objectContaining({
          initialSubject: 'FW: Hello, world',
          inReplyTo: emailContents.id,
          references: emailContents.references,
        }),
        {},
      )
    })

    it('should remove Compose component when discarding', async () => {
      jest.mocked(Compose).mockImplementationOnce(({ discardCallback }): JSX.Element => {
        discardCallback && discardCallback()
        return <>Compose</>
      })
      render(
        <EmailViewer
          accountId={accountId}
          deleteEmail={deleteReceivedEmail}
          email={emailContents}
          emailId={emailId}
          getAttachment={getAttachment}
        />,
      )

      const replyIcon = (await screen.findByLabelText(/Reply$/i, { selector: 'button' })) as HTMLButtonElement

      await act(async () => {
        await userEvent.click(replyIcon)
      })

      expect(await screen.findByLabelText(/Reply$/i)).toBeInTheDocument()
    })
  })

  describe('delete', () => {
    it('should open confirmation dialog when clicking delete', async () => {
      render(
        <EmailViewer
          accountId={accountId}
          deleteEmail={deleteReceivedEmail}
          email={emailContents}
          emailId={emailId}
          getAttachment={getAttachment}
        />,
      )

      const deleteIcon = (await screen.findByLabelText(/Delete email/i, { selector: 'button' })) as HTMLButtonElement

      await act(async () => {
        await userEvent.click(deleteIcon)
      })

      expect(await screen.findByText(/Are you sure you want to delete this email/i)).toBeVisible()
    })

    it('should close dialog when clicking cancel', async () => {
      render(
        <EmailViewer
          accountId={accountId}
          deleteEmail={deleteReceivedEmail}
          email={emailContents}
          emailId={emailId}
          getAttachment={getAttachment}
        />,
      )

      const deleteIcon = (await screen.findByLabelText(/Delete email/i, { selector: 'button' })) as HTMLButtonElement

      await act(async () => {
        await userEvent.click(deleteIcon)
      })

      const cancelButton = (await screen.findByText(/Cancel/i, { selector: 'button' })) as HTMLButtonElement

      await act(async () => {
        await userEvent.click(cancelButton)
      })

      expect(screen.queryByText(/Are you sure you want to delete this email/i)).not.toBeVisible()
      expect(deleteReceivedEmail).not.toHaveBeenCalled()
    })

    it('should delete email when confirming deletion', async () => {
      render(
        <EmailViewer
          accountId={accountId}
          deleteEmail={deleteReceivedEmail}
          email={emailContents}
          emailId={emailId}
          getAttachment={getAttachment}
        />,
      )

      const deleteIcon = (await screen.findByLabelText(/Delete email/i, { selector: 'button' })) as HTMLButtonElement

      await act(async () => {
        await userEvent.click(deleteIcon)
      })

      const deleteButton = (await screen.findByText(/Delete/i, { selector: 'button' })) as HTMLButtonElement

      await act(async () => {
        await userEvent.click(deleteButton)
      })

      expect(screen.queryByText(/Are you sure you want to delete this email/i)).not.toBeVisible()
      expect(deleteReceivedEmail).toHaveBeenCalledWith(accountId, emailId)
    })

    it('should show error message when delete operation fails', async () => {
      deleteReceivedEmail.mockRejectedValueOnce(undefined)
      render(
        <EmailViewer
          accountId={accountId}
          deleteEmail={deleteReceivedEmail}
          email={emailContents}
          emailId={emailId}
          getAttachment={getAttachment}
        />,
      )

      const deleteIcon = (await screen.findByLabelText(/Delete email/i, { selector: 'button' })) as HTMLButtonElement

      await act(async () => {
        await userEvent.click(deleteIcon)
      })

      const deleteButton = (await screen.findByText(/Delete/i, { selector: 'button' })) as HTMLButtonElement

      await act(async () => {
        await userEvent.click(deleteButton)
      })

      expect(await screen.findByText(/Error deleting email. Please refresh and try again./i)).toBeVisible()
    })

    it('should remove error message when closing the snackbar', async () => {
      deleteReceivedEmail.mockRejectedValueOnce(undefined)
      render(
        <EmailViewer
          accountId={accountId}
          deleteEmail={deleteReceivedEmail}
          email={emailContents}
          emailId={emailId}
          getAttachment={getAttachment}
        />,
      )

      const deleteIcon = (await screen.findByLabelText(/Delete email/i, { selector: 'button' })) as HTMLButtonElement

      await act(async () => {
        await userEvent.click(deleteIcon)
      })

      const deleteButton = (await screen.findByText(/Delete/i, { selector: 'button' })) as HTMLButtonElement

      await act(async () => {
        await userEvent.click(deleteButton)
      })

      await screen.findByText(/Error deleting email. Please refresh and try again./i)
      const closeSnackbarButton = (await screen.findByLabelText(/Close/i, { selector: 'button' })) as HTMLButtonElement

      await act(async () => {
        await userEvent.click(closeSnackbarButton)
      })

      expect(screen.queryByText(/Error deleting email. Please refresh and try again./i)).not.toBeInTheDocument()
    })
  })
})
