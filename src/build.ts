import fs from 'node:fs'
import path from 'node:path'
import colors from 'picocolors'
import { fullConfig } from './config'
import {
  emptyDir,
  inArray,
  isFunction,
  normalizePath,
} from './utils'
import type {
  FullConfig,
  InlineConfig,
  Plugin,
  RollupError,
  RollupModuleFormat,
  RollupOptions,
  RollupOutput,
  RollupOutputOptions,
} from '.'

export function getPkg(id = ''): string {
  const s = id.split('/')
  return s[0][0] === '@' ? `${s[0]}/${s[1]}` : s[0]
}

export function arrayIncludes(
  external: Array<string | RegExp>,
  searchElement: string,
): boolean {
  return external.some(entry =>
    entry instanceof RegExp
      ? entry.test(searchElement)
      : entry === searchElement,
  )
}

export async function build(
  inlineConfig: InlineConfig = {},
): Promise<RollupOutput[]> {
  const configs = await fullConfig(inlineConfig)

  try {
    const { rollup } = await import('rollup')

    const res = []
    for (const config of configs) {
      const plugins = config.plugins as Plugin[]
      const input = config.input
      const external = (
        id: string,
        importer: string | undefined,
        isResolved: boolean,
      ) => {
        let isExplicitExternal
        if (isFunction(config.external)) {
          isExplicitExternal = config.external(id, importer, isResolved)
          if (isExplicitExternal !== undefined)
            return isExplicitExternal
        }
        else {
          const pkg = getPkg(id)
          isExplicitExternal
            = arrayIncludes(inArray(config.external), pkg)
            || arrayIncludes(inArray(config.external), id)
          if (isExplicitExternal)
            return true
        }

        if (id[0] === '.' || path.isAbsolute(id) || /src[/\\]/.test(id))
          return false

        if (isExplicitExternal === false)
          return true
          // DEBUG console.log(`Inlined implicit external ${id}`);

        return isExplicitExternal
      }

      const rollupOptions: RollupOptions = {
        external,
        input,
        plugins,
      }

      const bundle = await rollup(rollupOptions)

      const generate = async (output: RollupOutputOptions): Promise<RollupOutput> => {
        return await bundle[config.write === true ? 'write' : 'generate'](
          output,
        )
      }

      const formats: RollupModuleFormat[] = ['esm']
      if (config.cjs !== false)
        formats.push('cjs')

      for (const format of formats) {
        const jsExt = format === 'cjs' ? 'cjs' : 'js'
        const outputOptions: RollupOutputOptions = {
          dir: config.outDir,
          format,
          sourcemap: config.sourcemap,
          externalLiveBindings: false,
          freeze: false,
          entryFileNames: `[name].${jsExt}`,
          chunkFileNames: `chunks/dep-[hash].${jsExt}`,
          assetFileNames: '[name].[ext]',
        }

        res.push({
          bundle,
          output: outputOptions,
          generate: async () => {
            return await generate(outputOptions)
          },
        })
      }
    }

    // 清空目录
    prepareOutDir(configs)

    return await Promise.all(res.map(async r => await r.generate()))
  }
  catch (e) {
    outputBuildError(e)
    throw e
  }
}

function prepareOutDir(configs: FullConfig[]): void {
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

function outputBuildError(e: RollupError): void {
  let msg = colors.red((e.plugin != null ? `[${e.plugin}] ` : '') + e.message)
  if (e.id != null) {
    msg += `\nfile: ${colors.cyan(
      e.id + (e.loc != null ? `:${e.loc.line}:${e.loc.column}` : ''),
    )}`
  }
  if (e.frame != null)
    msg += `\n${colors.yellow(e.frame)}`

  console.error(msg, { error: e })
}
