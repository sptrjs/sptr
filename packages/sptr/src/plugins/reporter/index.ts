import path from 'node:path'
import colors from 'picocolors'
import type { ResolvedConfig } from '../../'
import type { InsidePlugin } from '..'

export function isDefined<T>(value: T | undefined | null): value is T {
  return value != null
}

export function withTrailingSlash(path: string): string {
  if (path[path.length - 1] !== '/')
    return `${path}/`

  return path
}

export function reporterPlugin(config: ResolvedConfig): InsidePlugin {
  let transformedCount = 0
  let startTime = Date.now()
  let buildFailed = false

  const logTransform = throttle((id: string) => {
    writeLine(
			`transforming (${transformedCount}) ${colors.dim(
				path.relative(config.root, id),
			)}`,
    )
  })

  return {
    name: 'sptr:reporter',

    /**
     * 可以被用来转换单个模块。
     * 为了防止额外的解析开销，例如，这个钩子已经使用 this.parse 生成了一个 AST，
     * 这个钩子可以选择返回一个 { code, ast, map } 对象。
     * ast 必须是一个标准的 ESTree AST，
     * 每个节点都有 start 和 end 属性。
     * 如果转换不移动代码，你可以通过将 map 设置为 null 来保留现有的 sourcemaps。
     * 否则，你可能需要生成源映射。请参阅 源代码转换 部分。
     */
    transform(_, id) {
      transformedCount++
      logTransform(id)
    },

    /**
     * 替换或操作传递给 rollup.rollup 的选项对象。
     * 返回 null 不会替换任何内容。
     * 如果只需要读取选项，则建议使用 buildStart 钩子，
     * 因为该钩子可以访问所有 options 钩子的转换考虑后的选项。
     */
    options() {
      startTime = Date.now()
    },

    /**
     * 在每个 rollup.rollup 构建上调用。
     * 当你需要访问传递给 rollup.rollup() 的选项时，
     * 建议使用此钩子，因为它考虑了所有 options 钩子的转换，并且还包含未设置选项的正确默认值
     */
    buildStart() {
      transformedCount = 0
    },

    // 在 Rollup 完成产物但尚未调用 generate 或 write 之前调用；
    // 也可以返回一个 Promise。如果在构建过程中发生错误，则将其传递给此钩子。
    buildEnd(error?: Error) {
      buildFailed = !!error

      clearLine()

      config.logger.info(
				`${colors.green(`✓`)} ${transformedCount} modules transformed.`,
      )
    },

    // 每次调用 bundle.generate() 或 bundle.write() 时最初调用。
    renderStart() {
    },

    /**
     * 可以用于转换单个块。
     * 对于每个 Rollup 输出块文件都会调用此函数。
     * 返回 null 将不应用任何转换。
     * 如果你在此钩子中更改了代码并希望支持源映射，则需要返回一个描述更改的map，
     * 请参见 源代码转换 部分。
     */
    renderChunk() {
      return null
    },

    /**
     * 在 bundle.generate() 结束时或在 bundle.write() 写入文件之前立即调用。
     * 要在写入文件后修改文件，请使用 writeBundle 钩子。bundle 提供正在写入或生成的文件的完整列表以及它们的详细信息。
     *
     * 你可以通过在此钩子中从产物对象中删除它们来防止文件被产出。
     * 要产出其他文件，请使用 this.emitFile 插件上下文函数。
     */
    generateBundle() {
      clearLine()
    },

    /**
     * 仅在 bundle.write() 结束时调用，一旦所有文件都已写入。
     * 与 generateBundle 钩子类似，
     * bundle 提供正在写入的所有文件的完整列表以及它们的详细信息。
     */
    async writeBundle() {},

    /**
     * 可用于清理可能正在运行的任何外部服务。
     * Rollup 的 CLI 将确保在每次运行后调用此钩子，但是 JavaScript API 的用户有责任在生成产物后手动调用 bundle.close()。
     * 因此，任何依赖此功能的插件都应在其文档中仔细提到这一点。
     */
    closeBundle() {
      if (!buildFailed) {
        config.logger.info(
					`${colors.green(
						`✓ built in ${displayTime(Date.now() - startTime)}`,
					)}`,
        )
      }
    },
  }
}

function writeLine(output: string) {
  clearLine()
  if (output.length < process.stdout.columns)
    process.stdout.write(output)

  else
    process.stdout.write(output.substring(0, process.stdout.columns - 1))
}

function clearLine() {
  process.stdout.clearLine(0)
  process.stdout.cursorTo(0)
}

function throttle(fn: Function) {
  let timerHandle: NodeJS.Timeout | null = null
  return (...args: any[]) => {
    if (timerHandle)
      return
    fn(...args)
    timerHandle = setTimeout(() => {
      timerHandle = null
    }, 100)
  }
}

function displayTime(time: number) {
  // display: {X}ms
  if (time < 1000)
    return `${time}ms`

  time = time / 1000

  // display: {X}s
  if (time < 60)
    return `${time.toFixed(2)}s`

  const mins = Number.parseInt((time / 60).toString())
  const seconds = time % 60

  // display: {X}m {Y}s
  return `${mins}m${seconds < 1 ? '' : ` ${seconds.toFixed(0)}s`}`
}
