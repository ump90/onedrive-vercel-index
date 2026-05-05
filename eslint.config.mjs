import nextVitals from 'eslint-config-next/core-web-vitals'
import prettier from 'eslint-config-prettier'

const config = [
  ...nextVitals,
  prettier,
  {
    ignores: ['.next/**', '.pnpm-store/**', 'cloudflare-worker/**', 'next-env.d.ts', 'node_modules/**'],
  },
]

export default config
