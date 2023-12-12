import { describe, expect, it } from 'vitest'
import { loadConfigFromEnumFile } from '../src'

describe('config', () => {
  it('loadConfigFromEnumFile', async () => {
    console.log(process.cwd())
    expect(
      (
        await loadConfigFromEnumFile(
          {},
          'sptr.config.ts',
          'D:\\Code\\Typescript\\sptr-design-vue\\packages\\cli',
        )
      )?.length,
    ).toBe(1)
  })
})
