/* eslint-disable sort-keys */
import {
  Account,
  AccountBatch,
  AmplifyUser,
  Email,
  EmailAddress,
  EmailAttachment,
  EmailBatch,
  EmailContents,
  EmailOutbound,
  PatchOperation,
  PostSignedUrl,
  SignedUrl,
} from '@types'

export const accountId = 'dave'

export const account: Account = {
  bounceSenders: ['spam@domain.com'],
  forwardTargets: ['any@domain.com'],
  id: accountId,
  name: 'Dave',
}

export const accountBatch: AccountBatch[] = [
  {
    data: account,
    id: accountId,
  },
]

export const addresses: EmailAddress[] = [
  {
    address: 'a@domain.com',
    name: 'A',
  },
  {
    address: 'b@domain.com',
    name: '',
  },
]

export const attachments: EmailAttachment[] = [
  {
    filename: '20221018_135343.jpg',
    id: '18453696e0bac7e24cd1',
    key: 'attachments/account/18453696e0bac7e24cd1',
    size: 1731238,
    type: 'image/jpeg',
  },
  {
    filename: '20221101_212453.jpg',
    id: '184536985e234b582b22',
    key: 'attachments/account/184536985e234b582b22',
    size: 1555850,
    type: 'image/jpeg',
  },
]

export const attachmentId = '9ijh-6tfg-dfsf3-sdfio-johac'

export const attachmentUrl: SignedUrl = {
  url: 'http://localhost/a/really/long/url#with-an-access-key',
}

export const emailId = '7yh8g-7ytguy-98ui8u-5efka-87y87y'

export const email: Email = {
  from: 'another@domain.com',
  subject: 'Hello, world of email',
  timestamp: 1666560735998,
  to: ['account@domain.com'],
  viewed: false,
}

export const emailBatch: EmailBatch[] = [
  {
    accountId,
    data: {
      from: 'another@domain.com',
      subject: 'Second email',
      timestamp: 166656073284,
      to: ['account@domain.com'],
      viewed: true,
    },
    id: '8765rdfhjiy6th',
  },
  {
    accountId,
    data: email,
    id: emailId,
  },
]

export const emailContents: EmailContents = {
  attachments,
  bccAddress: {
    value: [
      {
        address: 'blind@domain.com',
        name: '',
      },
    ],
    html: '<span class="mp_address_group"><a href="mailto:blind@domain.com" class="mp_address_email">blind@domain.com</a></span>',
    text: 'blind@domain.com',
  },
  bodyHtml:
    '<div dir="auto">7:47</div>\n<a href="https://dbowland.com" style="background-image: url(https://dbowland.com); color: red;">dbowland.com</a><style type="text/css">a { background-image: url(https://dbowland.com); color: blue; }</style>',
  bodyText: '7:46\n',
  ccAddress: {
    value: [
      {
        address: 'someone@domain.com',
        name: '',
      },
      {
        address: 'fred@domain.com',
        name: 'Fred',
      },
    ],
    html: '<span class="mp_address_group"><a href="mailto:someone@domain.com" class="mp_address_email">someone@domain.com</a></span>,<span class="mp_address_group"><span class="mp_address_name">Another Person</span> &lt;<a href="mailto:fred@domain.com" class="mp_address_email">fred@domain.com</a>&gt;</span>',
    text: 'someone@domain.com,fred@domain.com',
  },
  date: '2018-08-06T00:58:58.000Z',
  fromAddress: {
    value: [
      {
        address: 'another@domain.com',
        name: 'Another Person',
      },
    ],
    html: '<span class="mp_address_group"><span class="mp_address_name">Another Person</span> &lt;<a href="mailto:another@domain.com" class="mp_address_email">another@domain.com</a>&gt;</span>',
    text: 'Another Person <another@domain.com>',
  },
  headers: {},
  id: '<CAK3xQ71DdqxNzO90KnP6dq5ZU5hvehdQLY96bpaRiCeScOQ4Xg@mail.domain.com>',
  references: [],
  replyToAddress: {
    display: 'reply@domain.com',
    value: [
      {
        address: 'reply@domain.com',
        name: '',
      },
    ],
  },
  subject: 'Hello, world',
  toAddress: {
    value: [
      {
        address: 'account@domain.com',
        name: '',
      },
      {
        address: 'admin@domain.com',
        name: 'Admin',
      },
    ],
    html: '<span class="mp_address_group"><a href="mailto:account@domain.com" class="mp_address_email">account@domain.com</a></span>,<span class="mp_address_group"><span class="mp_address_name">Admin</span> &lt;<a href="mailto:admin@domain.com" class="mp_address_email">admin@domain.com</a>&gt;</span>',
    text: 'account@domain.com,admin@domain.com',
  },
}

export const jsonPatchOperations: PatchOperation[] = [
  { op: 'replace', path: '/forwardTargets', value: ['another@domain.com'] },
]

export const outboundEmail: EmailOutbound = {
  bcc: [{ address: 'bcc@domain.com', name: 'BCC' }],
  cc: [{ address: 'cc@domain.com', name: 'CC' }],
  from: { address: 'account@domain.com', name: 'Any' },
  html: '<p>Lorem ipsum</p>',
  inReplyTo: '765rf-76trf-90oij-edfvb-nbfa2',
  references: ['765rf-76trf-90oij-edfvb-nbfa2', '5tyha-0oigk-mnfdb-dfgsh-jhgfa'],
  replyTo: { address: 'account@domain.com', name: 'Any' },
  sender: { address: 'account@domain.com', name: 'Any' },
  subject: 'Hello, world!',
  text: 'Lorem ipsum',
  to: [{ address: 'another@domain.com', name: 'Someone else' }],
}

export const postAttachmentResult: PostSignedUrl = {
  fields: {
    Policy: 'eyJleHBpcmF0aW9uIjoiMjAyMi0xMS',
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': 'ASIAXGOMQQ35UBADF3FP/20221117/us-east-1/s3/aws4_request',
    'X-Amz-Date': '20221117T061759Z',
    'X-Amz-Security-Token': 'IQoJb3JpZ2luX2VjEB4aCXVzLWVhc3QtMiJIMEYCIQCLh3B9MRsCAXTnu0',
    'X-Amz-Signature': 'f6e87c8b350576d9a3ca56b70660',
    bucket: 'emails-service-storage-test',
    key: 'attachments/account/uuuuu-uuuuu-iiiii-ddddd',
  },
  url: 'http://localhost/emails-service-storage-test',
}

export const user: AmplifyUser = {
  username: accountId,
  pool: {
    userPoolId: 'us-east-2_xqxzyIOz4',
    clientId: '135qlssf7st66v1vl5dtopfeks',
    client: { endpoint: 'https://cognito-idp.us-east-2.amazonaws.com/', fetchOptions: {} },
    advancedSecurityDataCollectionFlag: true,
    storage: {},
  },
  Session: null,
  client: { endpoint: 'https://cognito-idp.us-east-2.amazonaws.com/', fetchOptions: {} },
  signInUserSession: {
    idToken: {
      jwtToken: 'id-jwt',
    },
    refreshToken: {
      token: 'refresh-token',
    },
    accessToken: {
      jwtToken: 'access-token',
    },
    clockDrift: 0,
  },
  authenticationFlowType: 'USER_SRP_AUTH',
  storage: {},
  attributes: {
    sub: '178300fb-3ab6-41e2-bab6-231964026e42',
    name: 'Dave',
    phone_number_verified: 'true',
    phone_number: '+15551234567',
  },
  preferredMFA: 'NOMFA',
} as any
