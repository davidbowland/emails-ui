import { Amplify } from 'aws-amplify'

const appClientId = process.env.NEXT_PUBLIC_COGNITO_APP_CLIENT_ID
const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID

export const baseUrl = process.env.NEXT_PUBLIC_EMAILS_API_BASE_URL

// Amplify handles Cognito only. HTTP requests go through `fetch` in services/emails.ts, which
// carries an explicit bearer token -- every emails-email-api route sits behind the JWT authorizer,
// so nothing here needs identity-pool credentials or SigV4 signing.
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolClientId: appClientId,
      userPoolId,
    },
  },
})
