import React, { useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import Box from '@mui/material/Box'
import CheckIcon from '@mui/icons-material/Check'
import EditIcon from '@mui/icons-material/Edit'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import { styled } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import { EmailAddress } from '@types'

const RoundedBox = styled(Box)(() => ({
  borderRadius: '15px',
}))

type AddressSetter = (value: EmailAddress[]) => void

export interface AddressLineProps {
  addresses: EmailAddress[]
  label: string
  setAddresses?: AddressSetter
}

const AddressLine = ({ addresses, label, setAddresses }: AddressLineProps): JSX.Element => {
  const [editing, setEditing] = useState<number | undefined>(undefined)

  const handleAddressAdd = (setAddresses: AddressSetter): void => {
    setEditing(addresses.length)
    setAddresses([...addresses, { address: '', name: '' }])
  }

  const handleAddressChange = (setAddresses: AddressSetter, value: EmailAddress, target: number): void => {
    setAddresses(addresses.map((address, index) => (index === target ? value : address)))
  }

  const handleAddressSave = (setAddresses: AddressSetter): void => {
    setAddresses(addresses.filter((value) => value.address !== ''))
    setEditing(undefined)
  }

  const renderDisplay = (address: EmailAddress, index: number): JSX.Element => (
    <Grid container>
      <Grid item xs>
        <Typography padding={1} sx={{ maxWidth: { sm: '100%', xs: '30vw' }, wordWrap: 'break-word' }} variant="body1">
          {address.name ? `${address.name} <${address.address}>` : address.address}
        </Typography>
      </Grid>
      {setAddresses && editing === undefined && (
        <Grid item xs="auto">
          <Tooltip title="Edit recipient">
            <IconButton aria-label="Edit recipient" onClick={() => setEditing(index)} size="small">
              <EditIcon />
            </IconButton>
          </Tooltip>
        </Grid>
      )}
    </Grid>
  )

  const renderEditor = (setAddresses: AddressSetter, address: EmailAddress, index: number): JSX.Element => (
    <Grid container>
      <Grid item xs>
        <label>
          <TextField
            label="Email address"
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              handleAddressChange(setAddresses, { address: event.target.value, name: '' }, index)
            }
            size="small"
            sx={{ margin: '0.5em', maxWidth: { sm: '100%', xs: '30vw' } }}
            value={address.address}
          />
        </label>
      </Grid>
      <Grid alignContent="center" item xs="auto">
        <Tooltip title="Save changes">
          <IconButton
            aria-label="Save changes"
            onClick={() => handleAddressSave(setAddresses)}
            sx={{ marginTop: '0.25em' }}
          >
            <CheckIcon />
          </IconButton>
        </Tooltip>
      </Grid>
    </Grid>
  )

  return (
    <Grid alignItems="center" container padding={2} paddingBottom={1} paddingTop={1} spacing={1}>
      <Grid item padding={1} xs="auto">
        <Typography paddingTop={1} variant="body1">
          {label}
        </Typography>
      </Grid>
      {addresses.map((address, index) => (
        <Grid item key={index} xs="auto">
          <RoundedBox sx={{ border: 1 }}>
            {editing === index && setAddresses
              ? renderEditor(setAddresses, address, index)
              : renderDisplay(address, index)}
          </RoundedBox>
        </Grid>
      ))}
      {setAddresses && editing === undefined && (
        <Grid item xs="auto">
          <Tooltip title="Add recipient">
            <IconButton aria-label="Add recipient" onClick={() => handleAddressAdd(setAddresses)}>
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Grid>
      )}
    </Grid>
  )
}

export default AddressLine
