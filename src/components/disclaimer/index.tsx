import React, { useState } from 'react'
import Button from '@mui/material/Button'
import Cookies from 'universal-cookie'
import Drawer from '@mui/material/Drawer'
import Grid from '@mui/material/Grid'
import { Link } from 'gatsby'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

const Disclaimer = (): JSX.Element => {
  const cookies = new Cookies()

  const [open, setOpen] = useState(cookies.get('disclaimer_accept') !== 'true')

  const closeDrawer = (): void => {
    setOpen(false)
    cookies.set('disclaimer_accept', 'true', { path: '/', sameSite: 'strict', secure: true })
  }

  return (
    <>
      {open && (
        <Drawer anchor="bottom" variant="permanent">
          <Stack spacing={1} sx={{ p: 2 }}>
            <Typography variant="h6">Cookie and Privacy Disclosure</Typography>
            <Grid container justifyContent="center" sx={{ width: '100%' }}>
              <Grid item md sm={12}>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    This site only uses essential cookies such as those used to keep you logged in. We may collect your
                    phone number simply to prevent fraud and to keep costs low. Depending on your activity, your IP
                    address may appear in our logs for up to 90 days. We never sell your information, but we do collect
                    device and site usage information using{' '}
                    <Link to="https://aws.amazon.com/pinpoint/">Amazon Pinpoint</Link>.
                  </Typography>
                  <Typography variant="body2">
                    See our <Link to="/privacy-policy">privacy policy</Link> for more information.
                  </Typography>
                </Stack>
              </Grid>
              <Grid item lg={2} md={3} sm={6} sx={{ p: 1, textAlign: 'center' }} xs={12}>
                <Button fullWidth onClick={closeDrawer} variant="contained">
                  Accept &amp; continue
                </Button>
              </Grid>
            </Grid>
          </Stack>
        </Drawer>
      )}
    </>
  )
}

export default Disclaimer
