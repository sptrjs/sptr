import type { Replacement, RollupReplaceOptions } from '@rollup/plugin-replace'

export type DefineOptions = Record<
  string,
  | Replacement
  | RollupReplaceOptions['include']
  | RollupReplaceOptions['values']
  | RollupReplaceOptions['preventAssignment']
>
