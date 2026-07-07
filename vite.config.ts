import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
const isAndroid = process.platform === 'android'

const cloudflarePlugin = !isAndroid
  ? (await import('@cloudflare/vite-plugin')).cloudflare({ viteEnvironment: { name: 'ssr' } })
  : null

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    cloudflarePlugin,
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ].filter(Boolean),
})

export default config

