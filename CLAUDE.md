# emails-ui

## General

**Always commit changes** after completing work unless explicitly told not to.

Use functional programming style where practical, including dependency injection, avoiding mutating objects or values, etc. Always use functional components.

This repo is the Next.js (Pages Router, static export) UI for the `emails` project, backed by `emails-email-api` via AWS Amplify's API client for HTTP requests and Cognito for auth.

## Code Layout

- `src/assets/` — static files: images, CSS, JSON data.
- `src/components/` — React components. Each component has an `index.tsx` (plus any supporting files) and, colocated in the same directory, ONE `index.test.tsx` that tests every file in that component.
- `src/config/` — Amplify config (JWT authorization).
- `src/pages/` — the pages served directly by this UI; kept bare-bones, importing components rather than containing logic. **Page tests are NOT colocated** — they live under `test/pages/`, mirroring the `src/pages/` path (e.g. `src/pages/compose.tsx` -> `test/pages/compose.test.tsx`), because `next-sitemap`/Next's page resolution would otherwise treat a colocated `*.test.tsx` as a route.
- `src/services/` — clients for outside resources, primarily the Amplify API client. Have side effects; only catch expected exceptions.
- `src/environment.d.ts` — environment variable types (see `.env.development`/`.env.production` for values).
- `src/types.ts` — all exported types/interfaces.
- `template.yaml` — infrastructure unique to this repo (S3 static site + CloudFront + Route53). Infrastructure shared across the `emails` project lives in the separate `emails-infrastructure` repo.
- Imports from within the repo use the path aliases in `tsconfig.json` (`@components/`, `@config/`, `@pages/`, `@services/`, `@test/`, `@types`, `@assets/`) rather than deep relative paths.

## Testing Standards

**Jest clears all mocks automatically** (`clearMocks: true` in jest.config.js). Never manually clear mocks.

**Mock state:** Set shared defaults in `beforeAll`. Override per-test with `mockReturnValueOnce` / `mockResolvedValueOnce` / `mockRejectedValueOnce`. Never use `beforeEach` — write a named `setup()` function if repeated arrangement is needed and call it explicitly.

**Typing mocks:** Use `jest.mocked(fn)` to get a typed mock, not `fn as jest.Mock`. Never use `jest.spyOn`.

**Prefer `userEvent` over `fireEvent`** for interacting with the DOM.

**Non-determinism:** Any function that uses `Date.now()`, `Math.random()`, or `crypto.randomUUID()` to produce a value that affects test outcomes MUST accept it as an injectable parameter with a default:

```ts
// source
export const createThing = (input: Input, now = Date.now): Thing => ({ ...input, createdAt: now() })

// test
it('sets createdAt', () => {
  expect(createThing(input, () => 1_000_000).createdAt).toBe(1_000_000)
})
```

**Fake timers:** Use `jest.useFakeTimers()` in `beforeAll` (and `jest.useRealTimers()` in `afterAll`) when the code under test calls `setTimeout`, `setInterval`, or `Date` internally without injection.

**No CSS or style assertions.** Test observable, user-facing behavior: visible text, calls to collaborators (e.g. "clicking submit calls `postSentEmail`") — not CSS classes or disabled attributes directly.

**No `if` statements in tests.** No live `Date.now()` or `Math.random()` calls in test bodies. No date arithmetic that depends on the current wall-clock time.

**Deterministic above all.** A test that passes today and fails tomorrow is broken.

## Accessibility

**All designs must meet WCAG AA.** This includes: sufficient color contrast (4.5:1 for normal text, 3:1 for large text), full keyboard navigability, visible focus indicators, appropriate ARIA roles/labels, and no content that relies on color alone. Run an accessibility audit before marking UI work complete.

## Copy and UX Writing

**All user-facing copy, CTAs, labels, and error messages must be reviewed by a UX expert and by Steven Pinker's principles** (plain language, active voice, concrete nouns, no jargon, no weasel words). Apply the suggested changes unless they conflict with technical constraints.
