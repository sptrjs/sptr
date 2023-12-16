import path from 'node:path'
import jiti from 'jiti'
import { globSync } from 'glob'
import { type MaybeArray, type MaybeFunc, inArray, isFunction, isPromise, lookupFile, normalizePath } from '../utils'
import { DEFAULT_CONFIG_FILE } from './constants'
import type { UserConfig } from './constants'

export async function loadConfigFromEnumFile(env: any, configFile?: string, configRoot: string = process.cwd()) {
  const resolvedPath = globSync(configFile ?? DEFAULT_CONFIG_FILE, {
    cwd: configRoot,
  })

  if (resolvedPath.length === 0)
    return

  return await Promise.all(
    resolvedPath.map(async p =>
      await loadConfigFromFile(
        path.resolve(configRoot, p),
        isEsmToPath(resolvedPath[0]),
      )),
  )
}

export function isEsmToPath(filePath: string, def: boolean = false): boolean {
  if (/\.m[jt]s$/.test(filePath)) {
    return true
  }
  else if (/\.c[jt]s$/.test(filePath)) {
    return false
  }
  else {
    try {
      const pkg = lookupFile(path.dirname(filePath), ['package.json'])
      return !!pkg && JSON.parse(pkg).type === 'module'
    }
    catch (e) {}
  }
  return def
}

export async function loadConfigFromFile(configFile: string, isESM: boolean) {
  const fileConfig = await load(configFile, isESM)
  const config = await toUserConfig(fileConfig)

  return {
    path: normalizePath(configFile),
    config,
    dependencies: null,
  }
}

export async function load(fileName: string, isESM: boolean): Promise<MaybeFunc<MaybeArray<UserConfig>>> {
  return jiti(fileName, { interopDefault: true, esmResolve: isESM })(fileName)
}

export async function toUserConfig(userConfig: MaybeFunc<MaybeArray<UserConfig>>, args: Record<string, any> = {}): Promise<UserConfig[]> {
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
