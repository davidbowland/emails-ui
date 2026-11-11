// Component-library enforcement (spec G5 / AC1). Complete flat-config objects so
// they can lint TSX on their own (the fixture test passes them as overrideConfig).
const tseslint = require('typescript-eslint')
const react = require('eslint-plugin-react')

const GLYPHS = '[←→↑↓⇐⇒⇦⇨➜➔▶◀▸▾▴▼‹›✓✔✗✕✖×●○★☆•☰⋮⋯⨯\\u{1F300}-\\u{1FAFF}\\u{2600}-\\u{27BF}]'

const GLYPH_MESSAGE = 'Use an icon from @components/ui/icons.'
const BUTTON_MESSAGE = 'Use Button or IconButton.'

const base = {
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
  plugins: { react },
}

const lucideRestriction = {
  name: 'lucide-react',
  message: 'Import icons from @components/ui/icons.',
}

const featureCode = {
  ...base,
  files: ['src/**/*.{ts,tsx}'],
  ignores: ['src/components/ui/**', '**/*.test.{ts,tsx}'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        paths: [lucideRestriction],
        patterns: [
          { group: ['@heroui/react', '@heroui/react/*'], message: 'Use Spinner from @components/ui/spinner.' },
        ],
      },
    ],
    'react/forbid-elements': [
      'error',
      {
        forbid: [
          { element: 'button', message: BUTTON_MESSAGE },
          { element: 'svg', message: 'Use an icon from @components/ui/icons.' },
          { element: 'input', message: 'Use TextInput, Checkbox or Radio from @components/ui.' },
          { element: 'select', message: 'Add a primitive to @components/ui first.' },
          { element: 'textarea', message: 'Add a primitive to @components/ui first.' },
        ],
      },
    ],
    'no-restricted-syntax': [
      'error',
      {
        selector: "JSXAttribute[name.name='className'] :matches(Literal)[value=/\\bbtn-|chip-delete/]",
        message: BUTTON_MESSAGE,
      },
      {
        selector: "JSXAttribute[name.name='className'] TemplateElement[value.cooked=/\\bbtn-|chip-delete/]",
        message: BUTTON_MESSAGE,
      },
      { selector: `JSXText[value=/${GLYPHS}/u]`, message: GLYPH_MESSAGE },
      { selector: `Literal[value=/${GLYPHS}/u]`, message: GLYPH_MESSAGE },
      { selector: `TemplateElement[value.cooked=/${GLYPHS}/u]`, message: GLYPH_MESSAGE },
    ],
  },
}

const library = {
  ...base,
  files: ['src/components/ui/**/*.{ts,tsx}'],
  ignores: ['src/components/ui/icons/**', '**/*.test.{ts,tsx}'],
  rules: {
    'no-restricted-imports': ['error', { paths: [lucideRestriction] }],
    'react/forbid-elements': [
      'error',
      { forbid: [{ element: 'svg', message: 'Use an icon from @components/ui/icons.' }] },
    ],
  },
}

const iconLibrary = {
  ...base,
  files: ['src/components/ui/icons/**'],
  rules: {},
}

module.exports = [featureCode, library, iconLibrary]
