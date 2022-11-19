declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GATSBY_COGNITO_APP_CLIENT_ID: string
      GATSBY_COGNITO_USER_POOL_ID: string
      GATSBY_DOMAIN: string
      GATSBY_DRAWER_WIDTH: string
      GATSBY_EMAILS_API_BASE_URL: string
      GATSBY_IDENTITY_POOL_ID: string
      GATSBY_MAX_UPLOAD_SIZE: string
      GATSBY_PINPOINT_ID: string
    }
  }
}

export {}
