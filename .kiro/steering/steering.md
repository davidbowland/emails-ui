# Steering for emails-ui

## Description

The repository is part of a larger project called `emails`. It is the UI portion of that project.

Its purpose is to manage email accounts and handle both received and sent emails. It uses the emails-email-api via AWS Amplify's API client.

## Technology Stack

- **Gatsby** - Static site generator and React framework
- **React** - UI library with functional components
- **Material-UI (@mui/material)** - Primary component library
- **AWS Amplify** - Authentication and API client
- **Styled Components** - CSS-in-JS styling
- **TypeScript** - Type safety
- **Jest & React Testing Library** - Testing framework

## Code Layout

### src/assets

- Static files like images, css, or json data

### src/components

- React components
- Each component has an index.tsx but can have multiple supporting files
- Each component has ONE index.test.tsx that tests ALL files for that component
- ALWAYS think about component domain (BAD: Provide score to pass/fail component, GOOD: Provide isPass={score > 80} to pass/fail component)

### src/config

- Amplify config, which handles JWT authorization

### src/pages

- The pages served directly by this UI
- Pages are bare-bones, as they import components

### src/services

- Services that interact with outside resources, especially the dedicated API
- Uses AWS Amplify's API client for HTTP requests
- Have side-effects
- Only catch expected exceptions

### src/environment.d.ts

- Defines available environment variable types
- See .env.development or .env.production for values

### src/types.ts

- ALL types or interfaces that are exported

### template.yaml

- Infrastructure unique to this repository
- Infrastructure shared in the `emails` project is located in a separate `emails-infrastructure` repository, but most infrastructure should be domain-specific

### .github/workflows/pipeline.yaml

- Definition of the GitHub Actions deployment script for this repository

## Rules for Development

- ALWAYS analyze existing patterns in the file and repository and follow them EXACTLY
- Use functional programming, when possible
- Use arrow functions
- ALWAYS use functional components
- **All exported functions / components must specify explicit types for all inputs and return values**
- Imports from within the repository should use paths defined in tsconfig.json (like `@components/`)
- When finished with changes, ALWAYS `npm run test` and ensure tests are passing with adequate coverage
- Use comments to explain WHY rather than WHAT, and use them sparingly

### Type Safety Requirements

```typescript
// All exported functions must have explicit types for parameters and return values:
export const getAccount = async (id: string): Promise<Account | null> => {
  // Implementation
}
```

### Logging Standards

ALL unexpected exceptions should be logged with console.error. Tests should set `console.error = jest.fn()` to silence those expected errors during testing.

### Error Handling Patterns

```typescript
// Frontend components should handle errors gracefully:
export const EmailList: React.FC<EmailListProps> = ({ accountId }) => {
  const [error, setError] = useState<string | null>(null)

  const handleLoadEmails = async (): Promise<void> => {
    try {
      const emails = await getAllReceivedEmails(accountId)
      setEmails(emails)
    } catch (error: unknown) {
      console.error('Failed to load emails', { error })
      setError('Failed to load emails. Please try again.')
    }
  }
}

// Service functions should let errors bubble up:
export const getAccount = async (id: string): Promise<Account> => {
  // Let API errors bubble up to be handled by components
  return API.get(apiName, `/accounts/${encodeURIComponent(id)}`, {})
}
```

## Rules for Testing

- ALWAYS analyze existing patterns in the file and repository and follow them EXACTLY
- **ALL TESTS MUST BE DETERMINISTIC** (no randomness, conditionals, or time-dependent values)
- ALWAYS test user-facing functionality (BAD: expect this object to have certain CSS, BAD: expect this object to be disable, GOOD: try to click on this object and expect no service call, GOOD: is the expected text visible)
- Use comments to explain WHY rather than WHAT, and use them sparingly
- Jest is configured to clear mocks after each test -- NEVER CALL jest.clearAllMocks()
- NEVER use beforeEach or afterEach -- use shared setup/teardown functions defined within the test and invoke them in each test
- EXCLUSIVELY use `mock...Once` in tests and `mock...` (without Once) in beforeAll
- Use jest.mocked for type-safe mocking
- Use UserEvent for interacting with the DOM, when possible
- NEVER use jest.spyOn
- Every exported function should be tested on its own with its own describe block

### Deterministic Testing Requirements

```typescript
// BAD - Non-deterministic:
const timestamp = Date.now()
const randomId = Math.random().toString()
const conditionalValue = Math.random() > 0.5 ? 'a' : 'b'

// GOOD - Deterministic:
const fixedTimestamp = 1640995200000 // Use fixed values
const testId = 'test-message-id-123'
const expectedValue = 'a' // Use consistent test data
```

### Service Mocking Patterns

For mocking AWS Amplify API calls:

```typescript
import { API } from 'aws-amplify'

import * as emailsService from '@services/emails'

jest.mock('aws-amplify')

beforeAll(() => {
  jest.mocked(API).get.mockResolvedValue({ id: 'test-account', name: 'Test Account' })
})
```

For mocking service functions:

```typescript
import * as emailsService from '@services/emails'

const mockAccount = { id: 'test-account', name: 'Test Account', forwardTargets: [] }

beforeAll(() => {
  jest.mocked(emailsService).getAccount.mockResolvedValue(mockAccount)
})
```
