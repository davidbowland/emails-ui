import React from 'react'

import Badge from '@components/ui/badge'
import { PencilIcon } from '@components/ui/icons'
import SectionHeading from '@components/ui/section-heading'

export interface FormSectionProps {
  children?: React.ReactNode
  heading: string
  headingId: string
  // 'unsaved' marks a section with changes not yet saved; 'auto' says it saves on its own.
  status?: 'unsaved' | 'auto'
}

const FormSection = ({ children, heading, headingId, status }: FormSectionProps): React.ReactNode => (
  <section
    aria-labelledby={headingId}
    style={status === 'unsaved' ? { boxShadow: 'inset 3px 0 0 var(--accent)', paddingLeft: '12px' } : undefined}
  >
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1" style={{ marginBottom: '12px' }}>
      <SectionHeading id={headingId} tabIndex={-1}>
        {heading}
      </SectionHeading>
      {status === 'unsaved' && (
        <Badge icon={PencilIcon} size="sm" surface="paper" tone="accent">
          Not saved yet
        </Badge>
      )}
      {status === 'auto' && (
        <Badge size="sm" surface="paper" tone="neutral">
          Saves automatically
        </Badge>
      )}
    </div>
    {children}
  </section>
)

export default FormSection
