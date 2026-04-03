import axios from 'axios'
import React, { useRef, useState } from 'react'

import { AttachmentTag, UploadArea } from './elements'
import ErrorSnackbar from '@components/error-snackbar'
import { postSentAttachment } from '@services/emails'
import { EmailAttachment } from '@types'

type setAttachmentsFn = (attachments: EmailAttachment[]) => void

export interface AttachmentUploaderProps {
  accountId: string
  attachments: EmailAttachment[]
  setAttachments: setAttachmentsFn
}

const AttachmentUploader = ({ accountId, attachments, setAttachments }: AttachmentUploaderProps): React.ReactNode => {
  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  const [uploadingFilename, setUploadingFilename] = useState<string | undefined>()

  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (file: File): Promise<void> => {
    setUploadingFilename(file.name)
    try {
      const postSignedUrl = await postSentAttachment(accountId)
      const formData = new FormData()
      Object.entries(postSignedUrl.fields).map(([k, v]) => formData.append(k, v))
      formData.append('file', file)
      await axios.post(postSignedUrl.url, formData, {})

      const key = postSignedUrl.fields.key
      const id = key.replace(/^.*\//, '')
      setAttachments([
        ...attachments,
        {
          filename: file.name,
          id,
          key,
          size: file.size,
          type: file.type,
        },
      ])
    } catch (error) {
      console.error('handleFileUpload', { accountId, error, file: file.name })
      setErrorMessage('Error uploading file. Please ensure file is below file size limit and then try again.')
    }
    setUploadingFilename(undefined)
  }

  const removeAttachmentById = (id: string): void => {
    setAttachments(attachments.filter((attachment) => attachment.id !== id))
  }

  const snackbarErrorClose = (): void => {
    setErrorMessage(undefined)
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 px-4 py-1">
        <span>Attachments:</span>
        {attachments.map((attachment, index) => (
          <AttachmentTag
            filename={attachment.filename}
            key={index}
            onRemove={() => removeAttachmentById(attachment.id)}
          />
        ))}
        <UploadArea
          inputRef={inputRef}
          onFileSelect={(file) => handleFileUpload(file)}
          uploadingFilename={uploadingFilename}
        />
      </div>
      <ErrorSnackbar message={errorMessage} onClose={snackbarErrorClose} />
    </>
  )
}

export default AttachmentUploader
