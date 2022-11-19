// Gatsby loader shim
global.___loader = {
  enqueue: jest.fn(),
}

// Environment variables
process.env.GATSBY_COGNITO_APP_CLIENT_ID = 'poiuytresdfghjk'
process.env.GATSBY_COGNITO_USER_POOL_ID = 'us-east-1_gfcvbuhg'
process.env.GATSBY_DOMAIN = 'domain.com'
process.env.GATSBY_DRAWER_WIDTH = '240'
process.env.GATSBY_EMAILS_API_BASE_URL = 'http://localhost:9000/v1'
process.env.GATSBY_IDENTITY_POOL_ID = 'us-east-1:hgfds-98765-kjhgvc-jnhbgf'
process.env.GATSBY_MAX_UPLOAD_SIZE = '10000000'
process.env.GATSBY_PINPOINT_ID = '2345yugvbnmmnhgfert'

window.URL.createObjectURL = jest.fn()
window.URL.revokeObjectURL = jest.fn()

// ReactDOMServer
import { TextEncoder, TextDecoder } from 'util'
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
