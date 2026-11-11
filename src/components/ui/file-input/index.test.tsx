import React from 'react'

import FileInput from './index'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('FileInput component', () => {
  const onFiles = jest.fn()
  const report = new File(['report'], 'report.pdf', { type: 'application/pdf' })
  const photo = new File(['photo'], 'photo.png', { type: 'image/png' })

  it('should show a button with its label', () => {
    render(<FileInput label="Attach a file" onFiles={onFiles} />)

    expect(screen.getByRole('button', { name: 'Attach a file' })).toBeVisible()
  })

  it('should call onFiles with the chosen file', async () => {
    render(<FileInput label="Attach a file" onFiles={onFiles} />)

    await userEvent.upload(screen.getByLabelText('Attach a file'), report)

    expect(onFiles).toHaveBeenCalledWith([report])
  })

  it('should call onFiles with every chosen file when multiple', async () => {
    render(<FileInput label="Attach files" multiple onFiles={onFiles} />)

    await userEvent.upload(screen.getByLabelText('Attach files'), [report, photo])

    expect(onFiles).toHaveBeenCalledWith([report, photo])
  })

  it('should accept the same file twice in a row', async () => {
    render(<FileInput label="Attach a file" onFiles={onFiles} />)
    const input = screen.getByLabelText('Attach a file')

    await userEvent.upload(input, report)
    await userEvent.upload(input, report)

    expect(onFiles).toHaveBeenCalledTimes(2)
  })

  it('should pass accept to the file input', () => {
    render(<FileInput accept="image/*" label="Attach an image" onFiles={onFiles} />)

    expect(screen.getByLabelText('Attach an image')).toHaveAttribute('accept', 'image/*')
  })

  it('should open the file picker when the button is pressed', async () => {
    const onPickerClick = jest.fn()
    render(<FileInput label="Attach a file" onFiles={onFiles} />)
    screen.getByLabelText('Attach a file').addEventListener('click', onPickerClick)

    await userEvent.click(screen.getByRole('button', { name: 'Attach a file' }))

    expect(onPickerClick).toHaveBeenCalledTimes(1)
  })

  it('should keep only the button in the tab order', async () => {
    render(<FileInput label="Attach a file" onFiles={onFiles} />)

    await userEvent.tab()

    expect(screen.getByRole('button', { name: 'Attach a file' })).toHaveFocus()
  })

  it('should show the busy label and not open the picker while busy', async () => {
    const onPickerClick = jest.fn()
    render(<FileInput busy busyLabel="Uploading report.pdf" label="Attach a file" onFiles={onFiles} />)
    screen.getByLabelText('Attach a file').addEventListener('click', onPickerClick)

    await userEvent.click(screen.getByRole('button', { busy: true, name: 'Uploading report.pdf' }))

    expect(onPickerClick).not.toHaveBeenCalled()
  })
})
