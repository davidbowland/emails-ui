import React from 'react'

import BounceSenderInput from './index'
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('BounceSenderInput component', () => {
  const setRules = jest.fn()

  const testRules = ['spam@domain.com', 'badguys.com', '*']

  it('should render rules without edit capability when no setRules provided', async () => {
    render(<BounceSenderInput label="Bounce:" rules={testRules} />)

    expect(await screen.findByText(/bounce:/i)).toBeVisible()
    expect(await screen.findByText(/spam@domain\.com/i)).toBeVisible()
    expect(await screen.findByText(/badguys\.com/i)).toBeVisible()
    expect(await screen.findByText(/All senders/i)).toBeVisible()
  })

  it('should allow adding a new email rule', async () => {
    render(<BounceSenderInput label="Bounce:" rules={testRules} setRules={setRules} />)

    const input = (await screen.findByRole('textbox')) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'new@spam.com' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(setRules).toHaveBeenCalledWith(['spam@domain.com', 'badguys.com', '*', 'new@spam.com'])
  })

  it('should allow adding a new domain rule', async () => {
    render(<BounceSenderInput label="Bounce:" rules={testRules} setRules={setRules} />)

    const input = (await screen.findByRole('textbox')) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'newspam.com' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(setRules).toHaveBeenCalledWith(['spam@domain.com', 'badguys.com', '*', 'newspam.com'])
  })

  it('should allow removing a rule', async () => {
    render(<BounceSenderInput label="Bounce:" rules={testRules} setRules={setRules} />)

    const deleteButtons = await screen.findAllByTestId('CancelIcon')
    fireEvent.click(deleteButtons[0])

    expect(setRules).toHaveBeenCalledWith(['badguys.com', '*'])
  })

  it('should display * as All senders', async () => {
    render(<BounceSenderInput label="Bounce:" rules={['*']} setRules={setRules} />)

    expect(await screen.findByText(/All senders/i)).toBeVisible()
  })

  it('should display domain rules correctly', async () => {
    render(<BounceSenderInput label="Bounce:" rules={['spam.com']} setRules={setRules} />)

    expect(await screen.findByText(/spam\.com/i)).toBeVisible()
  })

  it('should display email rules correctly', async () => {
    render(<BounceSenderInput label="Bounce:" rules={['bad@spam.com']} setRules={setRules} />)

    expect(await screen.findByText(/bad@spam\.com/i)).toBeVisible()
  })

  it('should allow adding * rule for all senders', async () => {
    render(<BounceSenderInput label="Bounce:" rules={['spam@domain.com', '*']} setRules={setRules} />)

    expect(await screen.findByText(/All senders/i)).toBeVisible()
    expect(await screen.findByText(/spam@domain\.com/i)).toBeVisible()
  })

  it('should reject invalid email addresses', async () => {
    render(<BounceSenderInput label="Bounce:" rules={[]} setRules={setRules} />)

    const input = (await screen.findByRole('textbox')) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'invalid-email' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(setRules).toHaveBeenCalledWith([])
  })

  it('should reject invalid domain rules', async () => {
    render(<BounceSenderInput label="Bounce:" rules={[]} setRules={setRules} />)

    const input = (await screen.findByRole('textbox')) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'invalid' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(setRules).toHaveBeenCalledWith([])
  })

  it('should accept valid email with dot after at', async () => {
    render(<BounceSenderInput label="Bounce:" rules={[]} setRules={setRules} />)

    const input = (await screen.findByRole('textbox')) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'user@domain.com' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(setRules).toHaveBeenCalledWith(['user@domain.com'])
  })

  it('should accept * as all senders rule', async () => {
    render(<BounceSenderInput label="Bounce:" rules={[]} setRules={setRules} />)

    const input = (await screen.findByRole('textbox')) as HTMLInputElement
    fireEvent.change(input, { target: { value: '*' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(setRules).toHaveBeenCalledWith(['*'])
  })

  it('should commit value on blur', async () => {
    render(<BounceSenderInput label="Bounce:" rules={testRules} setRules={setRules} />)

    const input = (await screen.findByRole('textbox')) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'blur@spam.com' } })
    fireEvent.blur(input)

    expect(setRules).toHaveBeenCalledWith(['spam@domain.com', 'badguys.com', '*', 'blur@spam.com'])
  })

  it('should not commit empty value on blur', async () => {
    render(<BounceSenderInput label="Bounce:" rules={[]} setRules={setRules} />)

    const input = (await screen.findByRole('textbox')) as HTMLInputElement
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.blur(input)

    expect(setRules).not.toHaveBeenCalled()
  })

  it('should name the input "Sender to block" by default', () => {
    render(<BounceSenderInput label="Bounce:" rules={[]} setRules={setRules} />)

    expect(screen.getByRole('textbox', { name: 'Sender to block' })).toBeInTheDocument()
  })

  it('should report an invalid bounce rule and still drop it', async () => {
    const onInvalid = jest.fn()
    render(<BounceSenderInput label="Bounce:" onInvalid={onInvalid} rules={['a.com']} setRules={setRules} />)

    await userEvent.type(screen.getByRole('textbox'), 'invalid{Enter}')

    expect(onInvalid).toHaveBeenCalledWith('invalid')
    expect(setRules).toHaveBeenCalledWith(['a.com'])
  })

  it('should keep a rejected bounce rule in the box so it can be fixed', async () => {
    render(<BounceSenderInput label="Bounce:" rules={[]} setRules={setRules} />)

    await userEvent.type(screen.getByRole('textbox'), 'invalid{Enter}')

    expect(screen.getByRole('textbox')).toHaveValue('invalid')
  })

  it('should clear the box once a bounce rule is accepted', async () => {
    render(<BounceSenderInput label="Bounce:" rules={[]} setRules={setRules} />)

    await userEvent.type(screen.getByRole('textbox'), 'ok.com{Enter}')

    expect(screen.getByRole('textbox')).toHaveValue('')
  })

  it('should not add a bounce rule already on the list, ignoring case', async () => {
    render(<BounceSenderInput label="Bounce:" rules={['spam@domain.com']} setRules={setRules} />)

    await userEvent.type(screen.getByRole('textbox'), 'SPAM@Domain.com{Enter}')

    expect(setRules).not.toHaveBeenCalled()
    expect(screen.getByRole('textbox')).toHaveValue('SPAM@Domain.com')
  })

  it('should show an icon, not a text glyph, on the remove button', () => {
    render(<BounceSenderInput label="Bounce:" rules={['spam.com']} setRules={setRules} />)

    const button = screen.getByRole('button', { name: 'Remove spam.com' })
    expect(button).not.toHaveTextContent('✕')
    expect(screen.getByTestId('icon-X')).toBeInTheDocument()
  })

  it('should not report a valid bounce rule', async () => {
    const onInvalid = jest.fn()
    render(<BounceSenderInput label="Bounce:" onInvalid={onInvalid} rules={[]} setRules={setRules} />)

    await userEvent.type(screen.getByRole('textbox'), 'ok.com{Enter}')

    expect(onInvalid).not.toHaveBeenCalled()
    expect(setRules).toHaveBeenCalledWith(['ok.com'])
  })

  describe('reused for another list', () => {
    const validate = (value: string): boolean => value.trim().length <= 15
    const onInvalid = jest.fn()

    const renderReused = (invalid = false): void => {
      render(
        <>
          <p id="phrases-help">Each entry is matched as a whole phrase.</p>
          <BounceSenderInput
            describedBy="phrases-help"
            enterKeyHint="done"
            inputId="block-phrases"
            invalid={invalid}
            label="Block phrases:"
            onInvalid={onInvalid}
            placeholder="Add a word or phrase, then press Enter"
            rules={['crypto']}
            setRules={setRules}
            validate={validate}
          />
        </>,
      )
    }

    it('should be named by its label and described by the helper', () => {
      renderReused()

      const input = screen.getByRole('textbox', { name: 'Block phrases:' })
      expect(input).toHaveAccessibleDescription('Each entry is matched as a whole phrase.')
      expect(input).toHaveAttribute('placeholder', 'Add a word or phrase, then press Enter')
      expect(input).toHaveAttribute('enterkeyhint', 'done')
    })

    it('should mark the input invalid when told to', () => {
      renderReused(true)

      expect(screen.getByRole('textbox', { name: 'Block phrases:' })).toBeInvalid()
    })

    it('should not mark the input invalid otherwise', () => {
      renderReused()

      expect(screen.getByRole('textbox', { name: 'Block phrases:' })).toBeValid()
    })

    it('should add an entry that passes its validator', async () => {
      renderReused()

      await userEvent.type(screen.getByRole('textbox', { name: 'Block phrases:' }), 'usd 12/hour{Enter}')

      expect(setRules).toHaveBeenCalledWith(['crypto', 'usd 12/hour'])
      expect(onInvalid).not.toHaveBeenCalled()
    })

    it('should report an entry that fails its validator without adding it', async () => {
      renderReused()

      await userEvent.type(screen.getByRole('textbox', { name: 'Block phrases:' }), 'far too long a phrase{Enter}')

      expect(onInvalid).toHaveBeenCalledWith('far too long a phrase')
      expect(setRules).not.toHaveBeenCalled()
    })

    it('should keep a rejected entry in the box so it can be fixed', async () => {
      renderReused()

      const input = screen.getByRole('textbox', { name: 'Block phrases:' })
      await userEvent.type(input, 'far too long a phrase{Enter}')

      expect(input).toHaveValue('far too long a phrase')
    })

    it('should clear the box once an entry is accepted', async () => {
      renderReused()

      const input = screen.getByRole('textbox', { name: 'Block phrases:' })
      await userEvent.type(input, 'usd 12/hour{Enter}')

      expect(input).toHaveValue('')
    })

    it('should trim an entry before adding it', async () => {
      renderReused()

      await userEvent.type(screen.getByRole('textbox', { name: 'Block phrases:' }), '  usd 12/hour  {Enter}')

      expect(setRules).toHaveBeenCalledWith(['crypto', 'usd 12/hour'])
    })

    it('should not add an entry already on the list, ignoring case', async () => {
      renderReused()

      const input = screen.getByRole('textbox', { name: 'Block phrases:' })
      await userEvent.type(input, ' CRYPTO {Enter}')

      expect(setRules).not.toHaveBeenCalled()
      expect(onInvalid).not.toHaveBeenCalled()
      expect(input).toHaveValue(' CRYPTO ')
    })
  })

  it('should not accept typing while disabled', async () => {
    render(<BounceSenderInput disabled={true} label="Bounce:" rules={[]} setRules={setRules} />)

    await userEvent.type(screen.getByRole('textbox'), 'ok.com{Enter}')

    expect(setRules).not.toHaveBeenCalled()
  })
})
