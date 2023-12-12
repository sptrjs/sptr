import { describe } from 'vitest'

import colors from 'picocolors'
import { createLogger } from '../src/support/logger'

describe('logger', () => {
  const logger = createLogger('info', {
    allowClearScreen: true,
  })

  it('logger info', () => {
    logger.info(
      colors.cyan(`vite v1.0.1 ${colors.green(`building for dev...`)}`),
      { clear: true, timestamp: true },
    )
  })
})
