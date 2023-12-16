import type { MaybeArray, MaybeFunc } from '..'
import type { UserConfig } from './constants'

export * from './constants'
export * from './config'

export function defineConfig<T extends MaybeFunc<MaybeArray<UserConfig>>>(config: T): T {
  return config
}
