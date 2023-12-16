import type ts from 'typescript'
import type { FilterPattern } from '@rollup/pluginutils'

export interface DtsOptions {
  include?: FilterPattern
  exclude?: FilterPattern

  respectExternal?: boolean

  compilerOptions?: ts.CompilerOptions

  tsconfig?: string
}
