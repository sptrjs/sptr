import { type InlineConfig, resolveAllConfig } from '.'

export async function stub(inlineConfig: InlineConfig = {}) {
  const configs = await resolveAllConfig(inlineConfig)

  for (const config of configs)
    console.log(config)
}
