declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_COGNITO_APP_CLIENT_ID: string
      NEXT_PUBLIC_COGNITO_USER_POOL_ID: string
      NEXT_PUBLIC_DOMAIN: string
      NEXT_PUBLIC_DRAWER_WIDTH: string
      NEXT_PUBLIC_EMAILS_API_BASE_URL: string
      NEXT_PUBLIC_IDENTITY_POOL_ID: string
      NEXT_PUBLIC_MAX_UPLOAD_SIZE: string
    }
  }
}

export {}
