// Gatsby loader shim
global.___loader = {
  enqueue: jest.fn(),
}

// Environment variables
process.env.GATSBY_COGNITO_APP_CLIENT_ID = 'poiuytresdfghjk'
process.env.GATSBY_COGNITO_USER_POOL_ID = 'us-east-1_gfcvbuhg'
process.env.GATSBY_EMAILS_API_BASE_URL = 'http://localhost:9000/v1'
process.env.GATSBY_IDENTITY_POOL_ID = 'us-east-1:hgfds-98765-kjhgvc-jnhbgf'
process.env.GATSBY_PINPOINT_ID = '2345yugvbnmmnhgfert'

window.URL.createObjectURL = jest.fn()
