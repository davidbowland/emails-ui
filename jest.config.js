const nextJest = require('next/jest')

const createJestConfig = nextJest({ dir: './' })

/** @type {import('jest').Config} */
const config = {
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*'],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['.*\\.d\\.ts', 'config/*', 'types.ts', '_app.tsx', '_document.tsx'],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 80,
    },
  },
  moduleNameMapper: {
    '.+\\.(css|styl|less|sass|scss)$': 'identity-obj-proxy',
    '.+\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga|pdf|yaml)$':
      '<rootDir>/__mocks__/file-mock.js',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@pages/(.*)$': '<rootDir>/src/pages/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
    '^@types$': '<rootDir>/src/types',
    '^uuid$': '<rootDir>/__mocks__/file-mock.js',
    '@fontsource/(.*)$': '<rootDir>/__mocks__/file-mock.js',
    '@heroui/react': '<rootDir>/__mocks__/@heroui/react.js',
    'lucide-react': '<rootDir>/__mocks__/lucide-react.js',
  },
  setupFiles: ['<rootDir>/jest.polyfills.js', '<rootDir>/jest.setup-test-env.js'],
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
  testPathIgnorePatterns: ['node_modules', '\\.cache', '<rootDir>.*/out'],
  transformIgnorePatterns: ['node_modules/(?!(.*uuid.*)/)'],
}

module.exports = createJestConfig(config)
