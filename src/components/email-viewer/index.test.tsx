import '@testing-library/jest-dom'
import { act, render, screen } from '@testing-library/react'
import DOMPurify from 'dompurify'
import React from 'react'
import { mocked } from 'jest-mock'

import { accountId, attachmentContents, emailContents, emailId } from '@test/__mocks__'
import AddressLine from '@components/address-line'
import Compose from '@components/compose'
import { EmailContents } from '@types'
import EmailViewer from './index'

jest.mock('aws-amplify')
jest.mock('dompurify')
jest.mock('@components/address-line')
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
    mocked(DOMPurify).addHook.mockImplementation((hook: string) => hookMock(hook))
    mocked(DOMPurify).sanitize.mockImplementation((source: string | Node) => source as any)
    mocked(AddressLine).mockReturnValue(<></>)
    mocked(Compose).mockReturnValue(<></>)
    getAttachment.mockResolvedValue(attachmentContents)
  })

  describe('general', () => {
    test('expect address lines shown', async () => {
      render(
        <EmailViewer accountId={accountId} email={emailContents} emailId={emailId} getAttachment={getAttachment} />
      )

      expect(AddressLine).toHaveBeenCalledWith(
        {
          addresses: emailContents.toAddress?.value,
          label: 'To:',
        },
        {}
      )
      expect(AddressLine).toHaveBeenCalledWith(
        {
          addresses: emailContents.ccAddress?.value,
          label: 'CC:',
        },
        {}
      )
      expect(AddressLine).toHaveBeenCalledWith(
        {
          addresses: emailContents.fromAddress.value,
          label: 'From:',
        },
        {}
      )
    })

    test('expect to line shown when no to addresses', async () => {
      const emailNoToAddress = {
        ...emailContents,
        toAddress: undefined,
      } as unknown as EmailContents
      render(
        <EmailViewer accountId={accountId} email={emailNoToAddress} emailId={emailId} getAttachment={getAttachment} />
      )

      expect(AddressLine).toHaveBeenCalledWith({ addresses: [], label: 'To:' }, {})
    })
  })

  describe('DOMPurify sanitizer', () => {
    test('expect email viewer shows html', async () => {
      render(
        <EmailViewer accountId={accountId} email={emailContents} emailId={emailId} getAttachment={getAttachment} />
      )

      expect(await screen.findByText(/7:47/i)).toBeVisible()
    })

    test('expect email viewer shows text when no html', async () => {
      const emailNoHtml = { ...emailContents, attachments: undefined, bodyHtml: undefined } as unknown as EmailContents
      render(<EmailViewer accountId={accountId} email={emailNoHtml} emailId={emailId} getAttachment={getAttachment} />)

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
        <EmailViewer accountId={accountId} email={emailContents} emailId={emailId} getAttachment={getAttachment} />
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
        <EmailViewer accountId={accountId} email={emailContents} emailId={emailId} getAttachment={getAttachment} />
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
        <EmailViewer accountId={accountId} email={emailContents} emailId={emailId} getAttachment={getAttachment} />
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
        <EmailViewer accountId={accountId} email={emailContents} emailId={emailId} getAttachment={getAttachment} />
      )

      expect(hookMock).toHaveBeenCalledWith('afterSanitizeAttributes')
      expect(node.setAttribute).toHaveBeenCalledWith('xlink:show', 'new')
    })

    test('expect only afterSanitizeAttributes hook when images shown', async () => {
      render(
        <EmailViewer accountId={accountId} email={emailContents} emailId={emailId} getAttachment={getAttachment} />
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
        <EmailViewer accountId={accountId} email={emailContents} emailId={emailId} getAttachment={getAttachment} />
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
        <EmailViewer accountId={accountId} email={emailContents} emailId={emailId} getAttachment={getAttachment} />
      )

      const attachmentElement = (await screen.findByText(/20221018_135343.jpg/i)) as HTMLButtonElement
      await act(async () => {
        await attachmentElement.click()
      })

      expect(getAttachment).toHaveBeenCalledWith(accountId, emailId, '18453696e0bac7e24cd1')
    })

    test('expect error message when attachment download error', async () => {
      getAttachment.mockRejectedValueOnce(undefined)
      render(
        <EmailViewer accountId={accountId} email={emailContents} emailId={emailId} getAttachment={getAttachment} />
      )

      const attachmentElement = (await screen.findByText(/20221018_135343.jpg/i)) as HTMLButtonElement
      await act(async () => {
        await attachmentElement.click()
      })

      expect(await screen.findByText(/Error downloading the attachment. Please try again./i)).toBeVisible()
    })

    test('expect closing error message removes it', async () => {
      getAttachment.mockRejectedValueOnce(undefined)
      render(
        <EmailViewer accountId={accountId} email={emailContents} emailId={emailId} getAttachment={getAttachment} />
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

  describe('compose', () => {
    test('expect Compose invoked for reply', async () => {
      render(
        <EmailViewer
          accountId={accountId}
          deleteEmail={deleteReceivedEmail}
          email={emailContents}
          emailId={emailId}
          getAttachment={getAttachment}
        />
      )

      const replyIcon = (await screen.findByLabelText(/Reply$/i, { selector: 'button' })) as HTMLButtonElement
      act(() => {
        replyIcon.click()
      })

      expect(mocked(Compose)).toHaveBeenCalledWith(
        expect.objectContaining({
          inReplyTo: emailContents.id,
          initialSubject: 'RE: Hello, world',
          initialToAddresses: [{ address: 'reply@domain.com', name: '' }],
          references: emailContents.references,
        }),
        {}
      )
    })

    test('expect Compose invoked for reply all', async () => {
      render(
        <EmailViewer
          accountId={accountId}
          deleteEmail={deleteReceivedEmail}
          email={emailContents}
          emailId={emailId}
          getAttachment={getAttachment}
        />
      )

      const replyAllIcon = (await screen.findByLabelText(/Reply all/i, { selector: 'button' })) as HTMLButtonElement
      act(() => {
        replyAllIcon.click()
      })

      expect(mocked(Compose)).toHaveBeenCalledWith(
        expect.objectContaining({
          inReplyTo: emailContents.id,
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
        }),
        {}
      )
    })

    test('expect Compose invoked for reply all with missing attributes', async () => {
      const contentsMissingFields = {
        ...emailContents,
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
        />
      )

      const replyAllIcon = (await screen.findByLabelText(/Reply all/i, { selector: 'button' })) as HTMLButtonElement
      act(() => {
        replyAllIcon.click()
      })

      expect(mocked(Compose)).toHaveBeenCalledWith(
        expect.objectContaining({
          inReplyTo: emailContents.id,
          initialSubject: 'RE: no subject',
          initialToAddresses: [{ address: 'another@domain.com', name: '' }],
        }),
        {}
      )
    })

    test('expect Compose invoked for forward', async () => {
      render(
        <EmailViewer
          accountId={accountId}
          deleteEmail={deleteReceivedEmail}
          email={emailContents}
          emailId={emailId}
          getAttachment={getAttachment}
        />
      )

      const forwardIcon = (await screen.findByLabelText(/Forward/i, { selector: 'button' })) as HTMLButtonElement
      act(() => {
        forwardIcon.click()
      })

      expect(mocked(Compose)).toHaveBeenCalledWith(
        expect.objectContaining({
          inReplyTo: emailContents.id,
          initialSubject: 'FW: Hello, world',
          references: emailContents.references,
        }),
        {}
      )
    })

    test('expect discard removes Compose', async () => {
      mocked(Compose).mockImplementationOnce(({ discardCallback }): JSX.Element => {
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
        />
      )

      const replyIcon = (await screen.findByLabelText(/Reply$/i, { selector: 'button' })) as HTMLButtonElement
      act(() => {
        replyIcon.click()
      })

      expect(await screen.findByLabelText(/Reply$/i)).toBeInTheDocument()
    })
  })

  describe('delete', () => {
    test('expect clicking delete opens dialog', async () => {
      render(
        <EmailViewer
          accountId={accountId}
          deleteEmail={deleteReceivedEmail}
          email={emailContents}
          emailId={emailId}
          getAttachment={getAttachment}
        />
      )

      const deleteIcon = (await screen.findByLabelText(/Delete email/i, { selector: 'button' })) as HTMLButtonElement
      act(() => {
        deleteIcon.click()
      })

      expect(await screen.findByText(/Are you sure you want to delete this email/i)).toBeVisible()
    })

    test('expect clicking cancel on delete dialog closes it', async () => {
      render(
        <EmailViewer
          accountId={accountId}
          deleteEmail={deleteReceivedEmail}
          email={emailContents}
          emailId={emailId}
          getAttachment={getAttachment}
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

    test('expect clicking delete on delete dialog deletes email', async () => {
      render(
        <EmailViewer
          accountId={accountId}
          deleteEmail={deleteReceivedEmail}
          email={emailContents}
          emailId={emailId}
          getAttachment={getAttachment}
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

    test('expect clicking error on delete shows error message', async () => {
      deleteReceivedEmail.mockRejectedValueOnce(undefined)
      render(
        <EmailViewer
          accountId={accountId}
          deleteEmail={deleteReceivedEmail}
          email={emailContents}
          emailId={emailId}
          getAttachment={getAttachment}
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
