import { readFileSync } from 'node:fs'

const { version } = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url)).toString(),
)

export const VERSION = version as string

export const DEFAULT_MAIN_FIELDS = [
  'module',
  'jsnext:main', // moment still uses this...
  'jsnext',
]

export const DEFAULT_EXTENSIONS = [
  '.mjs',
  '.js',
  '.mts',
  '.ts',
  '.jsx',
  '.tsx',
  '.json',
]

export const INPUT_FILENAME = '{index,main,app}.{js,mjs,cjs,ts,mts,cts}'
export const DEFAULT_CONFIG_INPUT = [INPUT_FILENAME, `src/${INPUT_FILENAME}`]

export const DEFAULT_CONFIG_FILE = 'sptr.config.{js,mjs,cjs,ts,mts,cts}'

export const DEFAULT_CONFIG_FILES = [
  'sptr.config.js',
  'sptr.config.mjs',
  'sptr.config.ts',
  'sptr.config.cjs',
  'sptr.config.mts',
  'sptr.config.cts',
]
