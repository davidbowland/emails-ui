# Emails UI

Gatsby and Amplify implementation of emails-email-api. Example: <https://email.dbowland.com/>

## Static Site

### Prerequisites

1. [Node](https://nodejs.org/en/)
1. [NPM](https://www.npmjs.com/)

### Local Development

The Gatsby development server automatically rerenders in the browser when the source code changes. Start the local development server with:

```bash
npm run start
```

Alternatively, run a production build and serve that static content with:

```bash
npm run serve
```

Then view the server at <http://localhost:3000/>

### Unit Tests

[Jest](https://jestjs.io/) tests are run automatically on commit and push. If the test coverage threshold is not met, the push will fail. See `jest.config.ts` for coverage threshold.

Manually run tests with:

```bash
npm run test
```

Snapshots can be updated with:

```bash
npm run test:update-snapshots
```

### Prettier / Linter

Both [Prettier](https://prettier.io/) and [ESLint](https://eslint.org/) are executed on commit. Manually prettify and lint code with:

```bash
npm run lint
```

### Deploying to Production

This project automatically deploys to production when a merge to `master` is made via a pull request.

## Deploy Script

In extreme cases, the UI can be deployed with:

```bash
npm run deploy
```

The `developer` role and [AWS SAM CLI](https://aws.amazon.com/serverless/sam/) are required to deploy this project.

### Testing the Workflow

Use [act](https://github.com/nektos/act) to test the GitHub workflow. Install it with:

```bash
brew install act
```

When running locally, workflow needs some secret values specified. If the necessary environment variables are declared, the secrets can be specified with:

```bash
npm run workflow
```

## Additional Documentation

### Additional Gastby Documentation

- [Documentation](https://www.gatsbyjs.com/docs/)

- [Tutorials](https://www.gatsbyjs.com/tutorial/)

- [Guides](https://www.gatsbyjs.com/tutorial/)

- [API Reference](https://www.gatsbyjs.com/docs/api-reference/)

- [Plugin Library](https://www.gatsbyjs.com/plugins)

- [Cheat Sheet](https://www.gatsbyjs.com/docs/cheat-sheet/)

### Additional Deploy Documentation

- [SSH2 module](https://www.npmjs.com/package/ssh2)

- [SFTP stream methods](https://github.com/mscdex/ssh2-streams/blob/master/SFTPStream.md#sftpstream-methods)

### Additional Workflow Documentation

- [Workflow Syntax for GitHub Actions](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)

- [actions/setup_node](https://github.com/actions/setup-node)

- [actions/checkout](https://github.com/actions/checkout)

- [ad-m/github-push-action](https://github.com/ad-m/github-push-action)

### Deployment Documentation

- [AWS SAM CLI](https://aws.amazon.com/serverless/sam/)
