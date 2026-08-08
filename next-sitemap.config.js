/** @type {import('next-sitemap').IConfig} */

// Every route below also carries <meta name="robots" content="noindex, nofollow">.
// This is a private, Cognito-gated mailbox: to a crawler these routes are a sign-in
// form or an error message, so there is nothing worth putting in a search index.
// They are deliberately NOT disallowed in robots.txt — a crawler has to fetch a page
// to see its noindex, so blocking it would leave the URL indexable from inbound links.
// The privacy policy is public content and stays indexable.
const noIndexRoutes = ['/', '/400', '/403', '/404', '/500', '/compose', '/inbox', '/outbox', '/settings']

module.exports = {
  siteUrl: 'https://email.dbowland.com',
  // Written into the static export, which is what deploys to S3. The default (./public)
  // is copied into ./out by `next build`, which runs before `next-sitemap` — so the
  // sitemap only ever reached the bucket one build late, and never on a clean checkout.
  outDir: './out',
  // '/*.html' covers the bare 404.html / 500.html Next emits alongside the routes.
  exclude: [...noIndexRoutes, '/*.html'],
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
  },
}
