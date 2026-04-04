import axios from 'axios'
import React, { useRef, useState } from 'react'

import { AttachmentButton } from './elements'
import ErrorSnackbar from '@components/error-snackbar'
import { EmailAttachment, SignedUrl } from '@types'

type getAttachmentFn = (accountId: string, emailId: string, attachmentId: string) => Promise<SignedUrl>

export interface AttachmentViewerProps {
  accountId: string
  attachments: EmailAttachment[]
  emailId: string
  getAttachment: getAttachmentFn
}

const AttachmentViewer = ({
  accountId,
  attachments,
  emailId,
  getAttachment,
}: AttachmentViewerProps): React.ReactNode => {
  const [attachmentDownloading, setAttachmentDownloading] = useState<string | undefined>()
  const [errorMessage, setErrorMessage] = useState<string | undefined>()

  const anchorRef = useRef<HTMLAnchorElement>(null)

  const handleAttachmentClick = async (
    target: HTMLAnchorElement,
    accountId: string,
    emailId: string,
    attachmentId: string,
  ): Promise<void> => {
    setAttachmentDownloading(attachmentId)
    try {
      const metadata = attachments.find((value) => value.id === attachmentId) as EmailAttachment
      const { url } = await getAttachment(accountId, emailId, attachmentId)
      const attachmentBlob = await axios.get(url, { responseType: 'blob' }).then((response) => response.data)
      const typedBlob = new Blob([attachmentBlob], {
        type: metadata.type,
      })
      const objectUrl = window.URL.createObjectURL(typedBlob)
      target.download = metadata?.filename
      target.href = objectUrl
      target.click()
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      console.error('handleAttachmentClick', { accountId, attachmentId, emailId, error })
      setErrorMessage('Error downloading the attachment. Please try again.')
    }
    setAttachmentDownloading(undefined)
  }

  const snackbarErrorClose = (): void => {
    setErrorMessage(undefined)
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 px-4 py-1">
        <span>Attachments:</span>
        {attachments.map((attachment, index) => (
          <AttachmentButton
            disabled={attachmentDownloading !== undefined}
            filename={attachment.filename}
            isDownloading={attachmentDownloading === attachment.id}
            key={index}
            onClick={() =>
              anchorRef?.current && handleAttachmentClick(anchorRef?.current, accountId, emailId, attachment.id)
            }
            sizeLabel={`${attachment.size.toLocaleString()} bytes`}
          />
        ))}
      </div>
      <a ref={anchorRef} style={{ display: 'none' }}></a>
      <ErrorSnackbar message={errorMessage} onClose={snackbarErrorClose} />
    </>
  )
}

export default AttachmentViewer
