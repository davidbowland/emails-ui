/* eslint-disable sort-keys */
import {
  Account,
  AccountBatch,
  AmplifyUser,
  Email,
  EmailAddress,
  EmailBatch,
  EmailContents,
  EmailOutbound,
  PatchOperation,
  Theme,
} from '@types'

export const accountId = 'dave'

export const account: Account = {
  forwardTargets: ['any@domain.com'],
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

export const attachmentContents = new Blob(['Hello, world'], {
  type: 'text/plain',
})

export const attachmentId = '9ijh-6tfg-dfsf3-sdfio-johac'

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
  attachments: [
    {
      filename: '20221018_135343.jpg',
      id: '18453696e0bac7e24cd1',
      size: 1731238,
      type: 'attachment',
    },
    {
      filename: '20221101_212453.jpg',
      id: '184536985e234b582b22',
      size: 1555850,
      type: 'attachment',
    },
  ],
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

export const theme = {
  breakpoints: {
    keys: ['xs', 'sm', 'md', 'lg', 'xl'],
    values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 },
    unit: 'px',
  },
  direction: 'ltr',
  components: {},
  palette: {
    mode: 'dark',
    common: { black: '#000', white: '#fff' },
    primary: { main: '#90caf9', light: '#e3f2fd', dark: '#42a5f5', contrastText: 'rgba(0, 0, 0, 0.87)' },
    secondary: { main: '#ce93d8', light: '#f3e5f5', dark: '#ab47bc', contrastText: 'rgba(0, 0, 0, 0.87)' },
    error: { main: '#f44336', light: '#e57373', dark: '#d32f2f', contrastText: '#fff' },
    warning: { main: '#ffa726', light: '#ffb74d', dark: '#f57c00', contrastText: 'rgba(0, 0, 0, 0.87)' },
    info: { main: '#29b6f6', light: '#4fc3f7', dark: '#0288d1', contrastText: 'rgba(0, 0, 0, 0.87)' },
    success: { main: '#66bb6a', light: '#81c784', dark: '#388e3c', contrastText: 'rgba(0, 0, 0, 0.87)' },
    grey: {
      '50': '#fafafa',
      '100': '#f5f5f5',
      '200': '#eeeeee',
      '300': '#e0e0e0',
      '400': '#bdbdbd',
      '500': '#9e9e9e',
      '600': '#757575',
      '700': '#616161',
      '800': '#424242',
      '900': '#212121',
      A100: '#f5f5f5',
      A200: '#eeeeee',
      A400: '#bdbdbd',
      A700: '#616161',
    },
    contrastThreshold: 3,
    tonalOffset: 0.2,
    text: {
      primary: '#fff',
      secondary: 'rgba(255, 255, 255, 0.7)',
      disabled: 'rgba(255, 255, 255, 0.5)',
      icon: 'rgba(255, 255, 255, 0.5)',
    },
    divider: 'rgba(255, 255, 255, 0.12)',
    background: { paper: '#121212', default: '#121212' },
    action: {
      active: '#fff',
      hover: 'rgba(255, 255, 255, 0.08)',
      hoverOpacity: 0.08,
      selected: 'rgba(255, 255, 255, 0.16)',
      selectedOpacity: 0.16,
      disabled: 'rgba(255, 255, 255, 0.3)',
      disabledBackground: 'rgba(255, 255, 255, 0.12)',
      disabledOpacity: 0.38,
      focus: 'rgba(255, 255, 255, 0.12)',
      focusOpacity: 0.12,
      activatedOpacity: 0.24,
    },
  },
  shape: { borderRadius: 4 },
  mixins: {
    toolbar: {
      minHeight: 56,
      '@media (min-width:0px) and (orientation: landscape)': { minHeight: 48 },
      '@media (min-width:600px)': { minHeight: 64 },
    },
  },
  shadows: [
    'none',
    '0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12)',
    '0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12)',
    '0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px rgba(0,0,0,0.12)',
    '0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12)',
    '0px 3px 5px -1px rgba(0,0,0,0.2),0px 5px 8px 0px rgba(0,0,0,0.14),0px 1px 14px 0px rgba(0,0,0,0.12)',
    '0px 3px 5px -1px rgba(0,0,0,0.2),0px 6px 10px 0px rgba(0,0,0,0.14),0px 1px 18px 0px rgba(0,0,0,0.12)',
    '0px 4px 5px -2px rgba(0,0,0,0.2),0px 7px 10px 1px rgba(0,0,0,0.14),0px 2px 16px 1px rgba(0,0,0,0.12)',
    '0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12)',
    '0px 5px 6px -3px rgba(0,0,0,0.2),0px 9px 12px 1px rgba(0,0,0,0.14),0px 3px 16px 2px rgba(0,0,0,0.12)',
    '0px 6px 6px -3px rgba(0,0,0,0.2),0px 10px 14px 1px rgba(0,0,0,0.14),0px 4px 18px 3px rgba(0,0,0,0.12)',
    '0px 6px 7px -4px rgba(0,0,0,0.2),0px 11px 15px 1px rgba(0,0,0,0.14),0px 4px 20px 3px rgba(0,0,0,0.12)',
    '0px 7px 8px -4px rgba(0,0,0,0.2),0px 12px 17px 2px rgba(0,0,0,0.14),0px 5px 22px 4px rgba(0,0,0,0.12)',
    '0px 7px 8px -4px rgba(0,0,0,0.2),0px 13px 19px 2px rgba(0,0,0,0.14),0px 5px 24px 4px rgba(0,0,0,0.12)',
    '0px 7px 9px -4px rgba(0,0,0,0.2),0px 14px 21px 2px rgba(0,0,0,0.14),0px 5px 26px 4px rgba(0,0,0,0.12)',
    '0px 8px 9px -5px rgba(0,0,0,0.2),0px 15px 22px 2px rgba(0,0,0,0.14),0px 6px 28px 5px rgba(0,0,0,0.12)',
    '0px 8px 10px -5px rgba(0,0,0,0.2),0px 16px 24px 2px rgba(0,0,0,0.14),0px 6px 30px 5px rgba(0,0,0,0.12)',
    '0px 8px 11px -5px rgba(0,0,0,0.2),0px 17px 26px 2px rgba(0,0,0,0.14),0px 6px 32px 5px rgba(0,0,0,0.12)',
    '0px 9px 11px -5px rgba(0,0,0,0.2),0px 18px 28px 2px rgba(0,0,0,0.14),0px 7px 34px 6px rgba(0,0,0,0.12)',
    '0px 9px 12px -6px rgba(0,0,0,0.2),0px 19px 29px 2px rgba(0,0,0,0.14),0px 7px 36px 6px rgba(0,0,0,0.12)',
    '0px 10px 13px -6px rgba(0,0,0,0.2),0px 20px 31px 3px rgba(0,0,0,0.14),0px 8px 38px 7px rgba(0,0,0,0.12)',
    '0px 10px 13px -6px rgba(0,0,0,0.2),0px 21px 33px 3px rgba(0,0,0,0.14),0px 8px 40px 7px rgba(0,0,0,0.12)',
    '0px 10px 14px -6px rgba(0,0,0,0.2),0px 22px 35px 3px rgba(0,0,0,0.14),0px 8px 42px 7px rgba(0,0,0,0.12)',
    '0px 11px 14px -7px rgba(0,0,0,0.2),0px 23px 36px 3px rgba(0,0,0,0.14),0px 9px 44px 8px rgba(0,0,0,0.12)',
    '0px 11px 15px -7px rgba(0,0,0,0.2),0px 24px 38px 3px rgba(0,0,0,0.14),0px 9px 46px 8px rgba(0,0,0,0.12)',
  ],
  typography: {
    htmlFontSize: 16,
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 14,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    h1: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      fontWeight: 300,
      fontSize: '6rem',
      lineHeight: 1.167,
      letterSpacing: '-0.01562em',
    },
    h2: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      fontWeight: 300,
      fontSize: '3.75rem',
      lineHeight: 1.2,
      letterSpacing: '-0.00833em',
    },
    h3: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      fontWeight: 400,
      fontSize: '3rem',
      lineHeight: 1.167,
      letterSpacing: '0em',
    },
    h4: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      fontWeight: 400,
      fontSize: '2.125rem',
      lineHeight: 1.235,
      letterSpacing: '0.00735em',
    },
    h5: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      fontWeight: 400,
      fontSize: '1.5rem',
      lineHeight: 1.334,
      letterSpacing: '0em',
    },
    h6: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      fontWeight: 500,
      fontSize: '1.25rem',
      lineHeight: 1.6,
      letterSpacing: '0.0075em',
    },
    subtitle1: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      fontWeight: 400,
      fontSize: '1rem',
      lineHeight: 1.75,
      letterSpacing: '0.00938em',
    },
    subtitle2: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: 1.57,
      letterSpacing: '0.00714em',
    },
    body1: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      fontWeight: 400,
      fontSize: '1rem',
      lineHeight: 1.5,
      letterSpacing: '0.00938em',
    },
    body2: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      fontWeight: 400,
      fontSize: '0.875rem',
      lineHeight: 1.43,
      letterSpacing: '0.01071em',
    },
    button: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: 1.75,
      letterSpacing: '0.02857em',
      textTransform: 'uppercase',
    },
    caption: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      fontWeight: 400,
      fontSize: '0.75rem',
      lineHeight: 1.66,
      letterSpacing: '0.03333em',
    },
    overline: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      fontWeight: 400,
      fontSize: '0.75rem',
      lineHeight: 2.66,
      letterSpacing: '0.08333em',
      textTransform: 'uppercase',
    },
  },
  transitions: {
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
  },
  zIndex: {
    mobileStepper: 1000,
    speedDial: 1050,
    appBar: 1100,
    drawer: 1200,
    modal: 1300,
    snackbar: 1400,
    tooltip: 1500,
  },
} as unknown as Theme
