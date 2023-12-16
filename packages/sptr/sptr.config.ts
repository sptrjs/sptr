import { defineConfig } from './src'

export default defineConfig({
  input: {
    index: 'src/index.ts',
    cli: 'src/cli.ts',
    constants: 'src/constants.ts',
  },
  dts: {
    include: /src\/index.ts$/,
  },
})
