import { Amplify, Auth } from 'aws-amplify'

const appClientId = process.env.GATSBY_COGNITO_APP_CLIENT_ID
const userPoolId = process.env.GATSBY_COGNITO_USER_POOL_ID
const identityPoolId = process.env.GATSBY_IDENTITY_POOL_ID
export const baseUrl = process.env.GATSBY_EMAILS_API_BASE_URL

// Authorization

export const apiName = 'EmailsAPIGateway'
export const apiNameUnauthenticated = 'EmailsAPIGatewayUnauthenticated'

Amplify.configure({
  API: {
    endpoints: [
      {
        custom_header: async () => ({
          Authorization: `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}`,
        }),
        endpoint: baseUrl,
        name: apiName,
      },
      {
        endpoint: baseUrl,
        name: apiNameUnauthenticated,
      },
    ],
  },
  Auth: {
    identityPoolId,
    mandatorySignIn: false,
    region: userPoolId.split('_')[0],
    userPoolId,
    userPoolWebClientId: appClientId,
  },
})
