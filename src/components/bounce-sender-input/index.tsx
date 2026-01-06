import React from 'react'

import Autocomplete from '@mui/material/Autocomplete'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

type BounceRuleSetter = (value: string[]) => void

export interface BounceSenderInputProps {
  label: string
  rules: string[]
  setRules?: BounceRuleSetter
}

const validateBounceRule = (input: string): boolean => {
  const trimmed = input.trim()

  // All senders
  if (trimmed === '*') {
    return true
  }

  // Email
  const atIndex = trimmed.indexOf('@')
  if (atIndex > 0) {
    return trimmed.indexOf('.', atIndex) > 0
  }

  // Domain
  return trimmed.indexOf('.') > 0
}

const formatRuleDisplay = (rule: string): string => {
  const trimmed = rule.trim()
  if (trimmed === '*') {
    return 'All senders'
  }
  return rule
}

const BounceSenderInput = ({ label, rules, setRules }: BounceSenderInputProps): JSX.Element => {
  const handleChange = (_event: React.SyntheticEvent, newValue: string[]): void => {
    if (!setRules) return

    const validRules = newValue.filter(validateBounceRule)
    setRules(validRules)
  }

  return (
    <Grid alignItems="center" container padding={2} paddingBottom={1} paddingTop={1} spacing={1}>
      <Grid item padding={1} xs="auto">
        <Typography paddingTop={1} variant="body1">
          {label}
        </Typography>
      </Grid>
      <Grid item xs>
        <Autocomplete
          freeSolo
          multiple
          onChange={handleChange}
          options={[]}
          renderInput={(params) => (
            <TextField
              {...params}
              disabled={!setRules}
              label="Bounce rule"
              placeholder="Email, @domain.com, or * for all"
              size="small"
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((rule, index) => {
              const { key, ...tagProps } = getTagProps({ index })
              const displayValue = formatRuleDisplay(rule)

              return <Chip key={key} label={displayValue} variant="outlined" {...tagProps} />
            })
          }
          value={rules}
        />
      </Grid>
    </Grid>
  )
}

export default BounceSenderInput
