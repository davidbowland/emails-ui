/* eslint-disable no-undef, @typescript-eslint/no-var-requires */
if (process.env.DEVELOPMENT) {
  require('dotenv').config({
    path: '.env.development',
  })
} else {
  require('dotenv').config({
    path: `.env.${process.env.NODE_ENV}`,
  })
}

module.exports = {
  plugins: [
    {
      options: {
        alias: {
          '@assets': 'src/assets',
          '@components': 'src/components',
          '@config': 'src/config',
          '@pages': 'src/pages',
          '@services': 'src/services',
          '@test': 'test',
          '@types': 'src/types',
        },
        extensions: ['js', 'jsx', 'ts', 'tsx'],
      },
      resolve: 'gatsby-plugin-alias-imports',
    },
    'gatsby-plugin-image',
    'gatsby-plugin-sitemap',
    'gatsby-plugin-sharp',
    'gatsby-transformer-sharp',
    {
      __key: 'images',
      options: {
        name: 'images',
        path: 'src/assets/images/',
      },
      resolve: 'gatsby-source-filesystem',
    },
    {
      __key: 'pages',
      options: {
        name: 'pages',
        path: 'src/pages/',
      },
      resolve: 'gatsby-source-filesystem',
    },
  ],
  siteMetadata: {
    siteUrl: 'https://email.dbowland.com',
    title: 'emails-ui',
  },
}
