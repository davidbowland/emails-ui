import React from 'react'

import Autocomplete from '@mui/material/Autocomplete'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { EmailAddress } from '@types'

type AddressSetter = (value: EmailAddress[]) => void

export interface AddressLineProps {
  addresses: EmailAddress[]
  label: string
  setAddresses?: AddressSetter
}

const AddressLine = ({ addresses, label, setAddresses }: AddressLineProps): JSX.Element => {
  const handleChange = (event: React.SyntheticEvent, newValue: string[]): void => {
    if (!setAddresses) return

    const emailAddresses = newValue
      .filter((addr) => addr.trim() !== '')
      .map((addr) => ({ address: addr.trim(), name: '' }))

    setAddresses(emailAddresses)
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
            <TextField {...params} disabled={!setAddresses} label="Email address" size="small" />
          )}
          renderTags={(value, getTagProps) =>
            value.map((address, index) => {
              const { key, ...tagProps } = getTagProps({ index })

              // Remove delete functionality when read-only
              if (!setAddresses) {
                const { onDelete: _, ...readOnlyTagProps } = tagProps
                return <Chip key={key} label={address} variant="outlined" {...readOnlyTagProps} />
              }

              return <Chip key={key} label={address} variant="outlined" {...tagProps} />
            })
          }
          value={addresses.map((addr) => addr.address)}
        />
      </Grid>
    </Grid>
  )
}

export default AddressLine
