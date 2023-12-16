import { promisify } from 'node:util'
import { gzip } from 'node:zlib'
import colors from 'picocolors'
import type { SptrOutput } from '../interface'

const compress = promisify(gzip)
const chunkLimit = 500

const groups = [
  { name: 'Assets', color: colors.green },
  { name: 'CSS', color: colors.magenta },
  { name: 'JS', color: colors.cyan },
  { name: 'DTS', color: colors.cyan },
]

async function getCompressedSize(code: string | Uint8Array) {
  const compressed = await compress(
    // eslint-disable-next-line node/prefer-global/buffer
    typeof code === 'string' ? code : Buffer.from(code),
  )
  return compressed.length
}

const numberFormatter = new Intl.NumberFormat('en', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
})
function displaySize(bytes: number) {
  return `${numberFormatter.format(bytes / 1000)} kB`
}

export async function writeFileInfo(output: SptrOutput) {
  const entries = await Promise.all(
    output.output.map(async (chunk) => {
      if (chunk.type === 'chunk') {
        const isDTS = chunk.fileName.endsWith('.d.ts')
        return {
          name: chunk.fileName,
          group: isDTS ? 'DTS' : 'JS',
          size: chunk.code.length,
          compressedSize: await getCompressedSize(chunk.code),
          mapSize: chunk.map ? chunk.map.toString().length : null,
        }
      }
      const isCSS = chunk.fileName.endsWith('.css')
      return {
        name: chunk.fileName,
        group: isCSS ? 'CSS' : 'Assets',
        size: chunk.source.length,
        mapSize: null, // Rollup doesn't support CSS maps?
        compressedSize: await getCompressedSize(chunk.source),
      }
    }),
  )

  let longest = 0
  let biggestSize = 0
  let biggestMap = 0
  let biggestCompressSize = 0
  for (const entry of entries) {
    if (entry.name.length > longest)
      longest = entry.name.length
    if (entry.size > biggestSize)
      biggestSize = entry.size
    if (entry.mapSize && entry.mapSize > biggestMap)
      biggestMap = entry.mapSize

    if (
      entry.compressedSize
      && entry.compressedSize > biggestCompressSize
    )
      biggestCompressSize = entry.compressedSize
  }

  const sizePad = displaySize(biggestSize).length
  const mapPad = displaySize(biggestMap).length
  const compressPad = displaySize(biggestCompressSize).length

  // const relativeOutDir = normalizePath(
  //   path.relative(
  //     config.root,
  //     path.resolve(config.root, outDir ?? config.build.outDir),
  //   ),
  // )

  for (const group of groups) {
    const filtered = entries.filter(e => e.group === group.name)
    if (!filtered.length)
      continue

    for (const entry of filtered.sort((a, z) => a.size - z.size)) {
      const isLarge
					= group.name === 'JS' && entry.size / 1000 > chunkLimit

      const sizeColor = isLarge ? colors.yellow : colors.dim
      let log = ''// colors.dim(withTrailingSlash(relativeOutDir))
      log += group.color(entry.name.padEnd(longest + 2))
      log += colors.bold(
        sizeColor(displaySize(entry.size).padStart(sizePad)),
      )
      if (entry.compressedSize) {
        log += colors.dim(
						` │ gzip: ${displaySize(entry.compressedSize).padStart(
							compressPad,
						)}`,
        )
      }
      if (entry.mapSize) {
        log += colors.dim(
						` │ map: ${displaySize(entry.mapSize).padStart(mapPad)}`,
        )
      }

      console.log(log)
      // config.logger.info(log)
    }
  }
}
export function withTrailingSlash(path: string): string {
  if (path[path.length - 1] !== '/')
    return `${path}/`

  return path
}
