import path from 'node:path'
import { globSync } from 'glob'
import type { ModuleFormat } from 'rollup'
import type { RollupInputOption } from '../utils'
import { createFilter, inArray, isArray, isFunction, isString, mergeConfig, normalizePath } from '../utils'
import type { Logger } from '../utils/logger'
import { createLogger } from '../utils/logger'
import { fullPlugins } from '../plugins'
import { DEFAULT_CONFIG_INPUT, DEFAULT_EXTENSIONS, DEFAULT_MAIN_FIELDS, type InlineConfig, type ResolvedConfig } from './constants'
import { loadConfigFromEnumFile } from './utils'

export async function resolveAllConfig(inlineConfig: InlineConfig): Promise<ResolvedConfig[]> {
  let fileConfig = inArray(inlineConfig)

  const rootDir = normalizePath(process.cwd())

  const configEnv = {}
  const { configFile } = inlineConfig
  if (configFile !== false) {
    const loadResults = await loadConfigFromEnumFile(
      configEnv,
      configFile,
      rootDir,
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
    allowClearScreen: false,
    customLogger: inlineConfig.customLogger,
  })

  return await Promise.all(
    fileConfig.map(async config =>
      resolvedConfig(config, rootDir, logger)),
  )
}

async function resolvedConfig(inlineConfig: InlineConfig, root: string, logger: Logger): Promise<ResolvedConfig> {
  // logger
  const resolveOptions: ResolvedConfig['resolve'] = {
    extensions: inlineConfig.resolve?.extensions ?? DEFAULT_EXTENSIONS,
    dedupe: inlineConfig.resolve?.dedupe ?? [],
    mainFields: inlineConfig.resolve?.mainFields ?? DEFAULT_MAIN_FIELDS,
    alias: [],
  }

  const formats: ModuleFormat[] = ['esm']

  inlineConfig.cjs !== false && formats.push('cjs')

  let dts
  if (inlineConfig.dts) {
    const { include, exclude } = inlineConfig.dts
    dts = {
      filter: createFilter(include, exclude),
    }
  }

  return {
    inlineConfig,

    configFile: inlineConfig.configFile ? normalizePath(inlineConfig.configFile) : undefined,

    root,

    input: await resolveInput(inlineConfig.input ?? DEFAULT_CONFIG_INPUT, root),

    external: isFunction(inlineConfig.external) ? inlineConfig.external : resolvedExternal(inlineConfig.external),

    define: inlineConfig.define ?? {},

    formats,

    dts: dts ?? false,

    resolve: resolveOptions,

    outDir: inlineConfig.outDir ?? 'dist',

    cjs: inlineConfig.cjs ?? {},

    sourcemap: inlineConfig.sourcemap ?? false,

    plugins: async (resolveConfig: ResolvedConfig) => await fullPlugins(resolveConfig, inlineConfig.plugins),

    write: inlineConfig.write ?? true,

    logger: createLogger(inlineConfig.logLevel, {
      allowClearScreen: false,
      customLogger: inlineConfig.customLogger ?? logger,
    }),
  }
}

async function resolveInput(input: RollupInputOption, root: string) {
  if (isArray(input) || isString(input))
    return globSync(inArray(input), { cwd: root })

  return input
}

export function getPkg(id = '') {
  const s = id.split('/')
  return s[0][0] === '@' ? `${s[0]}/${s[1]}` : s[0]
}

function resolvedExternal(external:
  | (string | RegExp)[]
  | string
  | RegExp = /node_modules/) {
  // code...

  return (id: string) => {
    const pkg = getPkg(id)
    console.log('pkg', pkg)

    const isExplicitExternal
			= arrayIncludes(inArray(external), pkg)
			|| arrayIncludes(inArray(external), id)

    if (isExplicitExternal)
      return true

    if (id[0] === '.' || path.isAbsolute(id) || /src[/\\]/.test(id))
      return false

    if (!isExplicitExternal)
      console.warn(`Inlined implicit external ${id}`)

    return isExplicitExternal
  }
}

function arrayIncludes(external: Array<string | RegExp>, searchElement: string): boolean {
  return external.some(entry =>
    entry instanceof RegExp
      ? entry.test(searchElement)
      : entry === searchElement,
  )
}
