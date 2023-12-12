import { cac } from 'cac'
import { VERSION } from './constants'

const cli = cac('sptr')

cli
  .option('-c, --config <file>', '[string] use specified config file')
  .option('--base <path>', '[string] public base path (default: /)')
  .option('-f, --filter <filter>', '[string] filter debug logs')
  .option('-m, --mode <mode>', '[string] set env mode')

cli
  .command('[root]', 'start build')
  .alias('build')
  .option('--noCjs', '[boolean] do not compile cjs format')
  .action(async (root: string, options: { noCjs: boolean }) => {
    const { build } = await import('./build')

    try {
      await build({
        root,
        cjs: options.noCjs ? false : undefined,
      })
    }
    catch (e) {
      console.error(e)
      process.exit(1)
    }
  })

cli.help()
cli.version(VERSION)

cli.parse()
