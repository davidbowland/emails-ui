/** @jest-environment node */
import { ESLint } from 'eslint'

const libraryRules = require('../../eslint/library-rules.cjs')

const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: libraryRules })

const FEATURE = 'src/components/feature/index.tsx'
const FEATURE_TEST = 'src/components/feature/index.test.tsx'
const LIBRARY = 'src/components/ui/thing/index.tsx'
const ICONS = 'src/components/ui/icons/index.tsx'

const errorCount = async (code: string, filePath: string): Promise<number> => {
  const [result] = await eslint.lintText(code, { filePath })
  return result.messages.filter((m) => m.severity === 2).length
}

const forbidden: ReadonlyArray<readonly [string, string, string]> = [
  ['lucide-react import', "import { Mail } from 'lucide-react'\nexport const a = Mail", FEATURE],
  ['@heroui/react import', "import { Spinner } from '@heroui/react'\nexport const a = Spinner", FEATURE],
  ['button', 'export const A = () => <button>Go</button>', FEATURE],
  ['svg', 'export const A = () => <svg />', FEATURE],
  ['input', 'export const A = () => <input />', FEATURE],
  ['select', 'export const A = () => <select />', FEATURE],
  ['textarea', 'export const A = () => <textarea />', FEATURE],
  ['btn- class string', "export const A = () => <div className='btn-primary' />", FEATURE],
  ['btn- class template', 'export const A = (p: string) => <div className={`x btn-${p}`} />', FEATURE],
  ['chip-delete class', "export const A = () => <div className='chip-delete' />", FEATURE],
  ['glyph in JSX text', 'export const A = () => <div>Close ✕</div>', FEATURE],
  ['glyph in string literal', "export const a = 'Next →'", FEATURE],
  [
    '@heroui/react subpath import',
    "import { Spinner } from '@heroui/react/spinner'\nexport const a = Spinner",
    FEATURE,
  ],
  ['glyph in template literal', 'export const a = (x: string) => `done ✓ ${x}`', FEATURE],
  ['lucide-react in library', "import { Mail } from 'lucide-react'\nexport const a = Mail", LIBRARY],
  ['svg in library', 'export const A = () => <svg />', LIBRARY],
]

const allowed: ReadonlyArray<readonly [string, string, string]> = [
  ['lucide-react import in a test', "import { Mail } from 'lucide-react'\nexport const a = Mail", FEATURE_TEST],
  ['@heroui/react import in a test', "import { Spinner } from '@heroui/react'\nexport const a = Spinner", FEATURE_TEST],
  ['button in a test', 'export const A = () => <button>Go</button>', FEATURE_TEST],
  ['svg in a test', 'export const A = () => <svg />', FEATURE_TEST],
  ['input in a test', 'export const A = () => <input />', FEATURE_TEST],
  ['select in a test', 'export const A = () => <select />', FEATURE_TEST],
  ['textarea in a test', 'export const A = () => <textarea />', FEATURE_TEST],
  ['btn- class in a test', "export const A = () => <div className='btn-primary' />", FEATURE_TEST],
  ['chip-delete class in a test', "export const A = () => <div className='chip-delete' />", FEATURE_TEST],
  ['glyph in JSX text in a test', 'export const A = () => <div>Close ✕</div>', FEATURE_TEST],
  ['glyph in a string in a test', "export const a = 'Next →'", FEATURE_TEST],
  ['button in the library', 'export const A = () => <button>Go</button>', LIBRARY],
  ['input in the library', 'export const A = () => <input />', LIBRARY],
  ['btn- class in the library', "export const A = () => <div className='btn-primary' />", LIBRARY],
  ['glyph in the library', "export const a = 'Next →'", LIBRARY],
  ['lucide-react in the icon library', "import { Mail } from 'lucide-react'\nexport const a = Mail", ICONS],
  ['svg in the icon library', 'export const A = () => <svg />', ICONS],
  [
    'lucide-react in a library test',
    "import { Mail } from 'lucide-react'\nexport const a = Mail",
    'src/components/ui/thing/index.test.tsx',
  ],
  ['svg in a library test', 'export const A = () => <svg />', 'src/components/ui/thing/index.test.tsx'],
]

describe('library lint rules', () => {
  it.each(forbidden)('reports exactly one error for %s', async (_name, code, filePath) => {
    expect(await errorCount(code, filePath)).toBe(1)
  })

  it.each(allowed)('allows %s', async (_name, code, filePath) => {
    expect(await errorCount(code, filePath)).toBe(0)
  })
})
