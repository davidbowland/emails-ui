import { Amplify } from 'aws-amplify'

const appClientId = process.env.NEXT_PUBLIC_COGNITO_APP_CLIENT_ID
const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID
const identityPoolId = process.env.NEXT_PUBLIC_IDENTITY_POOL_ID
export const baseUrl = process.env.NEXT_PUBLIC_EMAILS_API_BASE_URL

// Authorization

export const apiName = 'EmailsAPIGateway'
export const apiNameUnauthenticated = 'EmailsAPIGatewayUnauthenticated'

Amplify.configure(
  {
    API: {
      REST: {
        // No `region`: Amplify uses it only to SigV4-sign requests, which the `defaultAuthMode`
        // below switches off.
        [apiName]: {
          endpoint: baseUrl,
        },
        [apiNameUnauthenticated]: {
          endpoint: baseUrl,
        },
      },
    },
    Auth: {
      Cognito: {
        // Inert given `defaultAuthMode: 'none'` — nothing here resolves identity-pool
        // credentials — but left configured so the pool stays declared in one place. v5's
        // `mandatorySignIn: false` maps to v6's `allowGuestAccess`, deliberately omitted for the
        // same reason: it governs only guest credentials, which are never requested now.
        identityPoolId,
        userPoolClientId: appClientId,
        userPoolId,
      },
    },
  },
  {
    API: {
      REST: {
        // Stops Amplify resolving Cognito identity-pool credentials and SigV4-signing every REST
        // call. No emails-email-api route uses IAM auth — every route sits behind the Cognito JWT
        // authorizer — so a signature is never validated, while resolving credentials costs a
        // Cognito round trip and a CORS preflight on anonymous page loads. Authenticated calls
        // carry an explicit bearer token instead; see `authHeaders` in services/emails.ts.
        defaultAuthMode: 'none',
      },
    },
  },
)
