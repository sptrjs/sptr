import fs from 'node:fs'
import path from 'node:path'
import type { Alias } from '@rollup/plugin-alias'
import type { AliasOptions } from '../types/alias'

export type { RollupNodeResolveOptions } from '@rollup/plugin-node-resolve'
export { type FilterPattern, createFilter, normalizePath } from '@rollup/pluginutils'
export type {
  ExternalOption as RollupExternalOption,
  InputOption as RollupInputOption,
  OutputOptions as RollupOutputOptions,
  ModuleFormat as RollupModuleFormat,
  Plugin,
  RollupBuild,
  RollupOptions,
  RollupOutput,
  RollupError,
} from 'rollup'

export type SptrScope = `sptr:${string}`
export type MaybeArray<T> = T | T[]
export type MaybePromise<T> = T | Promise<T>
export type MaybeGetter<T> = T | (() => MaybePromise<T>)

export const isArray = Array.isArray
export function isMap(val: unknown): val is Map<any, any> {
  return toTypeString(val) === '[object Map]'
}

export function isSet(val: unknown): val is Set<any> {
  return toTypeString(val) === '[object Set]'
}

export function isDate(val: unknown): val is Date {
  return toTypeString(val) === '[object Date]'
}

export function isRegExp(val: unknown): val is RegExp {
  return toTypeString(val) === '[object RegExp]'
}

export function isFunction(val: unknown): val is Function {
  return typeof val === 'function'
}

export function isString(val: unknown): val is string {
  return typeof val === 'string'
}

export function isSymbol(val: unknown): val is symbol {
  return typeof val === 'symbol'
}

export function isObject(val: unknown): val is Record<any, any> {
  return val !== null && typeof val === 'object'
}

export function isPromise<T = any>(val: unknown): val is Promise<T> {
  return (
    (isObject(val) || isFunction(val))
    && isFunction((val as any).then)
    && isFunction((val as any).catch)
  )
}

export const objectToString = Object.prototype.toString
export function toTypeString(value: unknown): string {
  return objectToString.call(value)
}

export function inArray<T>(val: MaybeArray<T>): T[] {
  return isArray(val) ? val : [val]
}

export function unArray<T>(val: T | T[]): T | T[] {
  return isArray(val)
    ? val.length === 1 ? val[0] : val
    : val
}

export function unDepArray<T>(val: T | T[]): T | T[] {
  return isArray(val)
    ? val.length === 1 ? unDepArray(val[0]) : val
    : val
}

export type MaybeFunc<T> = SptrOptionsFunction<T> | T

export type SptrOptionsFunction<T> = (args: Record<string, any>) => MaybePromise<T>

interface LookupFileOptions {
  pathOnly?: boolean
  rootDir?: string
  predicate?: (file: string) => boolean
}

export function lookupFile(dir: string, formats: string[], options?: LookupFileOptions): string | undefined {
  for (const format of formats) {
    const fullPath = path.join(dir, format)
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      const result = options?.pathOnly
        ? fullPath
        : fs.readFileSync(fullPath, 'utf-8')
      if (!options?.predicate || options.predicate(result))
        return result
    }
  }
  const parentDir = path.dirname(dir)
  if (
    parentDir !== dir
    && (!options?.rootDir || parentDir.startsWith(options?.rootDir))
  )
    return lookupFile(parentDir, formats, options)
}

export function emptyDir(dir: string, skip?: string[]): void {
  const skipInDir: string[] = []
  let nested: Map<string, string[]> | null = null

  if (skip?.length) {
    for (const file of skip) {
      if (path.dirname(file) !== '.') {
        const matched = file.match(/(.+?)[\\/](.+)/)
        if (matched) {
          nested ??= new Map()
          const [, nestedDir, skipPath] = matched
          let nestedSkip = nested.get(nestedDir)
          if (!nestedSkip) {
            nestedSkip = []
            nested.set(nestedDir, nestedSkip)
          }
          if (!nestedSkip.includes(skipPath))
            nestedSkip.push(skipPath)
        }
      }
      else {
        skipInDir.push(file)
      }
    }
  }

  for (const file of fs.readdirSync(dir)) {
    if (skipInDir.includes(file))
      continue

    if (nested?.has(file))
      emptyDir(path.resolve(dir, file), nested.get(file))
    else
      fs.rmSync(path.resolve(dir, file), { recursive: true, force: true })
  }
}

function mergeConfigRecursively(defaults: Record<string, any>, overrides: Record<string, any>, rootPath: string): Record<string, any> {
  const merged: Record<string, any> = { ...defaults }
  for (const key in overrides) {
    const value = overrides[key]
    if (value == null)
      continue

    const existing = merged[key]
    if (existing == null) {
      merged[key] = value
      continue
    }

    if (Array.isArray(existing) || Array.isArray(value)) {
      merged[key] = [...inArray(existing ?? []), ...inArray(value ?? [])]
      continue
    }
    if (isObject(existing) && isObject(value)) {
      merged[key] = mergeConfigRecursively(
        existing,
        value,
        rootPath ? `${rootPath}.${key}` : key,
      )
      continue
    }
  }
  return merged
}

export function mergeConfig(defaults: Record<string, any>, overrides: Record<string, any>, isRoot = true): Record<string, any> {
  return mergeConfigRecursively(defaults, overrides, isRoot ? '' : '.')
}

export function mergeAlias(a?: AliasOptions, b?: AliasOptions): AliasOptions | undefined {
  if (!a)
    return b
  if (!b)
    return a
  if (isObject(a) && isObject(b))
    return { ...a, ...b }

  // the order is flipped because the alias is resolved from top-down,
  // where the later should have higher priority
  return [...normalizeAlias(b), ...normalizeAlias(a)]
}

export function normalizeAlias(o: AliasOptions = []): Alias[] {
  return Array.isArray(o)
    ? o.map(normalizeSingleAlias)
    : Object.keys(o).map(find =>
      normalizeSingleAlias({
        find,
        replacement: (o as any)[find],
      }),
    )
}

function normalizeSingleAlias({ find, replacement, customResolver }: Alias): Alias {
  if (
    typeof find === 'string'
      && find.endsWith('/')
      && replacement.endsWith('/')
  ) {
    find = find.slice(0, find.length - 1)
    replacement = replacement.slice(0, replacement.length - 1)
  }

  const alias: Alias = {
    find,
    replacement,
  }
  if (customResolver)
    alias.customResolver = customResolver

  return alias
}

export function tryStatSync(file: string): fs.Stats | undefined {
  try {
    return fs.statSync(file, { throwIfNoEntry: false })
  }
  catch {
  }
}
