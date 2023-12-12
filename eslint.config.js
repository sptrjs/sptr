// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    ignores: [
    "**/.vitepress/cache/**"
    ],
  },
	{
		rules:{
			"no-console": "off",
		}
	},
  {
    rules: {
      'node/prefer-global/process': 'off',
    },
  },
)
