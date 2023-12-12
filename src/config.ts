import path from 'node:path'
import { globSync } from 'glob'
import jiti from 'jiti'
import type { Alias, AliasOptions } from './types/alias'
import { type LogLevel, type Logger, createLogger } from './support/logger'
import {
  inArray,
  isArray,
  isEsmToPath,
  isFunction,
  isPromise,
  isString,
  mergeConfig,
  normalizePath,
} from './utils'

import {
  DEFAULT_CONFIG_FILE,
  DEFAULT_CONFIG_INPUT,
  DEFAULT_EXTENSIONS,
  DEFAULT_MAIN_FIELDS,
} from './constants'

import type { DefineOptions } from './types'

import { fullPlugins } from './plugins'
import type {
  MaybeArray,
  MaybeFunc,
  Plugin,
  RollupExternalOption,
  RollupInputOption,
  RollupNodeResolveOptions,
  RollupOptions,
  RollupOutputOptions,
} from '.'

// 配置
export interface SptrOptions {
  root?: string

  input?: RollupOptions['input']

  define?: DefineOptions

  resolve?: ResolveOptions

  outDir?: string

  emptyOutDir?: boolean

  cjs?: CjsOptions | false

  external?: RollupOptions['external']

  sourcemap?: RollupOutputOptions['sourcemap'] | false

  plugins?: Plugin[]

  write?: boolean

  logLevel?: LogLevel

  customLogger?: Logger

  clearScreen?: boolean
}

export interface ResolveOptions {
  alias?: AliasOptions

  dedupe?: RollupNodeResolveOptions['dedupe']

  mainFields?: RollupNodeResolveOptions['mainFields']

  extensions?: RollupNodeResolveOptions['extensions']
}

export interface CjsOptions {

}

export interface InlineConfig extends SptrOptions {
  configFile?: string | false
}

export function defineConfig<T extends MaybeFunc<MaybeArray<SptrOptions>>>(config: T): T {
  return config
}

export type FullConfig = Readonly<Omit<SptrOptions, 'plugins' | 'external'> & {
  configFile: string | undefined
  root: string
  outDir: string
  external: RollupExternalOption
  input: RollupOptions['input']
  inlineConfig: InlineConfig
  resolve: Required<ResolveOptions> & {
    alias: Alias[]
  }
  plugins: readonly Plugin[]
  logger: Logger
}
>

// 补全配置
export async function fullConfig(inlineConfig: InlineConfig): Promise<FullConfig[]> {
  let fileConfig = inArray(inlineConfig)

  const resolvedRoot = normalizePath(
    (inlineConfig.root != null) ? path.resolve(inlineConfig.root) : process.cwd(),
  )

  const configEnv = {}
  const { configFile } = inlineConfig
  if (configFile !== false) {
    const loadResults = await loadConfigFromEnumFile(
      configEnv,
      configFile,
      inlineConfig.root,
    )

    if (loadResults != null) {
      const res = []
      for (const result of loadResults) {
        res.push(
          ...result.config.map(c => ({
            configFile: result.path,
            ...mergeConfig(c, inlineConfig),
          })),
        )
      }
      fileConfig = res
    }
  }

  const logger = createLogger(inlineConfig.logLevel, {
    allowClearScreen: inlineConfig.clearScreen,
    customLogger: inlineConfig.customLogger,
  })

  // 用户配置和默认配置合并
  const fulls: FullConfig[] = []
  for (const full of fileConfig) {
    const resolveOptions: FullConfig['resolve'] = {
      extensions: full.resolve?.extensions ?? DEFAULT_EXTENSIONS,
      dedupe: full.resolve?.dedupe ?? [],
      mainFields: full.resolve?.mainFields ?? DEFAULT_MAIN_FIELDS,
      alias: [],
    }
    const root = full.root ?? resolvedRoot
    const c: FullConfig = {
      inlineConfig: full,
      configFile: full.configFile ? normalizePath(full.configFile) : undefined,
      root,
      input: await resolveInput(full.input ?? DEFAULT_CONFIG_INPUT, root),
      external: [],
      define: {},
      resolve: resolveOptions,
      outDir: full.outDir ?? 'dist',
      cjs: full.cjs ?? {},
      sourcemap: full.sourcemap ?? false,
      plugins: full.plugins ?? [],
      write: full.write ?? true,
      logger: createLogger(full.logLevel, {
        allowClearScreen: full.clearScreen,
        customLogger: full.customLogger ?? logger,
      }),
    };

    (c.plugins as Plugin[]) = fullPlugins(c, c.plugins)

    fulls.push(c)
  }

  return fulls
}

async function resolveInput(input: RollupInputOption, root: string) {
  if (isArray(input) || isString(input))
    return globSync(inArray(input), { cwd: root })

  return input
}

export async function loadConfigFromEnumFile(env: any, configFile?: string, configRoot: string = process.cwd()) {
  const resolvedPath = globSync(configFile ?? DEFAULT_CONFIG_FILE, {
    cwd: configRoot,
  })

  if (resolvedPath.length === 0)
    return

  const isESM = isEsmToPath(resolvedPath[0])

  const res = []
  for (const p of resolvedPath) {
    const filePath = path.resolve(configRoot, p)
    const fileConfig = await load(filePath, isESM)
    const config = await toUserConfig(fileConfig)
    res.push({
      path: normalizePath(filePath),
      config,
      dependencies: null,
    })
  }

  return res
}

export async function load(fileName: string, isESM: boolean): Promise<MaybeFunc<MaybeArray<SptrOptions>>> {
  return jiti(fileName, { interopDefault: true, esmResolve: isESM })(fileName)
}

export async function toUserConfig(userConfig: MaybeFunc<MaybeArray<SptrOptions>>, args: Record<string, any> = {}): Promise<SptrOptions[]> {
  let config
  if (isFunction(userConfig)) {
    const result = userConfig(args)
    config = inArray(isPromise(result) ? await result : result)
  }
  else {
    config = inArray(userConfig)
  }

  return config
}
