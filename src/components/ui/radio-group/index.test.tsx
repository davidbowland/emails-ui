import React from 'react'

import RadioGroup from './index'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const OPTIONS = [
  { description: 'Catches the most spam.', label: 'High', value: 'high' },
  { label: 'Low', value: 'low' },
]

describe('RadioGroup component', () => {
  const onChange = jest.fn()

  it('should render a group named by its legend', () => {
    render(<RadioGroup legend="Sensitivity" name="s" onChange={onChange} options={OPTIONS} value="low" />)

    expect(screen.getByRole('radiogroup', { name: 'Sensitivity' })).toBeVisible()
    expect(screen.getByRole('radio', { name: 'Low' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'High' })).not.toBeChecked()
  })

  it('should describe an option by its description, not name it', () => {
    render(<RadioGroup legend="Sensitivity" name="s" onChange={onChange} options={OPTIONS} value="low" />)

    expect(screen.getByRole('radio', { name: 'High' })).toHaveAccessibleDescription('Catches the most spam.')
  })

  it('should call onChange with the chosen value', async () => {
    render(<RadioGroup legend="Sensitivity" name="s" onChange={onChange} options={OPTIONS} value="low" />)

    await userEvent.click(screen.getByRole('radio', { name: 'High' }))

    expect(onChange).toHaveBeenCalledWith('high')
  })

  it('should ignore choices while read-only', async () => {
    render(<RadioGroup legend="Sensitivity" name="s" onChange={onChange} options={OPTIONS} readOnly value="low" />)

    await userEvent.click(screen.getByRole('radio', { name: 'High' }))

    expect(onChange).not.toHaveBeenCalled()
  })

  it('should render help between the legend and the options', () => {
    render(
      <RadioGroup
        help="Higher catches more."
        legend="Sensitivity"
        name="s"
        onChange={onChange}
        options={OPTIONS}
        value="low"
      />,
    )

    const legend = screen.getByText('Sensitivity')
    const help = screen.getByText('Higher catches more.')
    const firstOption = screen.getByRole('radio', { name: 'High' })
    expect(legend.compareDocumentPosition(help)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(help.compareDocumentPosition(firstOption)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })

  it('should describe the group by its help, then by describedBy', () => {
    render(
      <>
        <p id="status">Saving</p>
        <RadioGroup
          describedBy="status"
          help="Higher catches more."
          legend="Sensitivity"
          name="s"
          onChange={onChange}
          options={OPTIONS}
          value="low"
        />
      </>,
    )

    expect(screen.getByRole('radiogroup', { name: 'Sensitivity' })).toHaveAccessibleDescription(
      'Higher catches more. Saving',
    )
  })

  it('should describe the group by its help alone', () => {
    render(
      <RadioGroup
        help="Higher catches more."
        legend="Sensitivity"
        name="s"
        onChange={onChange}
        options={OPTIONS}
        value="low"
      />,
    )

    expect(screen.getByRole('radiogroup', { name: 'Sensitivity' })).toHaveAccessibleDescription('Higher catches more.')
  })

  it('should tell assistive tech the group is read-only while read-only', () => {
    render(<RadioGroup legend="Sensitivity" name="s" onChange={onChange} options={OPTIONS} readOnly value="low" />)

    expect(screen.getByRole('radiogroup', { name: 'Sensitivity' })).toHaveAttribute('aria-readonly', 'true')
  })

  it('should not mark the group read-only otherwise', () => {
    render(<RadioGroup legend="Sensitivity" name="s" onChange={onChange} options={OPTIONS} value="low" />)

    expect(screen.getByRole('radiogroup', { name: 'Sensitivity' })).not.toHaveAttribute('aria-readonly')
  })

  it('should expose describedBy and busy on the group', () => {
    render(
      <>
        <p id="status">Saving</p>
        <RadioGroup
          busy={true}
          describedBy="status"
          legend="Sensitivity"
          name="s"
          onChange={onChange}
          options={OPTIONS}
          value="low"
        />
      </>,
    )

    const group = screen.getByRole('radiogroup', { name: 'Sensitivity', busy: true })
    expect(group).toHaveAccessibleDescription('Saving')
  })
})
