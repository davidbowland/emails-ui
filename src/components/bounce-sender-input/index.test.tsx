import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'

import BounceSenderInput from './index'

jest.mock('aws-amplify')

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

    const input = (await screen.findByRole('combobox')) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'new@spam.com' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(setRules).toHaveBeenCalledWith(['spam@domain.com', 'badguys.com', '*', 'new@spam.com'])
  })

  it('should allow adding a new domain rule', async () => {
    render(<BounceSenderInput label="Bounce:" rules={testRules} setRules={setRules} />)

    const input = (await screen.findByRole('combobox')) as HTMLInputElement
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

    // Verify that * rule is displayed as "All senders"
    expect(await screen.findByText(/All senders/i)).toBeVisible()
    expect(await screen.findByText(/spam@domain\.com/i)).toBeVisible()
  })

  it('should reject invalid email addresses', async () => {
    render(<BounceSenderInput label="Bounce:" rules={[]} setRules={setRules} />)

    const input = (await screen.findByRole('combobox')) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'invalid-email' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(setRules).toHaveBeenCalledWith([])
  })

  it('should reject invalid domain rules', async () => {
    render(<BounceSenderInput label="Bounce:" rules={[]} setRules={setRules} />)

    const input = (await screen.findByRole('combobox')) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'invalid' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(setRules).toHaveBeenCalledWith([])
  })

  it('should accept valid email with dot after at', async () => {
    render(<BounceSenderInput label="Bounce:" rules={[]} setRules={setRules} />)

    const input = (await screen.findByRole('combobox')) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'user@domain.com' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(setRules).toHaveBeenCalledWith(['user@domain.com'])
  })

  it('should accept * as all senders rule', async () => {
    render(<BounceSenderInput label="Bounce:" rules={[]} setRules={setRules} />)

    const input = (await screen.findByRole('combobox')) as HTMLInputElement
    fireEvent.change(input, { target: { value: '*' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(setRules).toHaveBeenCalledWith(['*'])
  })
})
