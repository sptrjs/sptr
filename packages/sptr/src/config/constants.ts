import type { Plugin, RollupExternalOption, RollupModuleFormat, RollupNodeResolveOptions, RollupOptions, RollupOutputOptions } from '..'
import type { Alias, AliasOptions, DefineOptions, DtsOptions } from '../types'

import type { LogLevel, Logger } from '../utils/logger'

export interface UserConfig {

  input?: RollupOptions['input']

  define?: DefineOptions

  formats?: RollupModuleFormat[]

  outDir?: string

  external?: RollupOptions['external']

  cjs?: CjsOptions | false

  dts?: DtsOptions | false

  resolve?: ResolveOptions

  sourcemap?: RollupOutputOptions['sourcemap'] | false

  plugins?: Plugin[]

  emptyOutDir?: boolean

  write?: boolean

  logLevel?: LogLevel

  customLogger?: Logger

}

export interface ResolveOptions {
  alias?: AliasOptions

  dedupe?: RollupNodeResolveOptions['dedupe']

  mainFields?: RollupNodeResolveOptions['mainFields']

  extensions?: RollupNodeResolveOptions['extensions']
}

export interface CjsOptions {
}

export interface InlineConfig extends UserConfig {
  configFile?: string | false
}

export type ResolvedConfig = Readonly<Omit<UserConfig, 'plugins' | 'external'> & {
  configFile: string | undefined
  root: string
  outDir: string
  formats: RollupModuleFormat[]
  external: RollupExternalOption
  input: RollupOptions['input']
  inlineConfig: InlineConfig
  dts: DtsOptions & { filter: (id: string) => boolean } | false
  resolve: Required<ResolveOptions> & {
    alias: Alias[]
  }
  plugins: (config: ResolvedConfig) => Promise<Plugin[]>
  logger: Logger
}
>

const INPUT_FILENAME = '{index,main,app}.{js,mjs,cjs,ts,mts,cts}'
export const DEFAULT_CONFIG_INPUT = [INPUT_FILENAME, `src/${INPUT_FILENAME}`]

export const DEFAULT_EXTENSIONS = [
  '.mjs',
  '.js',
  '.mts',
  '.ts',
  '.jsx',
  '.tsx',
  '.json',
]

export const DEFAULT_MAIN_FIELDS = [
  'module',
  'jsnext:main', // moment still uses this...
  'jsnext',
]

export const DEFAULT_CONFIG_FILE = 'sptr.config.{js,mjs,cjs,ts,mts,cts}'
