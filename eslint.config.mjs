import nextVitals from 'eslint-config-next/core-web-vitals'
import prettier from 'eslint-config-prettier'

const config = [
  ...nextVitals,
  prettier,
  {
    ignores: ['.next/**', 'cloudflare-worker/**', 'next-env.d.ts'],
  },
]

export default config
