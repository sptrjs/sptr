import fs from 'node:fs'
import path from 'node:path'
import dts from 'rollup-plugin-dts'
import colors from 'picocolors'
import type { OutputAsset, OutputChunk } from './interface'
import { resolveAllConfig } from './config'
import type { RollupError } from './utils'
import { emptyDir, normalizePath } from './utils'

import { writeFileInfo } from './utils/reporter'
import type {
  InlineConfig,
  ResolvedConfig,
  RollupBuild,
  RollupModuleFormat,
  RollupOptions,
  RollupOutputOptions,
} from '.'
import { isArray, isObject, unArray } from '.'

const parallelBuilds: RollupBuild[] = []

export async function build(inlineConfig: InlineConfig = {}) {
  try {
    return await doBuild(inlineConfig)
  }
  finally {
    await Promise.all(parallelBuilds.map(bundle => bundle.close()))
  }
}

export async function doBuild(inlineConfig: InlineConfig) {
  const configs = await resolveAllConfig(inlineConfig)

  try {
    const bundles = await Promise.all(configs.map(async config => await rollupBuild(config)))

    // 清空目录
    prepareOutDir(configs)

    const output = [...new Set(...await Promise.all(bundles.map(async bundle => await bundle.start())))]

    bundles.map(async bundle => await bundle.close())

    return { output }
  }
  catch (e) {
    outputBuildError(e)
  }
}

function inputFilter(input: RollupOptions['input'], filter: (id: string) => boolean) {
  if (!input)
    return undefined
  if (isArray(input))
    return input.filter(filter)

  else if (isObject(input))
    return Object.fromEntries(Object.entries(input).filter(([_, value]) => filter(value)))

  return filter(input) ? input : undefined
}

async function rollupBuild(resolveConfig: ResolvedConfig) {
  const { rollup } = await import('rollup')
  const rollupOptions = await resolveInputOptions(resolveConfig)
  const bundle = await rollup(rollupOptions)

  let dtsBundle: RollupBuild
  if (resolveConfig.dts !== false) {
    rollupOptions.input = inputFilter(rollupOptions.input, resolveConfig.dts.filter)
    dtsBundle = await rollup(Object.assign(rollupOptions, { plugins: [dts(resolveConfig.dts || {})] }))
  }

  return {
    async close() {
      for (const bd of [bundle, dtsBundle])
        bd && await bd.close()
    },
    async start() {
      const out: (OutputChunk | OutputAsset)[] = []

      for (const format of resolveConfig.formats) {
        const { output } = await bundle[resolveConfig.write ? 'write' : 'generate'](resolvedOutputOptions(resolveConfig, format))
        out.push(...output)

        if (dtsBundle) {
          const { output: dtsOutput } = await dtsBundle[resolveConfig.write ? 'write' : 'generate']({
            dir: resolveConfig.outDir,
            entryFileNames: `[name].d.${format === 'cjs' ? 'c' : ''}ts`,
            chunkFileNames: `chunks/dep-[hash].d.ts`,
          })
          out.push(...dtsOutput)
        }
      }

      if (resolveConfig.write)
        await writeFileInfo({ output: out })

      return out
    },
  }
}

async function resolveInputOptions(config: ResolvedConfig, overrideConfig?: RollupOptions): Promise<RollupOptions> {
  const { input, plugins, external } = config
  const output = config.formats.map(format => resolvedOutputOptions(config, format))
  return {
    external,
    input,
    plugins: await plugins(config),
    onwarn() { },
    output: unArray(output),
    ...overrideConfig,
  }
}

function resolvedOutputOptions(config: ResolvedConfig, format: RollupModuleFormat): RollupOutputOptions {
  const jsExt = format === 'cjs' ? 'cjs' : 'js'

  return {
    assetFileNames: '[name].[ext]',
    chunkFileNames: `chunks/dep-[hash].${jsExt}`,
    dir: config.outDir,
    entryFileNames: `[name].${jsExt}`,
    exports: 'auto',
    externalLiveBindings: false,
    format,
    freeze: false,
    generatedCode: { constBindings: true },
    interop: 'compat',
    sourcemap: config.sourcemap,
  }
}

export function prepareOutDir(configs: ResolvedConfig[]): void {
  const outDirs = []
  let outside = false
  for (const config of configs) {
    if (config.write === true) {
      const outDir = path.resolve(config.root, config.outDir)
      outDirs.push(outDir)

      if (config.emptyOutDir === null) {
        if (
          fs.existsSync(outDir)
          && !normalizePath(outDir).startsWith(`${config.root}/`)
        ) {
          // warn if outDir is outside of root
          config.logger.warn(
            colors.yellow(
              `\n${colors.bold('(!)')} outDir ${colors.white(
                colors.dim(outDir),
              )} is not inside project root and will not be emptied.\n`
              + 'Use --emptyOutDir to override.\n',
            ),
          )
          outside = true
          break
        }
      }
    }
  }

  for (const config of configs) {
    const outDir = path.resolve(config.root, config.outDir)
    if (
      !outside
      && config.write === true
      && config.emptyOutDir !== false
      && fs.existsSync(outDir)
    ) {
      const skipDirs = outDirs
        .map((dir) => {
          const relative = path.relative(outDir, dir)
          if (
            relative !== ''
            && !relative.startsWith('..')
            && !path.isAbsolute(relative)
          )
            return relative

          return ''
        })
        .filter(Boolean)
      emptyDir(outDir, [...skipDirs, '.git'])
    }
  }
}

export function outputBuildError(e: RollupError): void {
  let msg = colors.red((e.plugin != null ? `[${e.plugin}] ` : '') + e.message)
  if (e.id != null) {
    msg += `\nfile: ${colors.cyan(
      e.id + (e.loc != null ? `:${e.loc.line}:${e.loc.column}` : ''),
    )}`
  }
  if (e.frame != null)
    msg += `\n${colors.yellow(e.frame)}`

  console.log('outputBuildError')
  console.error(msg, { error: e })
}
