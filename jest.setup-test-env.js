// Environment variables
process.env.NEXT_PUBLIC_COGNITO_APP_CLIENT_ID = 'poiuytresdfghjk'
process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID = 'us-east-1_gfcvbuhg'
process.env.NEXT_PUBLIC_DOMAIN = 'domain.com'
process.env.NEXT_PUBLIC_DRAWER_WIDTH = '240'
process.env.NEXT_PUBLIC_EMAILS_API_BASE_URL = 'http://localhost:9000/v1'
process.env.NEXT_PUBLIC_IDENTITY_POOL_ID = 'us-east-1:hgfds-98765-kjhgvc-jnhbgf'
process.env.NEXT_PUBLIC_MAX_UPLOAD_SIZE = '10000000'

window.URL.createObjectURL = jest.fn()
window.URL.revokeObjectURL = jest.fn()
